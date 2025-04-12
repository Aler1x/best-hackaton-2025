import { pgTable, serial, text, varchar, timestamp, boolean, integer, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const petTypeEnum = pgEnum('pet_type', ['cat', 'dog', 'rabbit', 'other']);
export const petStatusEnum = pgEnum('pet_status', ['waiting', 'in_shelter', 'adopted']);

// Users table (extended from Supabase auth.users)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Matches Supabase auth.users.id
  role: text('role').default('volunteer').notNull(), // 'volunteer' or 'shelter'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Shelters table
export const shelters = pgTable('shelters', {
  id: text('id').primaryKey().references(() => users.id), // References users.id
  name: text('name').notNull(),
  description: text('description'),
  address: text('address'),
  phone: text('phone'),
  website: text('website'),
  donationLink: text('donation_link'),
  location: json('location').$type<{ lat: number, lng: number }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pets table
export const pets = pgTable('pets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sex: text('sex').notNull(), // 'male' or 'female'
  age: integer('age').notNull(), // Could be in years or a description like 'young', 'adult', etc.
  type: petTypeEnum('type').notNull(),
  status: petStatusEnum('status').default('waiting').notNull(),
  description: text('description'),
  health: text('health'),
  location: json('location').$type<{ lat: number, lng: number }>(),
  shelterId: text('shelter_id').references(() => shelters.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  images: json('images').$type<string[]>(),
});

// Volunteers table
export const volunteers = pgTable('volunteers', {
  id: text('id').primaryKey().references(() => users.id), // References users.id
  bio: text('bio'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Favorites table (for volunteers to save pets they like)
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  volunteerId: text('volunteer_id').notNull().references(() => volunteers.id),
  petId: integer('pet_id').notNull().references(() => pets.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Adoption requests table
export const adoptionRequests = pgTable('adoption_requests', {
  id: serial('id').primaryKey(),
  volunteerId: text('volunteer_id').notNull().references(() => volunteers.id),
  petId: integer('pet_id').notNull().references(() => pets.id),
  status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected'
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pet alerts (for when volunteers want to be notified about specific pet types)
export const petAlerts = pgTable('pet_alerts', {
  id: serial('id').primaryKey(),
  volunteerId: text('volunteer_id').notNull().references(() => volunteers.id),
  petType: petTypeEnum('pet_type').notNull(),
  location: json('location').$type<{ lat: number, lng: number, radius: number }>(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Found pets (for when volunteers find strays and report them)
export const foundPets = pgTable('found_pets', {
  id: serial('id').primaryKey(),
  volunteerId: text('volunteer_id').notNull().references(() => volunteers.id),
  type: petTypeEnum('type').notNull(),
  description: text('description').notNull(),
  location: json('location').$type<{ lat: number, lng: number }>(),
  status: text('status').default('reported').notNull(), // 'reported', 'processed', 'rescued'
  images: json('images').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  shelter: one(shelters, {
    fields: [users.id],
    references: [shelters.id],
    relationName: 'user_shelter',
  }),
  volunteer: one(volunteers, {
    fields: [users.id],
    references: [volunteers.id],
    relationName: 'user_volunteer',
  }),
}));

export const sheltersRelations = relations(shelters, ({ many }) => ({
  pets: many(pets),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  shelter: one(shelters, {
    fields: [pets.shelterId],
    references: [shelters.id],
  }),
  favorites: many(favorites),
  adoptionRequests: many(adoptionRequests),
}));

export const volunteersRelations = relations(volunteers, ({ many }) => ({
  favorites: many(favorites),
  adoptionRequests: many(adoptionRequests),
  petAlerts: many(petAlerts),
  foundPets: many(foundPets),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [favorites.volunteerId],
    references: [volunteers.id],
  }),
  pet: one(pets, {
    fields: [favorites.petId],
    references: [pets.id],
  }),
}));

export const adoptionRequestsRelations = relations(adoptionRequests, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [adoptionRequests.volunteerId],
    references: [volunteers.id],
  }),
  pet: one(pets, {
    fields: [adoptionRequests.petId],
    references: [pets.id],
  }),
}));

export const petAlertsRelations = relations(petAlerts, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [petAlerts.volunteerId],
    references: [volunteers.id],
  }),
}));

export const foundPetsRelations = relations(foundPets, ({ one }) => ({
  volunteer: one(volunteers, {
    fields: [foundPets.volunteerId],
    references: [volunteers.id],
  }),
})); 