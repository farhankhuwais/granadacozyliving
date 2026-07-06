import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ENUMs
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "investor_only",
  "manager_only",
  "investor_manager",
]);

export const roomTypeEnum = pgEnum("room_type", ["bulanan", "harian"]);

export const roomStatusEnum = pgEnum("room_status", ["tersedia", "terisi"]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "expiring_soon",
  "expired",
  "ended",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const transactionCategoryEnum = pgEnum("transaction_category", [
  "monthly_rent",
  "daily_rent",
  "property_tax",
  "management_fees",
  "maintenance",
  "other",
]);

export const requestTypeEnum = pgEnum("request_type", [
  "maintenance",
  "inventory",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "menunggu",
  "diizinkan",
  "ditolak",
  "proses",
  "selesai",
]);

export const photoTypeEnum = pgEnum("photo_type", [
  "interior",
  "exterior",
  "amenities",
  "before",
  "after",
  "evidence",
  "other",
]);

// Tables
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    role: userRoleEnum("role").notNull(),
    propertyId: uuid("property_id"),
    phone: text("phone"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("profiles_email_idx").on(table.email),
    propertyIdx: index("profiles_property_id_idx").on(table.propertyId),
  })
);

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    location: text("location"),
    totalRooms: integer("total_rooms").default(8).notNull(),
    investmentScheme: text("investment_scheme").default("hybrid").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id").notNull(),
    roomNumber: integer("room_number").notNull(),
    type: roomTypeEnum("type").notNull(),
    status: roomStatusEnum("status").default("tersedia").notNull(),
    monthlyPrice: integer("monthly_price"),
    dailyPrice: integer("daily_price"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdx: index("rooms_property_id_idx").on(table.propertyId),
    roomNumberPropertyUnique: index(
      "rooms_property_id_room_number_unique"
    ).on(table.propertyId, table.roomNumber),
  })
);

export const roomPhotos = pgTable(
  "room_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id").notNull(),
    photoUrl: text("photo_url").notNull(),
    caption: text("caption"),
    photoType: photoTypeEnum("photo_type").notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (table) => ({
    roomIdx: index("room_photos_room_id_idx").on(table.roomId),
  })
);

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    leaseStart: date("lease_start").notNull(),
    leaseEnd: date("lease_end").notNull(),
    status: tenantStatusEnum("status").default("active").notNull(),
    idType: text("id_type"),
    idNumber: text("id_number"),
    notificationSent30Days: boolean("notification_sent_30_days").default(false),
    notificationSent7Days: boolean("notification_sent_7_days").default(false),
    lastRenewalDate: date("last_renewal_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    roomIdx: index("tenants_room_id_idx").on(table.roomId),
    leaseEndIdx: index("tenants_lease_end_idx").on(table.leaseEnd),
  })
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id").notNull(),
    roomId: uuid("room_id"),
    type: transactionTypeEnum("type").notNull(),
    category: transactionCategoryEnum("category").notNull(),
    amount: integer("amount").notNull(),
    description: text("description"),
    transactionDate: date("transaction_date").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdx: index("transactions_property_id_idx").on(table.propertyId),
    dateIdx: index("transactions_transaction_date_idx").on(
      table.transactionDate
    ),
  })
);

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id").notNull(),
    roomId: uuid("room_id"),
    type: requestTypeEnum("type").notNull(),
    title: text("title").notNull(),
    status: requestStatusEnum("status").default("menunggu").notNull(),
    estimatedCost: integer("estimated_cost"),
    notes: text("notes"),
    createdBy: uuid("created_by").notNull(),
    approvedBy: uuid("approved_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdx: index("requests_property_id_idx").on(table.propertyId),
    statusIdx: index("requests_status_idx").on(table.status),
  })
);

export const requestPhotos = pgTable(
  "request_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull(),
    photoUrl: text("photo_url").notNull(),
    caption: text("caption"),
    photoType: photoTypeEnum("photo_type").notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (table) => ({
    requestIdx: index("request_photos_request_id_idx").on(table.requestId),
  })
);

// Relations
export const profilesRelations = relations(profiles, ({ one }) => ({
  property: one(properties, {
    fields: [profiles.propertyId],
    references: [properties.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  rooms: many(rooms),
  transactions: many(transactions),
  requests: many(requests),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  tenants: many(tenants),
  photos: many(roomPhotos),
  requests: many(requests),
}));

export const roomPhotosRelations = relations(roomPhotos, ({ one }) => ({
  room: one(rooms, {
    fields: [roomPhotos.roomId],
    references: [rooms.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ one }) => ({
  room: one(rooms, {
    fields: [tenants.roomId],
    references: [rooms.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  property: one(properties, {
    fields: [transactions.propertyId],
    references: [properties.id],
  }),
  room: one(rooms, {
    fields: [transactions.roomId],
    references: [rooms.id],
  }),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  property: one(properties, {
    fields: [requests.propertyId],
    references: [properties.id],
  }),
  room: one(rooms, {
    fields: [requests.roomId],
    references: [rooms.id],
  }),
  photos: many(requestPhotos),
}));

export const requestPhotosRelations = relations(requestPhotos, ({ one }) => ({
  request: one(requests, {
    fields: [requestPhotos.requestId],
    references: [requests.id],
  }),
}));
