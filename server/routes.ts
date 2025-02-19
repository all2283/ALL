import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertListingSchema, insertReviewSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Listings
  app.get("/api/listings", async (req, res) => {
    const listings = await storage.getListings();
    res.json(listings);
  });

  app.post("/api/listings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validatedData = insertListingSchema.parse(req.body);
    const listing = await storage.createListing({
      ...validatedData,
      sellerId: req.user.id,
    });
    res.status(201).json(listing);
  });

  // Transactions
  app.post("/api/listings/:id/buy", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const listing = await storage.getListing(parseInt(req.params.id));
    if (!listing) return res.status(404).send("Listing not found");
    if (listing.status !== "active") return res.status(400).send("Listing not available");
    if (listing.sellerId === req.user.id) return res.status(400).send("Cannot buy own listing");

    const transaction = await storage.createTransaction({
      listingId: listing.id,
      buyerId: req.user.id,
      sellerId: listing.sellerId,
      amount: listing.price,
    });
    res.status(201).json(transaction);
  });

  // Reviews
  app.post("/api/transactions/:id/review", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transaction = await storage.getTransaction(parseInt(req.params.id));
    if (!transaction) return res.status(404).send("Transaction not found");
    if (transaction.buyerId !== req.user.id) return res.status(403).send("Unauthorized");

    const validatedData = insertReviewSchema.parse(req.body);
    const review = await storage.createReview({
      ...validatedData,
      transactionId: transaction.id,
      fromUserId: req.user.id,
      toUserId: transaction.sellerId,
    });
    res.status(201).json(review);
  });

  // Moderation
  app.post("/api/listings/:id/moderate", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isModerator) return res.sendStatus(403);
    const { action } = req.body;
    if (action !== "approve" && action !== "reject") return res.status(400).send("Invalid action");
    
    const listing = await storage.updateListingStatus(
      parseInt(req.params.id),
      action === "approve" ? "active" : "rejected"
    );
    res.json(listing);
  });

  const httpServer = createServer(app);
  return httpServer;
}
