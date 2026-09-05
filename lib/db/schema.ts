import { integer, numeric, pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'

export const categories = pgTable('sv_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const supplies = pgTable('sv_supplies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0'),
  unitWeight: numeric('unit_weight', { precision: 12, scale: 3 }),
  whereToBuy: text('where_to_buy').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const recipes = pgTable('sv_recipes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  categoryId: text('category_id').notNull(),
  salePrice: numeric('sale_price', { precision: 12, scale: 2 }).notNull().default('0'),
  yieldQuantity: integer('yield_quantity').notNull().default(1),
  unitWeight: numeric('unit_weight', { precision: 12, scale: 3 }),
  serverMin: numeric('server_min', { precision: 12, scale: 2 }),
  serverMax: numeric('server_max', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const recipeIngredients = pgTable('sv_recipe_ingredients', {
  recipeId: text('recipe_id').notNull(),
  supplyId: text('supply_id').notNull(),
  quantity: integer('quantity').notNull().default(0),
}, (table) => ({ pk: primaryKey({ columns: [table.recipeId, table.supplyId] }) }))
