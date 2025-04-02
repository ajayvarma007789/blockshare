import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  cid: text("cid").notNull().unique(), // Content ID from Filecoin
  encryptionKey: text("encryption_key").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  status: text("status").notNull().default("encrypted"),
});

// File shares
export const fileShares = pgTable("file_shares", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => files.id),
  userId: integer("user_id").notNull().references(() => users.id),
  permission: text("permission").notNull(), // view, edit, download
  createdAt: timestamp("created_at").defaultNow(),
});

// Share links
export const shareLinks = pgTable("share_links", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull().references(() => files.id),
  linkToken: text("link_token").notNull().unique(),
  requiresPassword: boolean("requires_password").default(false),
  password: text("password"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blockchain transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  txId: text("tx_id").notNull(),
  cid: text("cid").notNull(),
  fileId: integer("file_id").references(() => files.id),
  type: text("type").notNull(), // store, retrieve
  status: text("status").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
});

// Stats table for dashboard
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  filesUploaded: integer("files_uploaded").default(0),
  filesShared: integer("files_shared").default(0),
  storageUsed: integer("storage_used").default(0), // in bytes
  downloads: integer("downloads").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadedAt: true,
  status: true,
});

export const insertFileShareSchema = createInsertSchema(fileShares).omit({
  id: true,
  createdAt: true,
});

export const insertShareLinkSchema = createInsertSchema(shareLinks).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

// Types using z.infer
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertFileShare = z.infer<typeof insertFileShareSchema>;
export type InsertShareLink = z.infer<typeof insertShareLinkSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Types using table inference
export type User = typeof users.$inferSelect;
export type File = typeof files.$inferSelect & { owner: string };
export type FileShare = typeof fileShares.$inferSelect;
export type ShareLink = typeof shareLinks.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Stat = typeof stats.$inferSelect;
