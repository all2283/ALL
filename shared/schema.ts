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
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // games, items, currency
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const moderationRequests = pgTable("moderation_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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