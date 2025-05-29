import { users, sessions, messages, type User, type InsertUser, type Session, type InsertSession, type Message, type InsertMessage } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createSession(session: InsertSession): Promise<Session>;
  getSessionByCode(code: string): Promise<Session | undefined>;
  getSessionById(id: number): Promise<Session | undefined>;
  updateSession(id: number, updates: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBySession(sessionId: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentMessageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = {
      id,
      laptopId: insertSession.laptopId,
      phoneId: insertSession.phoneId ?? null,
      connectionCode: insertSession.connectionCode,
      isActive: insertSession.isActive ?? null,
      createdAt: new Date(),
      connectedAt: null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSessionByCode(code: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      (session) => session.connectionCode === code
    );
  }

  async getSessionById(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async updateSession(id: number, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: number): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      id,
      sessionId: insertMessage.sessionId || null,
      content: insertMessage.content,
      sender: insertMessage.sender,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesBySession(sessionId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.sessionId === sessionId)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }
}

export const storage = new MemStorage();
