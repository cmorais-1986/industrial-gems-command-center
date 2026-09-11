import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const simulationRuns = mysqlTable("simulation_runs", {
  id: varchar("id", { length: 32 }).primaryKey(),
  ownerId: int("ownerId").notNull().default(0),
  gemCode: varchar("gemCode", { length: 32 }).notNull(),
  gemName: varchar("gemName", { length: 160 }).notNull(),
  scenario: varchar("scenario", { length: 255 }).notNull(),
  process: varchar("process", { length: 120 }).notNull(),
  baselinePct: int("baselinePct").notNull(),
  targetPct: int("targetPct").notNull(),
  windowDays: int("windowDays").notNull(),
  failureMode: varchar("failureMode", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["Concluída", "Em revisão", "Executando"]).default("Executando").notNull(),
  roi: varchar("roi", { length: 32 }).default("—").notNull(),
  resultSummary: text("resultSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SimulationRun = typeof simulationRuns.$inferSelect;
export type InsertSimulationRun = typeof simulationRuns.$inferInsert;

export const copilotMessages = mysqlTable("copilot_messages", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  simulationId: varchar("simulationId", { length: 32 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CopilotMessage = typeof copilotMessages.$inferSelect;
export type InsertCopilotMessage = typeof copilotMessages.$inferInsert;

export const governanceDecisions = mysqlTable("governance_decisions", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  simulationId: varchar("simulationId", { length: 32 }).notNull(),
  decision: varchar("decision", { length: 160 }).notNull(),
  rationale: text("rationale").notNull(),
  status: mysqlEnum("status", ["Registrada", "Aprovada", "Rejeitada"]).default("Registrada").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GovernanceDecision = typeof governanceDecisions.$inferSelect;
export type InsertGovernanceDecision = typeof governanceDecisions.$inferInsert;
