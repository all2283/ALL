import { IStorage } from "./auth";
import createMemoryStore from "memorystore";
import session from "express-session";
import type { User, Listing, Transaction, Review } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private listings: Map<number, Listing>;
  private transactions: Map<number, Transaction>;
  private reviews: Map<number, Review>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.listings = new Map();
    this.transactions = new Map();
    this.reviews = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Создаем тестового модератора
    const moderator = {
      id: this.currentId++,
      username: "admin",
      password: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9.f09696910d9b95a0d82c9bfec21c0d40", // пароль: admin
      avatar: null,
      balance: "0",
      isModerator: true
    };
    this.users.set(moderator.id, moderator);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: Omit<User, "id" | "avatar" | "balance" | "isModerator">): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      avatar: null,
      balance: "0",
      isModerator: false
    };
    this.users.set(id, user);
    return user;
  }

  async getListings(): Promise<Listing[]> {
    return Array.from(this.listings.values());
  }

  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async createListing(data: Omit<Listing, "id" | "status" | "createdAt">): Promise<Listing> {
    const id = this.currentId++;
    const listing: Listing = {
      ...data,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.listings.set(id, listing);
    return listing;
  }

  async updateListingStatus(id: number, status: string): Promise<Listing | undefined> {
    const listing = this.listings.get(id);
    if (listing) {
      const updated = { ...listing, status };
      this.listings.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async createTransaction(data: Omit<Transaction, "id" | "status" | "createdAt">): Promise<Transaction> {
    const id = this.currentId++;
    const transaction: Transaction = {
      ...data,
      id,
      status: "completed",
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);

    // Обновляем статус листинга на sold
    const listing = this.listings.get(data.listingId);
    if (listing) {
      this.updateListingStatus(listing.id, "sold");
    }

    return transaction;
  }

  async createReview(data: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const id = this.currentId++;
    const review: Review = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    return review;
  }

  async getReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values());
  }
}

export const storage = new MemStorage();