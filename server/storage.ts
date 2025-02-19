import { IStorage } from "./auth";
import { db } from "./db";
import { eq, and, desc, or, sql, not } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import type { 
  User, Listing, Transaction, Review, ModerationRequest, Category,
  Chat, Message, Favorite, SearchSubscription, Dispute, Achievement, UserAchievement 
} from "@shared/schema";
import { 
  users, listings, transactions, reviews, moderationRequests, categories,
  chats, messages, favorites, searchSubscriptions, disputes, achievements, userAchievements 
} from "@shared/schema";

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

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return category;
  }

  // Чаты
  async createChat(data: Omit<Chat, "id" | "createdAt" | "lastMessageAt" | "status">): Promise<Chat> {
    const [chat] = await db.insert(chats).values({
      ...data,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      status: "active",
    }).returning();
    return chat;
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return await db.select()
      .from(chats)
      .where(
        or(
          eq(chats.buyerId, userId),
          eq(chats.sellerId, userId)
        )
      )
      .orderBy(desc(chats.lastMessageAt));
  }

  // Сообщения
  async createMessage(data: Omit<Message, "id" | "createdAt" | "isRead">): Promise<Message> {
    const [message] = await db.insert(messages).values({
      ...data,
      createdAt: new Date(),
      isRead: false,
    }).returning();

    // Обновляем время последнего сообщения в чате
    await db.update(chats)
      .set({ lastMessageAt: new Date() })
      .where(eq(chats.id, data.chatId));

    return message;
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt));
  }

  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.chatId, chatId),
          not(eq(messages.senderId, userId))
        )
      );
  }

  // Избранное
  async addToFavorites(data: Omit<Favorite, "id" | "createdAt">): Promise<Favorite> {
    const [favorite] = await db.insert(favorites).values({
      ...data,
      createdAt: new Date(),
    }).returning();

    // Увеличиваем счетчик избранного у объявления
    await db.update(listings)
      .set({ favorites: sql`favorites + 1` })
      .where(eq(listings.id, data.listingId));

    return favorite;
  }

  async removeFromFavorites(userId: number, listingId: number): Promise<void> {
    await db.delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.listingId, listingId)
        )
      );

    // Уменьшаем счетчик избранного у объявления
    await db.update(listings)
      .set({ favorites: sql`favorites - 1` })
      .where(eq(listings.id, listingId));
  }

  async getUserFavorites(userId: number): Promise<Listing[]> {
    const userFavorites = await db.select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .innerJoin(listings, eq(favorites.listingId, listings.id));

    return userFavorites.map(({ listings }) => listings);
  }

  // Подписки на поиск
  async createSearchSubscription(data: Omit<SearchSubscription, "id" | "createdAt" | "isActive">): Promise<SearchSubscription> {
    const [subscription] = await db.insert(searchSubscriptions).values({
      ...data,
      createdAt: new Date(),
      isActive: true,
    }).returning();
    return subscription;
  }

  async getUserSearchSubscriptions(userId: number): Promise<SearchSubscription[]> {
    return await db.select()
      .from(searchSubscriptions)
      .where(eq(searchSubscriptions.userId, userId));
  }

  // Арбитраж
  async createDispute(data: Omit<Dispute, "id" | "status" | "createdAt" | "resolvedAt" | "moderatorId">): Promise<Dispute> {
    const [dispute] = await db.insert(disputes).values({
      ...data,
      status: "pending",
      createdAt: new Date(),
    }).returning();
    return dispute;
  }

  async updateDisputeStatus(id: number, status: string, resolution: string | null, moderatorId: number): Promise<Dispute> {
    const [dispute] = await db.update(disputes)
      .set({
        status,
        resolution,
        moderatorId,
        resolvedAt: new Date(),
      })
      .where(eq(disputes.id, id))
      .returning();
    return dispute;
  }

  async getDisputes(status?: string): Promise<Dispute[]> {
    const query = db.select().from(disputes);
    if (status) {
      query.where(eq(disputes.status, status));
    }
    return await query.orderBy(desc(disputes.createdAt));
  }

  // Достижения
  async unlockAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const [userAchievement] = await db.insert(userAchievements).values({
      userId,
      achievementId,
      unlockedAt: new Date(),
    }).returning();
    return userAchievement;
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    const userAchievements = await db.select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id));

    return userAchievements.map(({ achievements }) => achievements);
  }
}

export const storage = new DatabaseStorage();