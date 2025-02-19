import { IStorage } from "./auth";
import createMemoryStore from "memorystore";
import session from "express-session";
import type { User, Listing, Transaction, Review, InsertListing } from "@shared/schema";

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
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, balance: "0", isModerator: false };
    this.users.set(id, user);
    return user;
  }

  async getListings(): Promise<Listing[]> {
    return Array.from(this.listings.values());
  }

  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async createListing(data: InsertListing & { sellerId: number }): Promise<Listing> {
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

  async createTransaction(data: Omit<Transaction, "id" | "status" | "createdAt">): Promise<Transaction> {
    const id = this.currentId++;
    const transaction: Transaction = {
      ...data,
      id,
      status: "completed",
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
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
}

export const storage = new MemStorage();
