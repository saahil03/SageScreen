import { useEffect, useRef, useState, useCallback } from 'react';
import type { Message, Session } from '@shared/schema';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error');
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect');
    }
  }, []);

  const handleMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'session_created':
        setSession({
          id: data.sessionId,
          laptopId: '',
          phoneId: null,
          connectionCode: data.connectionCode,
          isActive: false,
          createdAt: new Date(),
          connectedAt: null,
        });
        break;

      case 'session_joined':
        setSession(prev => prev ? { ...prev, isActive: true, connectedAt: new Date() } : null);
        break;

      case 'phone_connected':
        setSession(prev => prev ? { ...prev, isActive: true, connectedAt: new Date() } : null);
        break;

      case 'message_received':
        setMessages(prev => [...prev, data.message]);
        break;

      case 'session_disconnected':
        setSession(prev => prev ? { ...prev, isActive: false } : null);
        break;

      case 'webrtc_signal':
        // Handle WebRTC signaling
        window.dispatchEvent(new CustomEvent('webrtc-signal', { detail: data.signal }));
        break;

      case 'error':
        setError(data.message);
        break;
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const createSession = useCallback(() => {
    sendMessage({ type: 'create_session' });
  }, [sendMessage]);

  const joinSession = useCallback((connectionCode: string) => {
    sendMessage({ type: 'join_session', connectionCode });
  }, [sendMessage]);

  const sendChatMessage = useCallback((content: string, sender: 'user' | 'ai') => {
    sendMessage({ type: 'send_message', content, sender });
  }, [sendMessage]);

  const sendWebRTCSignal = useCallback((signal: any) => {
    sendMessage({ type: 'webrtc_signal', signal });
  }, [sendMessage]);

  const disconnectSession = useCallback(() => {
    sendMessage({ type: 'disconnect_session' });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    session,
    messages,
    error,
    createSession,
    joinSession,
    sendChatMessage,
    sendWebRTCSignal,
    disconnectSession,
  };
}
