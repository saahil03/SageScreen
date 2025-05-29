import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useScreenShare } from '@/hooks/useScreenShare';
import { Bot, User, Send, Settings, Wifi, WifiOff, Monitor } from 'lucide-react';
import type { Message } from '@shared/schema';

export default function MobileView() {
  const { isConnected, session, messages, sendChatMessage } = useWebSocket();
  const { remoteStream } = useScreenShare();
  const [inputMessage, setInputMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up video stream
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    sendChatMessage(inputMessage.trim(), 'user');
    setInputMessage('');
    
    // Show typing indicator
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    'Explain this section',
    'How does this work?',
    'What should I do next?',
    'What do these numbers mean?',
  ];

  const handleQuickQuestion = (question: string) => {
    sendChatMessage(question, 'user');
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'now';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6" />
            <div>
              <h1 className="font-semibold">AI Assistant</h1>
              <div className="flex items-center gap-1 text-xs opacity-90">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  session?.isActive ? 'bg-green-400' : 'bg-yellow-400'
                }`} />
                <span>
                  {session?.isActive ? 'Connected to Laptop' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-600"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Screen Preview */}
      <div className="p-4 border-b border-gray-200">
        <Card className="overflow-hidden">
          <div className="bg-gray-800 p-2 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <div className="text-white text-xs ml-2 flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Laptop Screen
            </div>
          </div>
          
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 relative">
            {remoteStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Waiting for screen share...</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Welcome Message */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <Card className="bg-gray-100">
                  <CardContent className="p-3">
                    <p className="text-sm">
                      Hi! I can see your laptop screen and help answer questions about what's displayed. What would you like to know?
                    </p>
                  </CardContent>
                </Card>
                <div className="text-xs text-gray-500 mt-1">AI Assistant • now</div>
              </div>
            </div>

            {/* Chat Messages */}
            {messages.map((message: Message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                  message.sender === 'user' ? 'bg-green-500' : 'bg-primary'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <Card className={message.sender === 'user' ? 'bg-primary text-white ml-auto' : 'bg-gray-100'}>
                    <CardContent className="p-3">
                      <p className="text-sm">{message.content}</p>
                    </CardContent>
                  </Card>
                  <div className={`text-xs text-gray-500 mt-1 ${
                    message.sender === 'user' ? 'text-right' : ''
                  }`}>
                    {message.sender === 'user' ? 'You' : 'AI Assistant'} • {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <Card className="bg-gray-100">
                    <CardContent className="p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1">
              <Textarea
                placeholder="Ask about what you see on screen..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="resize-none"
                rows={1}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !session?.isActive}
              size="sm"
              className="h-10 w-10 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickQuestions.map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuestion(question)}
                disabled={!session?.isActive}
                className="whitespace-nowrap text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute inset-0 bg-white z-10 transform transition-transform duration-300">
          <header className="bg-gray-50 p-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                ←
              </Button>
              <h2 className="font-semibold">Connection Settings</h2>
            </div>
          </header>

          <div className="p-4 space-y-6">
            {/* Connection Status */}
            <div>
              <h3 className="font-medium mb-3">Connection Status</h3>
              <Card className={session?.isActive ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      session?.isActive ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {session?.isActive ? 'Connected to Laptop' : 'Waiting for connection'}
                    </span>
                  </div>
                  {session && (
                    <div className="text-xs text-gray-600 mt-1">
                      Code: {session.connectionCode} • Encrypted connection
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Security Info */}
            <div>
              <h3 className="font-medium mb-3">Security</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">End-to-end encryption</span>
                  <Badge variant="secondary" className="text-green-600">✓</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Screen capture permissions</span>
                  <Badge variant="secondary" className="text-green-600">✓</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Local processing</span>
                  <Badge variant="secondary" className="text-green-600">✓</Badge>
                </div>
              </div>
            </div>

            {/* Connection Actions */}
            <div className="space-y-3">
              <Button className="w-full" disabled={!isConnected}>
                Refresh Connection
              </Button>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/pairing'}>
                Change Device
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
