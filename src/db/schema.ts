import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const polls = sqliteTable('polls', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['standard', 'schedule', 'location', 'custom'] }).notNull(),
  question: text('question').notNull(),
  description: text('description'),
  anonymous: integer('anonymous', { mode: 'boolean' }).notNull().default(true),
  duration: integer('duration').notNull().default(24),
  createdAt: text('created_at').notNull(),
  endsAt: text('ends_at').notNull(),
  status: text('status', { enum: ['active', 'ended'] }).notNull().default('active'),
  creatorId: text('creator_id'),
});

export const pollOptions = sqliteTable('poll_options', {
  id: text('id').primaryKey(),
  pollId: text('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  description: text('description'),
  metadata: text('metadata'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const votes = sqliteTable('votes', {
  id: text('id').primaryKey(),
  pollId: text('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  optionId: text('option_id').notNull().references(() => pollOptions.id, { onDelete: 'cascade' }),
  voterId: text('voter_id').notNull(),
  createdAt: text('created_at').notNull(),
});
