import { 
  users, 
  files,
  fileShares,
  shareLinks,
  transactions,
  stats,
  type User, 
  type InsertUser, 
  type File,
  type InsertFile,
  type FileShare,
  type InsertFileShare,
  type ShareLink,
  type InsertShareLink,
  type Transaction,
  type InsertTransaction,
  type Stat
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getUserFiles(userId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<void>;
  checkFileAccess(fileId: number, userId: number): Promise<boolean>;
  
  // File sharing
  getSharedFiles(userId: number): Promise<File[]>;
  createFileShare(fileShare: InsertFileShare): Promise<FileShare>;
  createShareLink(shareLink: InsertShareLink): Promise<ShareLink>;
  getShareLink(token: string): Promise<ShareLink | undefined>;
  
  // Blockchain transactions
  logTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Stats
  createUserStats(userId: number): Promise<Stat>;
  getUserStats(userId: number): Promise<Stat | undefined>;
  updateUserStats(userId: number, updates: {
    filesUploaded?: number;
    filesShared?: number;
    storageUsed?: number;
    downloads?: number;
  }): Promise<Stat>;
}

// In-memory storage implementation for development
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private filesMap: Map<number, File>;
  private fileSharesMap: Map<number, FileShare>;
  private shareLinksMap: Map<number, ShareLink>;
  private transactionsMap: Map<number, Transaction>;
  private statsMap: Map<number, Stat>;
  private currentId: {
    users: number;
    files: number;
    fileShares: number;
    shareLinks: number;
    transactions: number;
    stats: number;
  };

  constructor() {
    this.usersMap = new Map();
    this.filesMap = new Map();
    this.fileSharesMap = new Map();
    this.shareLinksMap = new Map();
    this.transactionsMap = new Map();
    this.statsMap = new Map();
    this.currentId = {
      users: 1,
      files: 1,
      fileShares: 1,
      shareLinks: 1,
      transactions: 1,
      stats: 1,
    };
    
    // Create a default user for testing
    this.createUser({
      username: "testuser",
      password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // "password" hashed with SHA-256
      email: "test@example.com",
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const now = new Date();
    const user: User = { 
      ...userData, 
      id,
      createdAt: now
    };
    this.usersMap.set(id, user);
    return user;
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    const file = this.filesMap.get(id);
    if (!file) return undefined;
    
    // Add owner username for frontend display
    const owner = this.usersMap.get(file.ownerId);
    return {
      ...file,
      owner: owner ? owner.username : "Unknown",
    };
  }

  async getUserFiles(userId: number): Promise<File[]> {
    return Array.from(this.filesMap.values())
      .filter((file) => file.ownerId === userId)
      .map((file) => {
        const owner = this.usersMap.get(file.ownerId);
        return {
          ...file,
          owner: owner ? owner.username : "Unknown",
        };
      });
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const id = this.currentId.files++;
    const now = new Date();
    const file: File = { 
      ...fileData, 
      id,
      uploadedAt: now,
      status: "encrypted",
      owner: "", // Will be set below
    };
    this.filesMap.set(id, file);
    
    // Set owner
    const owner = this.usersMap.get(file.ownerId);
    file.owner = owner ? owner.username : "Unknown";
    
    return file;
  }

  async deleteFile(id: number): Promise<void> {
    this.filesMap.delete(id);
    
    // Also delete related records
    Array.from(this.fileSharesMap.values())
      .filter((share) => share.fileId === id)
      .forEach((share) => this.fileSharesMap.delete(share.id));
      
    Array.from(this.shareLinksMap.values())
      .filter((link) => link.fileId === id)
      .forEach((link) => this.shareLinksMap.delete(link.id));
  }

  async checkFileAccess(fileId: number, userId: number): Promise<boolean> {
    const file = this.filesMap.get(fileId);
    if (!file) return false;
    
    // Owner always has access
    if (file.ownerId === userId) return true;
    
    // Check if there's a file share for this user
    const hasSharedAccess = Array.from(this.fileSharesMap.values()).some(
      (share) => share.fileId === fileId && share.userId === userId
    );
    
    return hasSharedAccess;
  }

  // File sharing
  async getSharedFiles(userId: number): Promise<File[]> {
    // Get all file shares for this user
    const shares = Array.from(this.fileSharesMap.values()).filter(
      (share) => share.userId === userId
    );
    
    // Get the files
    return shares.map((share) => {
      const file = this.filesMap.get(share.fileId);
      if (!file) {
        return null;
      }
      const owner = this.usersMap.get(file.ownerId);
      return {
        ...file,
        owner: owner ? owner.username : "Unknown",
      };
    }).filter(Boolean) as File[];
  }

  async createFileShare(fileShareData: InsertFileShare): Promise<FileShare> {
    const id = this.currentId.fileShares++;
    const now = new Date();
    const fileShare: FileShare = { 
      ...fileShareData, 
      id,
      createdAt: now,
    };
    this.fileSharesMap.set(id, fileShare);
    return fileShare;
  }

  async createShareLink(shareLinkData: InsertShareLink): Promise<ShareLink> {
    const id = this.currentId.shareLinks++;
    const now = new Date();
    const shareLink: ShareLink = { 
      ...shareLinkData, 
      id,
      createdAt: now,
    };
    this.shareLinksMap.set(id, shareLink);
    return shareLink;
  }

  async getShareLink(token: string): Promise<ShareLink | undefined> {
    return Array.from(this.shareLinksMap.values()).find(
      (link) => link.linkToken === token
    );
  }

  // Blockchain transactions
  async logTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const id = this.currentId.transactions++;
    const now = new Date();
    const transaction: Transaction = { 
      ...transactionData, 
      id,
      timestamp: now,
    };
    this.transactionsMap.set(id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    // Get all user's files
    const userFiles = Array.from(this.filesMap.values())
      .filter((file) => file.ownerId === userId)
      .map((file) => file.id);
    
    // Get transactions for those files
    return Array.from(this.transactionsMap.values())
      .filter((tx) => tx.fileId && userFiles.includes(tx.fileId))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Stats
  async createUserStats(userId: number): Promise<Stat> {
    const id = this.currentId.stats++;
    const now = new Date();
    const stat: Stat = {
      id,
      userId,
      filesUploaded: 0,
      filesShared: 0,
      storageUsed: 0,
      downloads: 0,
      lastUpdated: now,
    };
    this.statsMap.set(userId, stat);
    return stat;
  }

  async getUserStats(userId: number): Promise<Stat | undefined> {
    return this.statsMap.get(userId);
  }

  async updateUserStats(userId: number, updates: {
    filesUploaded?: number;
    filesShared?: number;
    storageUsed?: number;
    downloads?: number;
  }): Promise<Stat> {
    let stat = this.statsMap.get(userId);
    
    if (!stat) {
      stat = await this.createUserStats(userId);
    }
    
    const updatedStat: Stat = {
      ...stat,
      filesUploaded: stat.filesUploaded + (updates.filesUploaded || 0),
      filesShared: stat.filesShared + (updates.filesShared || 0),
      storageUsed: stat.storageUsed + (updates.storageUsed || 0),
      downloads: stat.downloads + (updates.downloads || 0),
      lastUpdated: new Date(),
    };
    
    // Ensure values aren't negative
    updatedStat.filesUploaded = Math.max(0, updatedStat.filesUploaded);
    updatedStat.filesShared = Math.max(0, updatedStat.filesShared);
    updatedStat.storageUsed = Math.max(0, updatedStat.storageUsed);
    
    this.statsMap.set(userId, updatedStat);
    return updatedStat;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    if (!file) return undefined;

    // Get owner's username
    const [owner] = await db.select().from(users).where(eq(users.id, file.ownerId));
    return {
      ...file,
      owner: owner ? owner.username : "Unknown",
    };
  }

  async getUserFiles(userId: number): Promise<File[]> {
    const userFiles = await db.select().from(files).where(eq(files.ownerId, userId));
    
    // Get owner's username for each file
    const [owner] = await db.select().from(users).where(eq(users.id, userId));
    
    return userFiles.map(file => ({
      ...file,
      owner: owner ? owner.username : "Unknown",
    }));
  }

  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db
      .insert(files)
      .values(file)
      .returning();
    
    // Get owner's username
    const [owner] = await db.select().from(users).where(eq(users.id, newFile.ownerId));
    
    return {
      ...newFile,
      owner: owner ? owner.username : "Unknown",
    };
  }

  async deleteFile(id: number): Promise<void> {
    // First delete related records
    await db.delete(fileShares).where(eq(fileShares.fileId, id));
    await db.delete(shareLinks).where(eq(shareLinks.fileId, id));
    
    // Then delete the file
    await db.delete(files).where(eq(files.id, id));
  }

  async checkFileAccess(fileId: number, userId: number): Promise<boolean> {
    // Check if user is the owner
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId));
    
    if (!file) return false;
    if (file.ownerId === userId) return true;
    
    // Check if user has shared access
    const [share] = await db
      .select()
      .from(fileShares)
      .where(and(
        eq(fileShares.fileId, fileId),
        eq(fileShares.userId, userId)
      ));
    
    return !!share;
  }

  async getSharedFiles(userId: number): Promise<File[]> {
    // Get all file shares for this user
    const shares = await db
      .select()
      .from(fileShares)
      .where(eq(fileShares.userId, userId));
    
    if (shares.length === 0) return [];
    
    // Get the files
    const sharedFiles = await Promise.all(
      shares.map(async (share) => {
        const [file] = await db
          .select()
          .from(files)
          .where(eq(files.id, share.fileId));
        
        if (!file) return null;
        
        const [owner] = await db
          .select()
          .from(users)
          .where(eq(users.id, file.ownerId));
        
        return {
          ...file,
          owner: owner ? owner.username : "Unknown",
        };
      })
    );
    
    return sharedFiles.filter(Boolean) as File[];
  }

  async createFileShare(fileShare: InsertFileShare): Promise<FileShare> {
    const [newFileShare] = await db
      .insert(fileShares)
      .values(fileShare)
      .returning();
    
    return newFileShare;
  }

  async createShareLink(shareLink: InsertShareLink): Promise<ShareLink> {
    const [newShareLink] = await db
      .insert(shareLinks)
      .values(shareLink)
      .returning();
    
    return newShareLink;
  }

  async getShareLink(token: string): Promise<ShareLink | undefined> {
    const [shareLink] = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.linkToken, token));
    
    return shareLink || undefined;
  }

  async logTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    
    return newTransaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    // First get all user's files
    const userFiles = await db
      .select()
      .from(files)
      .where(eq(files.ownerId, userId));
    
    if (userFiles.length === 0) return [];
    
    // Handle transactions for each file with multiple queries instead of IN
    const allTransactions: Transaction[] = [];
    
    // Get transactions for each file individually (not ideal, but simpler for now)
    for (const file of userFiles) {
      const fileTxs = await db
        .select()
        .from(transactions)
        .where(eq(transactions.fileId, file.id));
      
      allTransactions.push(...fileTxs);
    }
    
    // Sort transactions by timestamp manually
    return allTransactions.sort((a, b) => {
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      return bTime - aTime;
    });
  }

  async createUserStats(userId: number): Promise<Stat> {
    const [newStat] = await db
      .insert(stats)
      .values({
        userId,
        filesUploaded: 0,
        filesShared: 0,
        storageUsed: 0,
        downloads: 0,
      })
      .returning();
    
    return newStat;
  }

  async getUserStats(userId: number): Promise<Stat | undefined> {
    const [userStat] = await db
      .select()
      .from(stats)
      .where(eq(stats.userId, userId));
    
    return userStat || undefined;
  }

  async updateUserStats(userId: number, updates: {
    filesUploaded?: number;
    filesShared?: number;
    storageUsed?: number;
    downloads?: number;
  }): Promise<Stat> {
    // First get current stats
    let userStat = await this.getUserStats(userId);
    
    if (!userStat) {
      userStat = await this.createUserStats(userId);
    }
    
    // Calculate new values
    const newValues = {
      filesUploaded: Math.max(0, userStat.filesUploaded + (updates.filesUploaded || 0)),
      filesShared: Math.max(0, userStat.filesShared + (updates.filesShared || 0)),
      storageUsed: Math.max(0, userStat.storageUsed + (updates.storageUsed || 0)),
      downloads: userStat.downloads + (updates.downloads || 0),
      lastUpdated: new Date(),
    };
    
    // Update the record
    const [updatedStat] = await db
      .update(stats)
      .set(newValues)
      .where(eq(stats.id, userStat.id))
      .returning();
    
    return updatedStat;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
