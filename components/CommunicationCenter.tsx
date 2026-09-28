import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CommunicationCenterProps, Conversation, Message, NewMessageData, UserType } from './communication/types';
import { getDefaultNewMessageData } from './communication/mockData';
import { ConversationList } from './communication/ConversationList';
import { ChatArea } from './communication/ChatArea';
import { NewMessageDialog } from './communication/NewMessageDialog';
import { EmptyState } from './communication/EmptyState';
import { Loader2 } from 'lucide-react';

export function CommunicationCenter({ userType }: CommunicationCenterProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);
  const [newMessageData, setNewMessageData] = useState<NewMessageData>(getDefaultNewMessageData());
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Keep ref to avoid stale state in polling interval
  const selectedConversationRef = useRef<Conversation | null>(null);
  selectedConversationRef.current = selectedConversation;

  const getAuthToken = (): string | null => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.token) return parsed.token;
      } catch (e) {
        console.error('Error parsing userSession token:', e);
      }
    }
    const adminAuth = localStorage.getItem('mediconnect_admin_auth');
    if (adminAuth) {
      try {
        const parsed = JSON.parse(adminAuth);
        if (parsed.token) return parsed.token;
      } catch (e) {
        console.error('Error parsing adminAuth token:', e);
      }
    }
    return null;
  };

  const getCurrentUserId = (): string | null => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.user) return parsed.user.id || parsed.user._id;
      } catch (e) {}
    }
    const adminAuth = localStorage.getItem('mediconnect_admin_auth');
    if (adminAuth) {
      try {
        const parsed = JSON.parse(adminAuth);
        if (parsed.user) return parsed.user.id || parsed.user._id;
      } catch (e) {}
    }
    return null;
  };

  // 1. Fetch conversations from database
  const fetchConversations = async (silent = false) => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (!silent) setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load conversations');

      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setConversations(result.data);

        // Keep current selected conversation updated or select first one on initial load
        if (selectedConversationRef.current) {
          const currentId = selectedConversationRef.current.id;
          const updated = result.data.find((c: Conversation) => c.id === currentId);
          if (updated) {
            setSelectedConversation(prev =>
              prev ? { ...prev, ...updated, messages: prev.messages } : null
            );
          }
        } else if (result.data.length > 0 && !silent) {
          handleConversationSelect(result.data[0]);
        }
      }
    } catch (err: any) {
      if (!silent) {
        console.error('Error loading conversations:', err);
        toast.error('Failed to load conversations from the server');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // 2. Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string, silent = false) => {
    const token = getAuthToken();
    if (!token || !conversationId) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setSelectedConversation(prev => {
          if (!prev || prev.id !== conversationId) return prev;
          return {
            ...prev,
            unreadCount: 0,
            messages: result.data,
          };
        });

        // Clear unread badge in list
        setConversations(prev =>
          prev.map(c => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      if (!silent) console.error('Error loading messages:', err);
    }
  };

  // Initial load and periodic polling every 3.5 seconds
  useEffect(() => {
    fetchConversations();

    const interval = setInterval(() => {
      fetchConversations(true);
      if (selectedConversationRef.current) {
        fetchMessages(selectedConversationRef.current.id, true);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // 3. Send message in current conversation
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const token = getAuthToken();
    if (!token) {
      toast.error('Please sign in to send messages');
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const currentUserId = getCurrentUserId();
    const optimisticMsg: Message = {
      id: `temp_${Date.now()}`,
      senderId: currentUserId || 'current_user',
      senderName: 'You',
      senderType: userType || 'patient',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    // Optimistic UI update
    setSelectedConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        lastMessage: messageText,
        lastMessageTime: optimisticMsg.timestamp,
        messages: [...prev.messages, optimisticMsg],
      };
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          recipientId: selectedConversation.participantId,
          content: messageText,
        }),
      });

      if (!res.ok) throw new Error('Failed to deliver message');

      const result = await res.json();
      if (result.success) {
        // Refresh conversation messages after short delay to capture automated or live responses
        setTimeout(() => {
          if (selectedConversationRef.current) {
            fetchMessages(selectedConversationRef.current.id, true);
          }
        }, 1800);
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending message');
    } finally {
      setIsSending(false);
    }
  };

  // 4. Start new conversation
  const handleStartNewConversation = async () => {
    if (!newMessageData.recipientId) {
      toast.error('Please choose a recipient');
      return;
    }
    if (!newMessageData.content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('Please sign in to send messages');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: newMessageData.recipientId,
          content: newMessageData.content.trim(),
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Message sent! Conversation created.');
        setIsNewMessageDialogOpen(false);
        setNewMessageData(getDefaultNewMessageData());

        // Refresh conversations and select newly created conversation
        await fetchConversations(true);
        const newConvId = result.data.conversationId;
        if (newConvId) {
          fetchMessages(newConvId);
        }
      } else {
        throw new Error(result.message || 'Failed to start conversation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error starting conversation');
    }
  };

  // 5. Select conversation and mark as read
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation({ ...conversation, messages: [] });
    fetchMessages(conversation.id);

    // Mark as read on server
    const token = getAuthToken();
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/messages/conversations/${conversation.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const resolvedCurrentUserType: UserType = userType === 'pharmacy' ? 'PHARMACY' : 'PATIENT';

  return (
    <div className="h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-10rem)] min-h-[580px] flex border border-slate-200/90 rounded-3xl bg-white overflow-hidden shadow-sm">
      {/* Conversation List (shown full on mobile when no conversation is selected, or always on md+) */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full`}>
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onConversationSelect={handleConversationSelect}
          onNewMessageClick={() => setIsNewMessageDialogOpen(true)}
        />
      </div>

      {/* Chat Area or Empty State (shown full on mobile when conversation is selected, or always on md+) */}
      <div className={`${!selectedConversation ? 'hidden md:flex' : 'flex'} flex-1 h-full min-w-0`}>
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-semibold text-slate-800">Connecting to secure messaging...</p>
            <p className="text-xs text-slate-400 mt-1">Retrieving live conversations from MediConnect</p>
          </div>
        ) : selectedConversation ? (
          <ChatArea
            conversation={selectedConversation}
            newMessage={newMessage}
            currentUserId={getCurrentUserId()}
            onNewMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            onBackToList={() => setSelectedConversation(null)}
          />
        ) : (
          <EmptyState onNewChat={() => setIsNewMessageDialogOpen(true)} />
        )}
      </div>

      <NewMessageDialog
        isOpen={isNewMessageDialogOpen}
        onClose={() => setIsNewMessageDialogOpen(false)}
        data={newMessageData}
        onDataChange={setNewMessageData}
        onSend={handleStartNewConversation}
        currentUserType={resolvedCurrentUserType}
      />
    </div>
  );
}