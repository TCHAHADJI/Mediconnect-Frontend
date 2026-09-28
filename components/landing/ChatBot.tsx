import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { translations } from './constants';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  language?: 'en' | 'fr';
}

export function ChatBot({ language = 'en' }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const t = translations[language].chatbot;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t.initialGreeting,
      isBot: true,
      timestamp: new Date()
    }
  ]);

  // Update initial message when language changes
  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: translations[language].chatbot.initialGreeting,
        isBot: true,
        timestamp: new Date()
      }
    ]);
  }, [language]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const responses = t.responses;

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl border-2 border-white text-white transform hover:scale-110 transition-all duration-200"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-95 transition-all duration-300 shadow-2xl border-2 border-blue-200 rounded-t-4xl ${
        isMinimized ? 'h-16' : 'h-120'
      }`}>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{t.headerTitle}</CardTitle>
                <p className="text-xs text-blue-100">{t.headerSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-6 h-6 text-white hover:bg-white/20"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <>
            <CardContent className="p-0 h-78 overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[80%] ${
                      message.isBot ? '' : 'flex-row-reverse'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.isBot 
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
                          : 'bg-gradient-to-br from-green-600 to-blue-600 text-white'
                      }`}>
                        {message.isBot ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      </div>
                      <div className={`p-3 rounded-xl text-sm leading-relaxed shadow-sm ${
                        message.isBot
                          ? 'bg-white text-gray-800 border border-blue-100'
                          : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                      }`}>
                        {message.text}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[80%]">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3" />
                      </div>
                      <div className="bg-white border border-blue-100 p-3 rounded-xl shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <div className="p-4 border-t bg-white rounded-b-lg">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.inputPlaceholder}
                  className="flex-1 border-blue-200 focus:border-blue-400 bg-blue-50/50 rounded-2xl"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  disabled={!inputValue.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-2 flex justify-center">
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Powered by MediConnect AI
                </Badge>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}