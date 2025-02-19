import { IStorage } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import type { User, Listing, Transaction, Review, ModerationRequest } from "@shared/schema";
import { users, listings, transactions, reviews, moderationRequests } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });

    // Создаем тестового модератора при первом запуске
    this.createInitialModerator();
  }

  private async createInitialModerator() {
    const existingModerator = await this.getUserByUsername("admin");
    if (!existingModerator) {
      await db.insert(users).values({
        username: "admin",
        password: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9.f09696910d9b95a0d82c9bfec21c0d40", // пароль: admin
        isModerator: true,
        balance: "0",
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: Omit<User, "id" | "avatar" | "balance" | "isModerator">): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      avatar: null,
      balance: "0",
      isModerator: false,
    }).returning();
    return user;
  }

  async getListings(): Promise<Listing[]> {
    return await db.select().from(listings);
  }

  async getListing(id: number): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async createListing(data: Omit<Listing, "id" | "status" | "createdAt">): Promise<Listing> {
    const [listing] = await db.insert(listings).values({
      ...data,
      status: "pending",
      createdAt: new Date(),
    }).returning();
    return listing;
  }

  async updateListingStatus(id: number, status: string): Promise<Listing | undefined> {
    const [listing] = await db
      .update(listings)
      .set({ status })
      .where(eq(listings.id, id))
      .returning();
    return listing;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async createTransaction(data: Omit<Transaction, "id" | "status" | "createdAt">): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values({
      ...data,
      status: "completed",
      createdAt: new Date(),
    }).returning();

    // Обновляем статус листинга на sold
    await this.updateListingStatus(data.listingId, "sold");

    return transaction;
  }

  async createReview(data: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const [review] = await db.insert(reviews).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return review;
  }

  async getReviews(): Promise<Review[]> {
    return await db.select().from(reviews);
  }

  async getModerationRequests(): Promise<ModerationRequest[]> {
    return await db.select().from(moderationRequests);
  }

  async getModerationRequest(id: number): Promise<ModerationRequest | undefined> {
    const [request] = await db.select().from(moderationRequests).where(eq(moderationRequests.id, id));
    return request;
  }

  async createModerationRequest(data: Omit<ModerationRequest, "id" | "status" | "comment" | "createdAt">): Promise<ModerationRequest> {
    const [request] = await db.insert(moderationRequests).values({
      ...data,
      status: "pending",
      comment: null,
      createdAt: new Date(),
    }).returning();
    return request;
  }

  async updateModerationRequestStatus(
    id: number,
    status: string,
    comment: string | null
  ): Promise<ModerationRequest | undefined> {
    const [request] = await db
      .update(moderationRequests)
      .set({ status, comment })
      .where(eq(moderationRequests.id, id))
      .returning();

    if (status === "approved") {
      const moderationRequest = await this.getModerationRequest(id);
      if (moderationRequest) {
        // Обновляем статус пользователя на модератора
        await db
          .update(users)
          .set({ isModerator: true })
          .where(eq(users.id, moderationRequest.userId));
      }
    }

    return request;
  }
}

export const storage = new DatabaseStorage();