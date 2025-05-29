import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  laptopId: text("laptop_id").notNull(),
  phoneId: text("phone_id"),
  connectionCode: text("connection_code").notNull().unique(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  connectedAt: timestamp("connected_at"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'user' or 'ai'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  laptopId: true,
  phoneId: true,
  connectionCode: true,
  isActive: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  content: true,
  sender: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
