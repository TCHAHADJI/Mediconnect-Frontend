import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Store, User, MapPin, Send, MessageSquare, Shield, ArrowLeft, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Conversation } from './types';
import { MessageBubble } from './MessageBubble';

interface ChatAreaProps {
  conversation: Conversation;
  newMessage: string;
  currentUserId?: string | null;
  onNewMessageChange: (message: string) => void;
  onSendMessage: () => void;
  isSending?: boolean;
  onBackToList?: () => void;
}

const QUICK_SUGGESTIONS = [
  'Is this medicine in stock right now?',
  'Can I send a prescription for verification?',
  'What are your operating hours today?',
  'Can I pick up my order directly?',
];

export function ChatArea({
  conversation,
  newMessage,
  currentUserId,
  onNewMessageChange,
  onSendMessage,
  isSending = false,
  onBackToList,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() && !isSending) {
        onSendMessage();
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onNewMessageChange(suggestion);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 min-w-0">
      {/* Enhanced Chat Header with high contrast and complete details */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/90 bg-white flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Mobile Back Button */}
          {onBackToList && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToList}
              className="md:hidden h-9 w-9 rounded-xl text-slate-700 hover:bg-slate-100 shrink-0"
              title="Back to conversation list"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-slate-100 shadow-2xs shrink-0">
            <AvatarFallback
              className={
                conversation.participantType === 'pharmacy'
                  ? 'bg-blue-100 text-blue-700 font-bold'
                  : conversation.participantType === 'admin'
                  ? 'bg-amber-100 text-amber-700 font-bold'
                  : 'bg-emerald-100 text-emerald-700 font-bold'
              }
            >
              {conversation.participantType === 'pharmacy' ? (
                <Store className="w-5 h-5 text-blue-700" />
              ) : conversation.participantType === 'admin' ? (
                <Shield className="w-5 h-5 text-amber-700" />
              ) : (
                <User className="w-5 h-5 text-emerald-700" />
              )}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                {conversation.participantName}
              </h3>
              <Badge
                variant="outline"
                className="text-[11px] font-bold uppercase tracking-wider border-blue-200 text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-full shrink-0"
              >
                {conversation.participantType === 'pharmacy' ? 'Accredited' : conversation.participantType}
              </Badge>
            </div>

            {conversation.participantLocation ? (
              <div className="flex items-center gap-1.5 mt-0.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs font-medium truncate max-w-xs sm:max-w-md">
                  {conversation.participantLocation}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified MediConnect Member</span>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Active Direct Channel</span>
            <span className="sm:hidden">Active</span>
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1">
        {conversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="p-4 bg-white rounded-3xl shadow-xs border border-slate-200/80 mb-3">
              <MessageSquare className="w-10 h-10 text-blue-600 stroke-[1.8]" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">
              Start of your conversation with {conversation.participantName}
            </h4>
            <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-md">
              Ask about medicine availability, prices, reserve orders, or check your prescriptions in confidence.
            </p>
          </div>
        ) : (
          conversation.messages.map((message) => {
            const isCurrentUser =
              message.senderName === 'You' ||
              message.senderId === 'current_user' ||
              (currentUserId && message.senderId === currentUserId);

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={Boolean(isCurrentUser)}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions Bar */}
      <div className="px-3 sm:px-4 py-2 bg-white/70 backdrop-blur-xs border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Quick Ask:
        </span>
        {QUICK_SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            className="text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-200 px-3 py-1 rounded-full whitespace-nowrap transition-all active:scale-95"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newMessage.trim() && !isSending) {
              onSendMessage();
            }
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Write a message to ${conversation.participantName}...`}
            className="flex-1 rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium text-xs sm:text-sm h-12 focus-visible:border-blue-600 focus-visible:bg-white focus-visible:ring-0 transition-all"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-12 px-5 shadow-sm font-bold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4 stroke-[2.2]" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}