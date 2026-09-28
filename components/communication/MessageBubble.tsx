import { Check, CheckCheck, Store, Shield, User } from 'lucide-react';
import { Message } from './types';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  return (
    <div className={`flex items-end gap-2.5 mb-3.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {/* Left Avatar for other participants */}
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 shrink-0 border border-slate-200 shadow-2xs mb-0.5">
          <AvatarFallback className={
            message.senderType === 'pharmacy'
              ? 'bg-blue-50 text-blue-600'
              : message.senderType === 'admin'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-emerald-50 text-emerald-600'
          }>
            {message.senderType === 'pharmacy' ? (
              <Store className="w-4 h-4 text-blue-600" />
            ) : message.senderType === 'admin' ? (
              <Shield className="w-4 h-4 text-amber-600" />
            ) : (
              <User className="w-4 h-4 text-emerald-600" />
            )}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[84%] sm:max-w-[72%] px-4 py-3 rounded-2xl transition-all ${
          isCurrentUser
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-sm shadow-blue-500/10'
            : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-xs'
        }`}
      >
        {/* Sender Name Badge for incoming message */}
        {!isCurrentUser && message.senderName && message.senderName !== 'Contact' && (
          <div className="mb-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
              {message.senderName}
            </span>
          </div>
        )}

        {/* Message Content with High Contrast and Enhanced Typography */}
        <p className={`text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words select-text ${
          isCurrentUser ? 'text-white font-normal' : 'text-slate-900 font-normal'
        }`}>
          {message.content}
        </p>

        {/* Timestamp and Delivery Receipts */}
        <div
          className={`flex items-center gap-1.5 mt-2 text-[11px] sm:text-xs select-none ${
            isCurrentUser ? 'text-blue-100/90 justify-end' : 'text-slate-500 justify-start'
          }`}
        >
          <span className="font-medium">{message.timestamp}</span>
          {isCurrentUser && (
            <div className="flex items-center">
              {message.read ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-200" title="Read" />
              ) : (
                <Check className="w-3.5 h-3.5 text-blue-200/80" title="Sent" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}