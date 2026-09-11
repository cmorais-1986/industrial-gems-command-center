import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertCopilotMessage,
  InsertGovernanceDecision,
  InsertSimulationRun,
  InsertUser,
  copilotMessages,
  governanceDecisionAudits,
  governanceDecisions,
  simulationRuns,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

type SimulationListFilters = {
  ownerId: number;
  gemCode?: string;
  process?: string;
  status?: InsertSimulationRun["status"];
  from?: Date;
  to?: Date;
};

export async function listSimulationRuns(filters: SimulationListFilters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(simulationRuns.ownerId, filters.ownerId)];
  if (filters.gemCode) conditions.push(eq(simulationRuns.gemCode, filters.gemCode));
  if (filters.process) conditions.push(eq(simulationRuns.process, filters.process));
  if (filters.status) conditions.push(eq(simulationRuns.status, filters.status));
  if (filters.from) conditions.push(gte(simulationRuns.createdAt, filters.from));
  if (filters.to) conditions.push(lte(simulationRuns.createdAt, filters.to));
  return db.select().from(simulationRuns).where(and(...conditions)).orderBy(desc(simulationRuns.createdAt)).limit(100);
}

export async function createSimulationRun(ownerId: number, run: Omit<InsertSimulationRun, "id" | "ownerId"> & { id?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const id = run.id ?? `SIM-${Date.now()}-${ownerId}`;
  await db.insert(simulationRuns).values({ ...run, id, ownerId });
  const result = await db.select().from(simulationRuns).where(and(eq(simulationRuns.id, id), eq(simulationRuns.ownerId, ownerId))).limit(1);
  return result[0];
}

export async function completeSimulationRun(ownerId: number, id: string, roi: string, resultSummary: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(simulationRuns).set({ status: "Concluída", roi, resultSummary }).where(and(eq(simulationRuns.id, id), eq(simulationRuns.ownerId, ownerId)));
  const result = await db.select().from(simulationRuns).where(and(eq(simulationRuns.id, id), eq(simulationRuns.ownerId, ownerId))).limit(1);
  return result[0];
}

export async function bootstrapSimulationRuns(ownerId: number, runs: InsertSimulationRun[]) {
  const db = await getDb();
  if (!db || runs.length === 0) return [];
  const existing = await listSimulationRuns({ ownerId });
  if (existing.length > 0) return existing;
  await db.update(simulationRuns).set({ ownerId }).where(eq(simulationRuns.ownerId, 0));
  const legacyRuns = await listSimulationRuns({ ownerId });
  if (legacyRuns.length > 0) return legacyRuns;
  for (const run of runs) {
    const id = `${run.id}-U${ownerId}`.slice(0, 32);
    await db.insert(simulationRuns).values({ ...run, id, ownerId }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  }
  return listSimulationRuns({ ownerId });
}

export async function listCopilotMessages(ownerId: number, simulationId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(copilotMessages).where(and(eq(copilotMessages.ownerId, ownerId), eq(copilotMessages.simulationId, simulationId))).orderBy(asc(copilotMessages.createdAt));
}

export async function createCopilotMessage(ownerId: number, message: Omit<InsertCopilotMessage, "id" | "ownerId">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(copilotMessages).values({ ...message, ownerId });
  const rows = await db.select().from(copilotMessages).where(eq(copilotMessages.id, result[0].insertId as number)).limit(1);
  return rows[0];
}

type GovernanceListFilters = { simulationId: string; status?: "Registrada" | "Aprovada" | "Rejeitada"; from?: Date; to?: Date };

export async function listGovernanceDecisions(ownerId: number, filters: GovernanceListFilters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(governanceDecisions.ownerId, ownerId), eq(governanceDecisions.simulationId, filters.simulationId)];
  if (filters.status) conditions.push(eq(governanceDecisions.status, filters.status));
  if (filters.from) conditions.push(gte(governanceDecisions.createdAt, filters.from));
  if (filters.to) conditions.push(lte(governanceDecisions.createdAt, filters.to));
  return db.select().from(governanceDecisions).where(and(...conditions)).orderBy(desc(governanceDecisions.createdAt));
}

type GovernanceAuthor = { name?: string | null; email?: string | null };

export async function createGovernanceDecision(ownerId: number, author: GovernanceAuthor, decision: Omit<InsertGovernanceDecision, "id" | "ownerId">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(governanceDecisions).values({ ...decision, ownerId });
  const decisionId = result[0].insertId as number;
  await db.insert(governanceDecisionAudits).values({ ownerId, decisionId, authorName: author.name ?? "Usuário autenticado", authorEmail: author.email ?? null, action: "Criada", newStatus: decision.status, newDecision: decision.decision });
  const rows = await db.select().from(governanceDecisions).where(and(eq(governanceDecisions.id, decisionId), eq(governanceDecisions.ownerId, ownerId))).limit(1);
  return rows[0];
}

export async function updateGovernanceDecision(ownerId: number, author: GovernanceAuthor, id: number, decision: Pick<InsertGovernanceDecision, "decision" | "rationale" | "status">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const previousRows = await db.select().from(governanceDecisions).where(and(eq(governanceDecisions.id, id), eq(governanceDecisions.ownerId, ownerId))).limit(1);
  const previous = previousRows[0];
  if (!previous) return undefined;
  await db.update(governanceDecisions).set(decision).where(and(eq(governanceDecisions.id, id), eq(governanceDecisions.ownerId, ownerId)));
  const action = decision.status === "Aprovada" && previous.status !== "Aprovada" ? "Aprovada" : decision.status === "Rejeitada" && previous.status !== "Rejeitada" ? "Rejeitada" : "Editada";
  await db.insert(governanceDecisionAudits).values({ ownerId, decisionId: id, authorName: author.name ?? "Usuário autenticado", authorEmail: author.email ?? null, action, previousStatus: previous.status, newStatus: decision.status, previousDecision: previous.decision, newDecision: decision.decision });
  const rows = await db.select().from(governanceDecisions).where(and(eq(governanceDecisions.id, id), eq(governanceDecisions.ownerId, ownerId))).limit(1);
  return rows[0];
}

export async function listGovernanceAudits(ownerId: number, decisionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(governanceDecisionAudits).where(and(eq(governanceDecisionAudits.ownerId, ownerId), eq(governanceDecisionAudits.decisionId, decisionId))).orderBy(desc(governanceDecisionAudits.createdAt));
}
