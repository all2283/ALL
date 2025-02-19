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
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions = await storage.getTransactions();
    // Возвращаем только транзакции текущего пользователя
    const userTransactions = transactions.filter(
      t => t.buyerId === req.user.id || t.sellerId === req.user.id
    );
    res.json(userTransactions);
  });

  app.post("/api/listings/:id/buy", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const listing = await storage.getListing(parseInt(req.params.id));
    if (!listing) return res.status(404).send("Объявление не найдено");
    if (listing.status !== "active") return res.status(400).send("Объявление недоступно");
    if (listing.sellerId === req.user.id) return res.status(400).send("Нельзя купить свое объявление");

    const transaction = await storage.createTransaction({
      listingId: listing.id,
      buyerId: req.user.id,
      sellerId: listing.sellerId,
      amount: listing.price,
    });
    res.status(201).json(transaction);
  });

  // Reviews
  app.get("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const reviews = await storage.getReviews();
    // Возвращаем только отзывы о текущем пользователе
    const userReviews = reviews.filter(r => r.toUserId === req.user.id);
    res.json(userReviews);
  });

  app.post("/api/transactions/:id/review", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transaction = await storage.getTransaction(parseInt(req.params.id));
    if (!transaction) return res.status(404).send("Транзакция не найдена");
    if (transaction.buyerId !== req.user.id) return res.status(403).send("Нет доступа");

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
    if (action !== "approve" && action !== "reject") return res.status(400).send("Неверное действие");

    const listing = await storage.updateListingStatus(
      parseInt(req.params.id),
      action === "approve" ? "active" : "rejected"
    );
    res.json(listing);
  });

  const httpServer = createServer(app);
  return httpServer;
}