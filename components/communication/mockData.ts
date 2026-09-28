import { Conversation } from './types';

export const createMockConversations = (userType: 'patient' | 'pharmacy' | null): Conversation[] => [
  {
    id: '1',
    participantId: '1',
    participantName: userType === 'patient' ? 'Pharmacie Centrale' : 'John Doe',
    participantType: userType === 'patient' ? 'pharmacy' : 'patient',
    participantLocation: userType === 'patient' ? 'Douala, Akwa' : 'Douala, Cameroon',
    lastMessage: 'Is Paracetamol 500mg available?',
    lastMessageTime: '2 hours ago',
    unreadCount: 2,
    status: 'active',
    messages: [
      {
        id: '1',
        senderId: userType === 'patient' ? 'current_user' : '1',
        senderName: userType === 'patient' ? 'You' : 'John Doe',
        senderType: userType === 'patient' ? 'patient' : 'patient',
        content: 'Hello, is Paracetamol 500mg available?',
        timestamp: '2 hours ago',
        read: true
      },
      {
        id: '2',
        senderId: userType === 'patient' ? '1' : 'current_user',
        senderName: userType === 'patient' ? 'Pharmacie Centrale' : 'You',
        senderType: userType === 'patient' ? 'pharmacy' : 'pharmacy',
        content: 'Yes, we have it in stock. Price is 500 FCFA per pack.',
        timestamp: '1 hour ago',
        read: true
      },
      {
        id: '3',
        senderId: userType === 'patient' ? 'current_user' : '1',
        senderName: userType === 'patient' ? 'You' : 'John Doe',
        senderType: userType === 'patient' ? 'patient' : 'patient',
        content: 'Great! Can you reserve 2 packs for me?',
        timestamp: '30 minutes ago',
        read: false
      }
    ]
  },
  {
    id: '2',
    participantId: '2',
    participantName: userType === 'patient' ? 'Pharmacie du Marché' : 'Marie Kamga',
    participantType: userType === 'patient' ? 'pharmacy' : 'patient',
    participantLocation: userType === 'patient' ? 'Yaoundé, Centre' : 'Yaoundé, Cameroon',
    lastMessage: 'Thank you for the information about Amoxicillin.',
    lastMessageTime: '1 day ago',
    unreadCount: 0,
    status: 'closed',
    messages: [
      {
        id: '4',
        senderId: userType === 'patient' ? 'current_user' : '2',
        senderName: userType === 'patient' ? 'You' : 'Marie Kamga',
        senderType: userType === 'patient' ? 'patient' : 'patient',
        content: 'Do you have Amoxicillin 250mg in stock?',
        timestamp: '1 day ago',
        read: true
      },
      {
        id: '5',
        senderId: userType === 'patient' ? '2' : 'current_user',
        senderName: userType === 'patient' ? 'Pharmacie du Marché' : 'You',
        senderType: userType === 'patient' ? 'pharmacy' : 'pharmacy',
        content: 'Yes, we have it available. Price is 1200 FCFA.',
        timestamp: '1 day ago',
        read: true
      },
      {
        id: '6',
        senderId: userType === 'patient' ? 'current_user' : '2',
        senderName: userType === 'patient' ? 'You' : 'Marie Kamga',
        senderType: userType === 'patient' ? 'patient' : 'patient',
        content: 'Thank you for the information about Amoxicillin.',
        timestamp: '1 day ago',
        read: true
      }
    ]
  }
];

export const getDefaultNewMessageData = () => ({
  recipientType: 'pharmacy' as 'patient' | 'pharmacy',
  recipientId: '',
  subject: '',
  content: ''
});