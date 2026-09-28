import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Store, User, MapPin, Shield } from 'lucide-react';
import { Conversation } from './types';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

export function ConversationItem({ conversation, isSelected, onSelect }: ConversationItemProps) {
  const hasUnread = conversation.unreadCount > 0;

  return (
    <div
      className={`p-3.5 sm:p-4 border-b border-slate-100 cursor-pointer transition-all duration-150 select-none ${
        isSelected
          ? 'bg-blue-50/80 border-l-4 border-l-blue-600 shadow-2xs'
          : 'hover:bg-slate-50/90 border-l-4 border-l-transparent bg-white'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* Contact Avatar */}
        <Avatar className="h-11 w-11 border-2 border-white shadow-2xs shrink-0 mt-0.5">
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

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <h4
              className={`text-sm sm:text-[15px] truncate leading-snug ${
                hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
              }`}
            >
              {conversation.participantName}
            </h4>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 shrink-0">
              {conversation.lastMessageTime}
            </span>
          </div>

          {/* Location or Role tag */}
          {conversation.participantLocation ? (
            <div className="flex items-center gap-1 text-slate-500 mb-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-xs truncate font-medium">{conversation.participantLocation}</span>
            </div>
          ) : (
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-1">
              {conversation.participantType === 'pharmacy' ? 'Accredited Pharmacy' : conversation.participantType === 'admin' ? 'Official Support' : 'Patient'}
            </div>
          )}

          {/* Last message preview & unread badge */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p
              className={`text-xs sm:text-[13px] truncate ${
                hasUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-600'
              }`}
            >
              {conversation.lastMessage}
            </p>
            {hasUnread && (
              <Badge className="bg-blue-600 text-white rounded-full text-xs font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center shrink-0 shadow-xs">
                {conversation.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}