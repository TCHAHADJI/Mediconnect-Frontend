import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, MessageSquare, X } from 'lucide-react';
import { Conversation } from './types';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onConversationSelect: (conversation: Conversation) => void;
  onNewMessageClick: () => void;
}

export function ConversationList({
  conversations,
  selectedConversation,
  searchQuery,
  onSearchChange,
  onConversationSelect,
  onNewMessageClick,
}: ConversationListProps) {
  const filteredConversations = conversations.filter((conversation) =>
    conversation.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conversation.lastMessage && conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full md:w-88 lg:w-96 border-r border-slate-200/80 flex flex-col bg-white shrink-0 h-full">
      {/* Header & Quick Action */}
      <div className="p-4 sm:p-4.5 border-b border-slate-100 bg-white/80 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Messages
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Direct chat with partner pharmacies
            </p>
          </div>
          <Button
            size="sm"
            onClick={onNewMessageClick}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-9 px-3.5 shadow-sm text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            title="Start conversation with any pharmacy"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Chat</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search pharmacies or messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9.5 pr-8 h-10 rounded-xl bg-slate-50 border-slate-200/80 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 mb-3">
              <MessageSquare className="w-8 h-8 text-blue-500 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">No conversations found</p>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              {searchQuery
                ? `No match found for "${searchQuery}". Try searching for another name.`
                : 'Click "New Chat" to contact any accredited pharmacy on the platform.'}
            </p>
            {searchQuery ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSearchChange('')}
                className="rounded-xl text-xs font-semibold"
              >
                Clear Search
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onNewMessageClick}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold px-4"
              >
                Start First Conversation
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversation?.id === conversation.id}
              onSelect={() => onConversationSelect(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
}