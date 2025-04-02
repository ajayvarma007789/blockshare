import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { filecoin } from "./filecoin";
import { supabase } from "./supabase";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertFileSchema, insertFileShareSchema, insertShareLinkSchema } from "@shared/schema";
import crypto from "crypto";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication with Passport
  setupAuth(app);

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // Error handling middleware
  const handleZodError = (err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ZodError) {
      const formatted = fromZodError(err);
      return res.status(400).json({ error: formatted.message });
    }
    next(err);
  };

  // API routes
  const apiRouter = express.Router();

  // Auth endpoints are now handled by auth.ts
  
  // File endpoints
  apiRouter.get("/files", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const files = await storage.getUserFiles(user.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  apiRouter.post("/files", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as Express.User;
      const { encryptedData, ...fileData } = req.body;
      const parsedFileData = insertFileSchema.parse({
        ...fileData,
        ownerId: user.id,
      });
      
      // Upload encrypted data to Filecoin
      const cid = await filecoin.storeFile(encryptedData);
      
      // Create file record in database
      const file = await storage.createFile({
        ...parsedFileData,
        cid,
      });
      
      // Update user stats
      await storage.updateUserStats(user.id, {
        filesUploaded: 1,
        storageUsed: parsedFileData.size,
      });
      
      // Log blockchain transaction
      await storage.logTransaction({
        txId: `tx_${Date.now()}`,
        cid,
        fileId: file.id,
        type: "store",
        status: "confirmed",
        metadata: { fileSize: parsedFileData.size },
      });
      
      res.status(201).json(file);
    } catch (error) {
      next(error);
    }
  }, handleZodError);

  apiRouter.get("/files/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const fileId = parseInt(req.params.id);
      
      // Check if file exists and user has access
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Check if user is owner or has share access
      const hasAccess = await storage.checkFileAccess(file.id, user.id);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });

  apiRouter.get("/files/:id/download", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const fileId = parseInt(req.params.id);
      
      // Check if file exists and user has access
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Check if user is owner or has share access
      const hasAccess = await storage.checkFileAccess(file.id, user.id);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Retrieve encrypted data from Filecoin
      const encryptedData = await filecoin.retrieveFile(file.cid);
      
      // Update download stats
      await storage.updateUserStats(file.ownerId, {
        downloads: 1,
      });
      
      // Log blockchain transaction
      await storage.logTransaction({
        txId: `tx_${Date.now()}`,
        cid: file.cid,
        fileId: file.id,
        type: "retrieve",
        status: "confirmed",
        metadata: {},
      });
      
      // Return the encrypted data and encryption key
      res.json({
        encryptedData,
        encryptionKey: file.encryptionKey,
        name: file.name,
        type: file.type,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  apiRouter.get("/files/:id/preview", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const fileId = parseInt(req.params.id);
      
      // Check if file exists and user has access
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Check if user is owner or has share access
      const hasAccess = await storage.checkFileAccess(file.id, user.id);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // For previews, only certain file types are supported
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        return res.status(400).json({ error: "File type not supported for preview" });
      }
      
      // Retrieve encrypted data from Filecoin
      const encryptedData = await filecoin.retrieveFile(file.cid);
      
      // Return the encrypted data and encryption key for frontend decryption
      res.json({
        encryptedData,
        encryptionKey: file.encryptionKey,
        name: file.name,
        type: file.type,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to preview file" });
    }
  });

  apiRouter.delete("/files/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const fileId = parseInt(req.params.id);
      
      // Check if file exists and user is the owner
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.ownerId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Delete file from database
      await storage.deleteFile(fileId);
      
      // Update user stats
      await storage.updateUserStats(user.id, {
        filesUploaded: -1,
        storageUsed: -file.size,
      });
      
      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  apiRouter.post("/files/share", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as Express.User;
      const { fileId, email, permission } = req.body;
      
      // Check if file exists and user is the owner
      const file = await storage.getFile(parseInt(fileId));
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.ownerId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Find user to share with
      const userToShare = await storage.getUserByEmail(email);
      
      if (!userToShare) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Create file share
      const shareData = insertFileShareSchema.parse({
        fileId: parseInt(fileId),
        userId: userToShare.id,
        permission,
      });
      
      const fileShare = await storage.createFileShare(shareData);
      
      // Update stats
      await storage.updateUserStats(user.id, {
        filesShared: 1,
      });
      
      res.status(201).json(fileShare);
    } catch (error) {
      next(error);
    }
  }, handleZodError);
  
  // Share file by recipient ID
  apiRouter.post("/files/share-by-id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as Express.User;
      const { fileId, recipientId, permission } = req.body;
      
      // Check if file exists and user is the owner
      const file = await storage.getFile(parseInt(fileId));
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.ownerId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Check if recipient user exists
      const recipientUser = await storage.getUser(parseInt(recipientId));
      
      if (!recipientUser) {
        return res.status(404).json({ error: "Recipient user not found" });
      }
      
      // Create file share
      const shareData = insertFileShareSchema.parse({
        fileId: parseInt(fileId),
        userId: recipientUser.id,
        permission,
      });
      
      const fileShare = await storage.createFileShare(shareData);
      
      // Update stats
      await storage.updateUserStats(user.id, {
        filesShared: 1,
      });
      
      // Update file in Supabase with shared information
      try {
        await supabase.shareFile(
          `${file.ownerId}/${file.id}/${file.name}`, 
          recipientUser.id.toString()
        );
      } catch (supabaseError) {
        console.error("Supabase sharing error:", supabaseError);
        // Continue even if Supabase sharing fails, as we've already created the DB record
      }
      
      res.status(201).json(fileShare);
    } catch (error) {
      next(error);
    }
  }, handleZodError);

  apiRouter.post("/files/share-link", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as Express.User;
      const { fileId, requirePassword, password } = req.body;
      
      // Check if file exists and user is the owner
      const file = await storage.getFile(parseInt(fileId));
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.ownerId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Generate link token
      const linkToken = crypto.randomBytes(16).toString('hex');
      
      // Set expiration date (1 week from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create share link
      const shareLinkData = insertShareLinkSchema.parse({
        fileId: parseInt(fileId),
        linkToken,
        requiresPassword: requirePassword,
        password: requirePassword ? password : null,
        expiresAt,
      });
      
      const shareLink = await storage.createShareLink(shareLinkData);
      
      // Generate full URL
      const domain = process.env.APP_DOMAIN || "https://blockshare.app";
      const fullShareLink = `${domain}/shared/${linkToken}`;
      
      res.status(201).json({
        shareLink: fullShareLink,
        expiresAt,
      });
    } catch (error) {
      next(error);
    }
  }, handleZodError);

  apiRouter.get("/files/shared", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const sharedFiles = await storage.getSharedFiles(user.id);
      res.json(sharedFiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared files" });
    }
  });

  // Stats and blockchain info endpoints
  apiRouter.get("/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const stats = await storage.getUserStats(user.id);
      
      if (!stats) {
        return res.status(404).json({ error: "Stats not found" });
      }
      
      // Format storage used to human-readable format
      let storageUsedStr = `${stats.storageUsed || 0} B`;
      if (stats.storageUsed && stats.storageUsed > 1024) {
        storageUsedStr = `${(stats.storageUsed / 1024).toFixed(1)} KB`;
      }
      if (stats.storageUsed && stats.storageUsed > 1024 * 1024) {
        storageUsedStr = `${(stats.storageUsed / (1024 * 1024)).toFixed(1)} MB`;
      }
      if (stats.storageUsed && stats.storageUsed > 1024 * 1024 * 1024) {
        storageUsedStr = `${(stats.storageUsed / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      }
      
      res.json({
        filesUploaded: stats.filesUploaded,
        filesShared: stats.filesShared,
        storageUsed: storageUsedStr,
        downloads: stats.downloads,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  apiRouter.get("/blockchain/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const status = await filecoin.getNetworkStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get blockchain status" });
    }
  });

  apiRouter.get("/blockchain/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const transactions = await storage.getUserTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
  
  // Direct file upload to Filecoin endpoint
  apiRouter.post("/files/upload", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const { encryptedData, fileName, fileType, fileSize } = req.body;
      
      if (!encryptedData) {
        return res.status(400).json({ error: "No file data provided" });
      }
      
      // Store file in Filecoin
      const cid = await filecoin.storeFile(encryptedData);
      
      // Return the CID for the frontend to use when creating the file record
      res.json({ cid });
    } catch (error) {
      console.error("Error uploading file to Filecoin:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to upload file" });
    }
  });

  // Use prefix for all API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
