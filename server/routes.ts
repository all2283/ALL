import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertListingSchema, insertReviewSchema } from "@shared/schema";
import { insertCategorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Categories
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isModerator) return res.sendStatus(403);
    const validatedData = insertCategorySchema.parse(req.body);
    const category = await storage.createCategory(validatedData);
    res.status(201).json(category);
  });

  // Listings
  app.get("/api/listings", async (req, res) => {
    const { type } = req.query;
    const listings = await storage.getListings();
    if (type) {
      const categories = await storage.getCategories();
      const categoryIds = categories
        .filter(c => c.type === type)
        .map(c => c.name);
      res.json(listings.filter(l => categoryIds.includes(l.category)));
    } else {
      res.json(listings);
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    const listing = await storage.getListing(parseInt(req.params.id));
    if (!listing) return res.status(404).send("Объявление не найдено");
    res.json(listing);
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

  // Добавляем новые маршруты для работы с заявками на модерацию

  // Получение всех заявок на модерацию (только для модераторов)
  app.get("/api/moderation-requests", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isModerator) return res.sendStatus(403);
    const requests = await storage.getModerationRequests();
    res.json(requests);
  });

  // Создание новой заявки на модерацию
  app.post("/api/moderation-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Проверяем, нет ли уже активной заявки
    const requests = await storage.getModerationRequests();
    const hasActiveRequest = requests.some(
      r => r.userId === req.user.id && r.status === "pending"
    );

    if (hasActiveRequest) {
      return res.status(400).send("У вас уже есть активная заявка на модерацию");
    }

    const request = await storage.createModerationRequest({
      userId: req.user.id,
    });
    res.status(201).json(request);
  });

  // Обработка заявки на модерацию (одобрение/отклонение)
  app.post("/api/moderation-requests/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isModerator) return res.sendStatus(403);

    const { action, comment } = req.body;
    if (action !== "approve" && action !== "reject") {
      return res.status(400).send("Неверное действие");
    }

    const request = await storage.updateModerationRequestStatus(
      parseInt(req.params.id),
      action === "approve" ? "approved" : "rejected",
      comment || null
    );

    res.json(request);
  });

  const httpServer = createServer(app);
  return httpServer;
}