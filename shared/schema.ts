import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  isModerator: boolean("is_moderator").default(false).notNull(),
  email: text("email"),
  phone: text("phone"),
  isVerified: boolean("is_verified").default(false).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  reputationScore: decimal("reputation_score", { precision: 3, scale: 1 }).default("5.0").notNull(),
  lastSeen: timestamp("last_seen"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // games, items, currency
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  status: text("status").notNull().default("active"), // active, closed
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isRead: boolean("is_read").default(false).notNull(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const searchSubscriptions = pgTable("search_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: text("category"),
  minPrice: decimal("min_price", { precision: 10, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),
  keywords: text("keywords"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  initiatorId: integer("initiator_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, resolved, closed
  resolution: text("resolution"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  moderatorId: integer("moderator_id").references(() => users.id),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("pending"),
  imageUrl: text("image_url"),
  accountLogin: text("account_login"),
  accountPassword: text("account_password"),
  accountEmail: text("account_email"),
  accountLevel: integer("account_level"),
  accountRank: text("account_rank"),
  accountServer: text("account_server"),
  additionalImages: text("additional_images").array(),
  views: integer("views").default(0).notNull(),
  favorites: integer("favorites").default(0).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const moderationRequests = pgTable("moderation_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  type: true,
});

export const insertListingSchema = createInsertSchema(listings).pick({
  title: true,
  description: true,
  price: true,
  category: true,
  imageUrl: true,
  accountLogin: true,
  accountPassword: true,
  accountEmail: true,
  accountLevel: true,
  accountRank: true,
  accountServer: true,
  additionalImages: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertModerationRequestSchema = createInsertSchema(moderationRequests).pick({
  userId: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  rating: true,
  comment: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  listingId: true,
  buyerId: true,
  sellerId: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  content: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  listingId: true,
});

export const insertSearchSubscriptionSchema = createInsertSchema(searchSubscriptions).pick({
  category: true,
  minPrice: true,
  maxPrice: true,
  keywords: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).pick({
  transactionId: true,
  reason: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ModerationRequest = typeof moderationRequests.$inferSelect;
export type InsertModerationRequest = z.infer<typeof insertModerationRequestSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type SearchSubscription = typeof searchSubscriptions.$inferSelect;
export type InsertSearchSubscription = z.infer<typeof insertSearchSubscriptionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;