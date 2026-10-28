import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export interface WSEvent {
  event_type: string;
  timestamp: string;
  payload: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: WSEvent | null;
  recentEvents: WSEvent[];
  subscribe: (eventType: string, callback: (payload: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<WSEvent[]>([]);
  const subscribersRef = useRef<Map<string, Set<(payload: any) => void>>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: any;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WSEvent = JSON.parse(event.data);
          setLastEvent(parsed);
          setRecentEvents((prev) => [parsed, ...prev.slice(0, 49)]);

          const callbacks = subscribersRef.current.get(parsed.event_type);
          if (callbacks) {
            callbacks.forEach((cb) => cb(parsed.payload));
          }
          const wildcardCallbacks = subscribersRef.current.get('*');
          if (wildcardCallbacks) {
            wildcardCallbacks.forEach((cb) => cb(parsed));
          }
        } catch {
          // Heartbeat pong or non-json message
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };
    };

    connect();

    // Ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send('ping');
      }
    }, 15000);

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const subscribe = (eventType: string, callback: (payload: any) => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(callback);

    return () => {
      subscribersRef.current.get(eventType)?.delete(callback);
    };
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, recentEvents, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
