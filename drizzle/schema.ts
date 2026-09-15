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

export const governanceDecisionAudits = mysqlTable("governance_decision_audits", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  decisionId: int("decisionId").notNull(),
  authorName: varchar("authorName", { length: 160 }).notNull(),
  authorEmail: varchar("authorEmail", { length: 320 }),
  action: mysqlEnum("action", ["Criada", "Editada", "Aprovada", "Rejeitada"]).notNull(),
  previousStatus: mysqlEnum("previousStatus", ["Registrada", "Aprovada", "Rejeitada"]),
  newStatus: mysqlEnum("newStatus", ["Registrada", "Aprovada", "Rejeitada"]),
  previousDecision: varchar("previousDecision", { length: 160 }),
  newDecision: varchar("newDecision", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GovernanceDecisionAudit = typeof governanceDecisionAudits.$inferSelect;
export type InsertGovernanceDecisionAudit = typeof governanceDecisionAudits.$inferInsert;

export const productionOrders = mysqlTable("production_orders", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  orderCode: varchar("orderCode", { length: 32 }).notNull(),
  productCode: varchar("productCode", { length: 32 }).notNull(),
  quantity: int("quantity").notNull(),
  customer: varchar("customer", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["Planejada", "Em produção", "Em inspeção", "Concluída", "Quarentena"]).default("Planejada").notNull(),
  currentStep: varchar("currentStep", { length: 80 }).default("Mistura").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProductionOrder = typeof productionOrders.$inferSelect;
export type InsertProductionOrder = typeof productionOrders.$inferInsert;

export const materialLots = mysqlTable("material_lots", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  lotCode: varchar("lotCode", { length: 48 }).notNull(),
  material: varchar("material", { length: 160 }).notNull(),
  supplier: varchar("supplier", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["Liberado", "Quarentena", "Rejeitado"]).default("Liberado").notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
});
export type MaterialLot = typeof materialLots.$inferSelect;
export type InsertMaterialLot = typeof materialLots.$inferInsert;

export const engineeringItems = mysqlTable("engineering_items", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), itemCode: varchar("itemCode", { length: 48 }).notNull(), title: varchar("title", { length: 180 }).notNull(), revision: varchar("revision", { length: 12 }).notNull(), status: mysqlEnum("status", ["Em desenvolvimento", "Em aprovação", "Liberado", "Obsoleto"]).default("Em desenvolvimento").notNull(), ownerName: varchar("ownerName", { length: 120 }).notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EngineeringItem = typeof engineeringItems.$inferSelect;
export type InsertEngineeringItem = typeof engineeringItems.$inferInsert;

export const bomItems = mysqlTable("bom_items", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), productCode: varchar("productCode", { length: 32 }).notNull(), componentCode: varchar("componentCode", { length: 48 }).notNull(), componentName: varchar("componentName", { length: 160 }).notNull(), quantity: varchar("quantity", { length: 32 }).notNull(), unit: varchar("unit", { length: 16 }).notNull(), revision: varchar("revision", { length: 12 }).notNull(),
});
export type BomItem = typeof bomItems.$inferSelect;
export type InsertBomItem = typeof bomItems.$inferInsert;

export const productionReports = mysqlTable("production_reports", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), orderCode: varchar("orderCode", { length: 32 }).notNull(), operatorName: varchar("operatorName", { length: 120 }).notNull(), machineCode: varchar("machineCode", { length: 64 }).notNull(), shift: mysqlEnum("shift", ["1º turno", "2º turno", "3º turno"]).notNull(), goodQty: int("goodQty").notNull(), scrapQty: int("scrapQty").notNull(), notes: text("notes"), reportedAt: timestamp("reportedAt").defaultNow().notNull(),
});
export type ProductionReport = typeof productionReports.$inferSelect;
export type InsertProductionReport = typeof productionReports.$inferInsert;

export const qualityInspections = mysqlTable("quality_inspections", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), orderCode: varchar("orderCode", { length: 32 }).notNull(), characteristic: varchar("characteristic", { length: 120 }).notNull(), specification: varchar("specification", { length: 120 }).notNull(), measuredValue: varchar("measuredValue", { length: 64 }).notNull(), result: mysqlEnum("result", ["Conforme", "Não conforme", "Aguardando"]).default("Aguardando").notNull(), approvedBy: varchar("approvedBy", { length: 120 }), approvedAt: timestamp("approvedAt"), inspectedAt: timestamp("inspectedAt").defaultNow().notNull(),
});
export type QualityInspection = typeof qualityInspections.$inferSelect;
export type InsertQualityInspection = typeof qualityInspections.$inferInsert;

export const stampingOperations = mysqlTable("stamping_operations", {
  id: int("id").autoincrement().primaryKey(), ownerId: int("ownerId").notNull(), operationCode: varchar("operationCode", { length: 48 }).notNull(), orderCode: varchar("orderCode", { length: 32 }).notNull(), machineCode: varchar("machineCode", { length: 64 }).notNull(), toolCode: varchar("toolCode", { length: 64 }).notNull(), status: mysqlEnum("status", ["Planejada", "Em execução", "Concluída", "Parada"]).default("Planejada").notNull(), targetQty: int("targetQty").notNull(), completedQty: int("completedQty").default(0).notNull(),
});
export type StampingOperation = typeof stampingOperations.$inferSelect;
export type InsertStampingOperation = typeof stampingOperations.$inferInsert;
