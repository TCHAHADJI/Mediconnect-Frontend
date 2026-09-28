export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'pharmacy' | 'admin';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantType: 'patient' | 'pharmacy' | 'admin';
  participantLocation?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'closed';
  messages: Message[];
}

export interface NewMessageData {
  recipientType: 'patient' | 'pharmacy' | 'admin';
  recipientId: string;
  subject: string;
  content: string;
}

export interface CommunicationCenterProps {
  userType: 'patient' | 'pharmacy' | null;
}

export type UserType = 'PATIENT' | 'PHARMACY' | 'ADMIN' | 'HEALTH_AUTHORITY';

export interface Recipient {
  value: string;
  label: string;
  address?: string;
  phone?: string;
  userType?: string;
}