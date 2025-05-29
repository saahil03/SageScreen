import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertSessionSchema, insertMessageSchema } from "@shared/schema";
import { generateAIResponse } from "./openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections
  const connections = new Map<string, { ws: WebSocket; sessionId?: number; deviceType?: 'laptop' | 'phone' }>();

  // Generate random connection code
  function generateConnectionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    const connectionId = Math.random().toString(36).substring(7);
    connections.set(connectionId, { ws });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const connection = connections.get(connectionId);

        switch (message.type) {
          case 'create_session':
            // Laptop creates a new session
            const code = generateConnectionCode();
            const session = await storage.createSession({
              laptopId: connectionId,
              phoneId: null,
              connectionCode: code,
              isActive: false,
            });
            
            connection!.sessionId = session.id;
            connection!.deviceType = 'laptop';
            connections.set(connectionId, connection!);

            ws.send(JSON.stringify({
              type: 'session_created',
              sessionId: session.id,
              connectionCode: code,
            }));
            break;

          case 'join_session':
            // Phone joins an existing session
            const { connectionCode } = message;
            const existingSession = await storage.getSessionByCode(connectionCode);
            
            if (!existingSession) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid connection code',
              }));
              return;
            }

            // Update session with phone connection
            const updatedSession = await storage.updateSession(existingSession.id, {
              phoneId: connectionId,
              isActive: true,
              connectedAt: new Date(),
            });

            connection!.sessionId = existingSession.id;
            connection!.deviceType = 'phone';
            connections.set(connectionId, connection!);

            // Notify both devices
            ws.send(JSON.stringify({
              type: 'session_joined',
              sessionId: existingSession.id,
            }));

            // Notify laptop
            const laptopConnection = Array.from(connections.values())
              .find(conn => conn.sessionId === existingSession.id && conn.deviceType === 'laptop');
            
            if (laptopConnection && laptopConnection.ws.readyState === WebSocket.OPEN) {
              laptopConnection.ws.send(JSON.stringify({
                type: 'phone_connected',
                sessionId: existingSession.id,
              }));
            }
            break;

          case 'send_message':
            // Handle chat messages
            if (!connection?.sessionId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'No active session',
              }));
              return;
            }

            const { content, sender } = message;
            const chatMessage = await storage.createMessage({
              sessionId: connection.sessionId,
              content,
              sender,
            });

            // Broadcast to all devices in the session
            const sessionConnections = Array.from(connections.values())
              .filter(conn => conn.sessionId === connection.sessionId);

            sessionConnections.forEach(conn => {
              if (conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.send(JSON.stringify({
                  type: 'message_received',
                  message: chatMessage,
                }));
              }
            });

            // Generate AI response for user messages
            if (sender === 'user') {
              setTimeout(async () => {
                try {
                  const aiResponse = await generateAIResponse(content);
                  const aiMessage = await storage.createMessage({
                    sessionId: connection.sessionId!,
                    content: aiResponse,
                    sender: 'ai',
                  });

                  sessionConnections.forEach(conn => {
                    if (conn.ws.readyState === WebSocket.OPEN) {
                      conn.ws.send(JSON.stringify({
                        type: 'message_received',
                        message: aiMessage,
                      }));
                    }
                  });
                } catch (error) {
                  console.error('Error generating AI response:', error);
                  const errorMessage = await storage.createMessage({
                    sessionId: connection.sessionId!,
                    content: "I'm having trouble processing your request right now. Please try again.",
                    sender: 'ai',
                  });

                  sessionConnections.forEach(conn => {
                    if (conn.ws.readyState === WebSocket.OPEN) {
                      conn.ws.send(JSON.stringify({
                        type: 'message_received',
                        message: errorMessage,
                      }));
                    }
                  });
                }
              }, 1500); // Simulate AI thinking time
            }
            break;

          case 'webrtc_signal':
            // Forward WebRTC signaling messages
            if (!connection?.sessionId) return;

            const targetConnections = Array.from(connections.values())
              .filter(conn => 
                conn.sessionId === connection.sessionId && 
                conn.deviceType !== connection.deviceType
              );

            targetConnections.forEach(conn => {
              if (conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.send(JSON.stringify({
                  type: 'webrtc_signal',
                  signal: message.signal,
                }));
              }
            });
            break;

          case 'disconnect_session':
            // Handle session disconnection
            if (connection?.sessionId) {
              await storage.updateSession(connection.sessionId, {
                isActive: false,
              });

              // Notify other devices in the session
              const sessionConnections = Array.from(connections.values())
                .filter(conn => conn.sessionId === connection.sessionId);

              sessionConnections.forEach(conn => {
                if (conn.ws.readyState === WebSocket.OPEN && conn !== connection) {
                  conn.ws.send(JSON.stringify({
                    type: 'session_disconnected',
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    ws.on('close', async () => {
      const connection = connections.get(connectionId);
      if (connection?.sessionId) {
        await storage.updateSession(connection.sessionId, {
          isActive: false,
        });

        // Notify other devices in the session
        const sessionConnections = Array.from(connections.values())
          .filter(conn => conn.sessionId === connection.sessionId);

        sessionConnections.forEach(conn => {
          if (conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify({
              type: 'session_disconnected',
            }));
          }
        });
      }
      connections.delete(connectionId);
    });
  });

  // REST API routes
  app.get('/api/sessions/:id/messages', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const messages = await storage.getMessagesBySession(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.get('/api/sessions/:code', async (req, res) => {
    try {
      const session = await storage.getSessionByCode(req.params.code);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch session' });
    }
  });

  return httpServer;
}
