import { and, asc, desc, eq, gte, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertCopilotMessage,
  InsertGovernanceDecision,
  InsertEngineeringItem,
  InsertProductionOrder,
  InsertProductionReport,
  InsertSimulationRun,
  InsertUser,
  copilotMessages,
  governanceDecisionAudits,
  governanceDecisions,
  engineeringItems,
  engineeringStages,
  engineeringApprovals,
  bomItems,
  productionReports,
  qualityInspections,
  stampingOperations,
  materialLots,
  productionOrders,
  simulationRuns,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { storagePut } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

export async function listEngineeringItems(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(engineeringItems).where(eq(engineeringItems.ownerId, ownerId)).orderBy(desc(engineeringItems.updatedAt)); }
export async function createEngineeringItem(ownerId: number, input: Omit<InsertEngineeringItem, "id" | "ownerId" | "status" | "currentStage" | "drawingKey" | "drawingUrl" | "drawingName">) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const result = await db.insert(engineeringItems).values({ ...input, ownerId, status: "Em desenvolvimento", currentStage: "Requisito e conceito" }); const itemId = result[0].insertId as number; await db.insert(engineeringStages).values(["Requisito e conceito", "Estudo de viabilidade", "Projeto detalhado", "Desenho técnico", "BOM e roteiro", "Protótipo", "Validação", "Liberação"].map((stageName, index) => ({ ownerId, itemId, stageName, stageOrder: index + 1, status: index === 0 ? "Em andamento" as const : "Não iniciado" as const }))); await db.insert(engineeringApprovals).values(["Engenharia", "Qualidade", "Produção"].map((area) => ({ ownerId, itemId, area: area as "Engenharia" | "Qualidade" | "Produção", status: "Pendente" as const }))); await db.insert(bomItems).values({ ownerId, productCode: input.itemCode, componentCode: `${input.itemCode}-COMP-001`, componentName: "Componente a definir · BOM inicial", quantity: "1,000", unit: "conjunto", revision: input.revision }); const rows = await db.select().from(engineeringItems).where(and(eq(engineeringItems.id, itemId), eq(engineeringItems.ownerId, ownerId))).limit(1); return rows[0]; }
export async function listEngineeringStages(ownerId: number, itemId: number) { const db = await getDb(); if (!db) return []; return db.select().from(engineeringStages).where(and(eq(engineeringStages.ownerId, ownerId), eq(engineeringStages.itemId, itemId))).orderBy(asc(engineeringStages.stageOrder)); }
export async function listEngineeringApprovals(ownerId: number, itemId: number) { const db = await getDb(); if (!db) return []; return db.select().from(engineeringApprovals).where(and(eq(engineeringApprovals.ownerId, ownerId), eq(engineeringApprovals.itemId, itemId))); }
export async function uploadEngineeringDrawing(ownerId: number, itemId: number, fileName: string, contentType: string, base64: string) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_"); const stored = await storagePut(`${ownerId}-engineering/${itemId}-${safeName}`, Buffer.from(base64, "base64"), contentType); await db.update(engineeringItems).set({ drawingKey: stored.key, drawingUrl: stored.url, drawingName: fileName, currentStage: "Desenho técnico" }).where(and(eq(engineeringItems.id, itemId), eq(engineeringItems.ownerId, ownerId))); return stored; }
export async function advanceEngineeringStage(ownerId: number, itemId: number, stageId: number, completedBy: string, notes?: string) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const now = new Date(); await db.update(engineeringStages).set({ status: "Concluída", completedBy, completedAt: now, notes }).where(and(eq(engineeringStages.id, stageId), eq(engineeringStages.itemId, itemId), eq(engineeringStages.ownerId, ownerId))); const next = await db.select().from(engineeringStages).where(and(eq(engineeringStages.itemId, itemId), eq(engineeringStages.ownerId, ownerId), eq(engineeringStages.status, "Não iniciado"))).orderBy(asc(engineeringStages.stageOrder)).limit(1); if (next[0]) { await db.update(engineeringStages).set({ status: "Em andamento" }).where(eq(engineeringStages.id, next[0].id)); await db.update(engineeringItems).set({ currentStage: next[0].stageName }).where(and(eq(engineeringItems.id, itemId), eq(engineeringItems.ownerId, ownerId))); } return listEngineeringStages(ownerId, itemId); }
export async function decideEngineeringApproval(ownerId: number, itemId: number, approvalId: number, status: "Aprovado" | "Rejeitado", approverName: string, comment?: string) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(engineeringApprovals).set({ status, approverName, comment, decidedAt: new Date() }).where(and(eq(engineeringApprovals.id, approvalId), eq(engineeringApprovals.itemId, itemId), eq(engineeringApprovals.ownerId, ownerId))); const pending = await db.select({ id: engineeringApprovals.id }).from(engineeringApprovals).where(and(eq(engineeringApprovals.itemId, itemId), eq(engineeringApprovals.ownerId, ownerId), eq(engineeringApprovals.status, "Pendente"))).limit(1); if (!pending.length && status === "Aprovado") await db.update(engineeringItems).set({ status: "Liberado", currentStage: "Liberação" }).where(and(eq(engineeringItems.id, itemId), eq(engineeringItems.ownerId, ownerId))); return listEngineeringApprovals(ownerId, itemId); }
export async function listBomItems(ownerId: number, productCode?: string) { const db = await getDb(); if (!db) return []; return db.select().from(bomItems).where(productCode ? and(eq(bomItems.ownerId, ownerId), eq(bomItems.productCode, productCode)) : eq(bomItems.ownerId, ownerId)); }
export async function listStampingOperations(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(stampingOperations).where(eq(stampingOperations.ownerId, ownerId)); }
export async function listProductionReports(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(productionReports).where(eq(productionReports.ownerId, ownerId)).orderBy(desc(productionReports.reportedAt)); }
export async function createProductionReport(ownerId: number, input: Omit<InsertProductionReport, "id" | "ownerId">) { const db = await getDb(); if (!db) throw new Error("Database is not available"); const result = await db.insert(productionReports).values({ ...input, ownerId }); const rows = await db.select().from(productionReports).where(eq(productionReports.id, result[0].insertId as number)).limit(1); return rows[0]; }
export async function listQualityInspections(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(qualityInspections).where(eq(qualityInspections.ownerId, ownerId)).orderBy(desc(qualityInspections.inspectedAt)); }
export async function approveQualityInspection(ownerId: number, id: number, approvedBy: string, result: "Conforme" | "Não conforme") { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(qualityInspections).set({ approvedBy, approvedAt: new Date(), result }).where(and(eq(qualityInspections.id, id), eq(qualityInspections.ownerId, ownerId))); const rows = await db.select().from(qualityInspections).where(and(eq(qualityInspections.id, id), eq(qualityInspections.ownerId, ownerId))).limit(1); return rows[0]; }

export async function listProductionOrders(ownerId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(productionOrders.ownerId, ownerId)];
  if (search) conditions.push(or(eq(productionOrders.orderCode, search), eq(productionOrders.productCode, search), eq(productionOrders.customer, search)) as never);
  return db.select().from(productionOrders).where(and(...conditions)).orderBy(desc(productionOrders.createdAt));
}

export async function createProductionOrder(ownerId: number, input: Omit<InsertProductionOrder, "id" | "ownerId" | "orderCode" | "status" | "currentStep">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const code = `OP-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  const result = await db.insert(productionOrders).values({ ...input, ownerId, orderCode: code, status: "Planejada", currentStep: "Mistura" });
  const rows = await db.select().from(productionOrders).where(eq(productionOrders.id, result[0].insertId as number)).limit(1);
  return rows[0];
}

export async function updateProductionOrderStatus(ownerId: number, id: number, status: InsertProductionOrder["status"]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const currentStep = status === "Concluída" ? "Expedição" : status === "Em inspeção" ? "Inspeção" : status === "Em produção" ? "Prensagem" : status === "Quarentena" ? "Inspeção" : "Mistura";
  await db.update(productionOrders).set({ status, currentStep }).where(and(eq(productionOrders.id, id), eq(productionOrders.ownerId, ownerId)));
  const rows = await db.select().from(productionOrders).where(and(eq(productionOrders.id, id), eq(productionOrders.ownerId, ownerId))).limit(1);
  return rows[0];
}

export async function listMaterialLots(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materialLots).where(eq(materialLots.ownerId, ownerId)).orderBy(desc(materialLots.receivedAt));
}

export async function bootstrapProduction(ownerId: number) {
  const db = await getDb();
  if (!db) return;
  const existingOrders = await db.select({ id: productionOrders.id }).from(productionOrders).where(eq(productionOrders.ownerId, ownerId)).limit(1);
  const existingLots = await db.select({ id: materialLots.id }).from(materialLots).where(eq(materialLots.ownerId, ownerId)).limit(1);
  if (!existingOrders.length) {
    await db.insert(productionOrders).values([
      { ownerId, orderCode: "OP-2026-0915", productCode: "BP-AX-001", quantity: 2400, customer: "Scorpios Automotive", status: "Em produção", currentStep: "Cura", dueDate: new Date(Date.now() + 3 * 86400000) },
      { ownerId, orderCode: "OP-2026-0916", productCode: "BP-HT-002", quantity: 1200, customer: "Atlas Mobility", status: "Em inspeção", currentStep: "Inspeção", dueDate: new Date(Date.now() + 6 * 86400000) },
      { ownerId, orderCode: "OP-2026-0917", productCode: "BP-EC-003", quantity: 1800, customer: "Scorpios Automotive", status: "Planejada", currentStep: "Mistura", dueDate: new Date(Date.now() + 9 * 86400000) },
    ]);
  }
  if (!existingLots.length) {
    await db.insert(materialLots).values([
      { ownerId, lotCode: "MP-2026-0912", material: "Fibra metálica de reforço", supplier: "MetalFiber Brasil", status: "Quarentena" },
      { ownerId, lotCode: "MP-2026-0910", material: "Resina fenólica", supplier: "ResinTech", status: "Liberado" },
      { ownerId, lotCode: "MP-2026-0908", material: "Grafite industrial", supplier: "Carbon Solutions", status: "Liberado" },
    ]);
  }
  const existingEngineering = await db.select({ id: engineeringItems.id }).from(engineeringItems).where(eq(engineeringItems.ownerId, ownerId)).limit(1);
  if (!existingEngineering.length) {
    await db.insert(engineeringItems).values([
      { ownerId, itemCode: "DWG-BP-AX-001", title: "Pastilha eixo dianteiro · desenho mestre", revision: "A", status: "Liberado", ownerName: "Eng. C. Artanio" },
      { ownerId, itemCode: "ECO-2026-014", title: "Redução de ruído · composição de material", revision: "B", status: "Em aprovação", ownerName: "Eng. Mariana Alves" },
      { ownerId, itemCode: "PF-PR-004", title: "Roteiro de cura · prensa CP-04", revision: "C", status: "Liberado", ownerName: "Eng. Rafael Lima" },
    ]);
    await db.insert(bomItems).values([
      { ownerId, productCode: "BP-AX-001", componentCode: "MAT-RES-001", componentName: "Resina fenólica", quantity: "0,420", unit: "kg", revision: "A" },
      { ownerId, productCode: "BP-AX-001", componentCode: "MAT-FIB-002", componentName: "Fibra metálica", quantity: "0,180", unit: "kg", revision: "A" },
      { ownerId, productCode: "BP-AX-001", componentCode: "MAT-GRA-003", componentName: "Grafite industrial", quantity: "0,095", unit: "kg", revision: "A" },
      { ownerId, productCode: "BP-AX-001", componentCode: "MAT-ABR-004", componentName: "Abrasivo cerâmico", quantity: "0,310", unit: "kg", revision: "A" },
    ]);
    await db.insert(stampingOperations).values([
      { ownerId, operationCode: "EST-001", orderCode: "OP-2026-0915", machineCode: "PRENSA-P04", toolCode: "STP-AX-07", status: "Em execução", targetQty: 2400, completedQty: 1680 },
      { ownerId, operationCode: "EST-002", orderCode: "OP-2026-0916", machineCode: "PRENSA-P02", toolCode: "STP-HT-03", status: "Planejada", targetQty: 1200, completedQty: 0 },
    ]);
    await db.insert(qualityInspections).values([
      { ownerId, orderCode: "OP-2026-0915", characteristic: "Espessura", specification: "12,00 ± 0,15 mm", measuredValue: "11,98 mm", result: "Conforme", approvedBy: "Qualidade · Sistema", approvedAt: new Date() },
      { ownerId, orderCode: "OP-2026-0915", characteristic: "Dureza Rockwell", specification: "85 ± 5 HRB", measuredValue: "87 HRB", result: "Aguardando" },
      { ownerId, orderCode: "OP-2026-0916", characteristic: "Cisalhamento", specification: "≥ 1,5 MPa", measuredValue: "1,32 MPa", result: "Aguardando" },
    ]);
  }
  const allEngineering = await db.select({ id: engineeringItems.id }).from(engineeringItems).where(eq(engineeringItems.ownerId, ownerId));
  for (const item of allEngineering) {
    const itemStages = await db.select({ id: engineeringStages.id }).from(engineeringStages).where(and(eq(engineeringStages.ownerId, ownerId), eq(engineeringStages.itemId, item.id))).limit(1);
    if (!itemStages.length) {
      await db.insert(engineeringStages).values(["Requisito e conceito", "Estudo de viabilidade", "Projeto detalhado", "Desenho técnico", "BOM e roteiro", "Protótipo", "Validação", "Liberação"].map((stageName, index) => ({ ownerId, itemId: item.id, stageName, stageOrder: index + 1, status: index === 0 ? "Em andamento" as const : "Não iniciado" as const })));
      await db.insert(engineeringApprovals).values(["Engenharia", "Qualidade", "Produção"].map((area) => ({ ownerId, itemId: item.id, area: area as "Engenharia" | "Qualidade" | "Produção", status: "Pendente" as const })));
    }
  }
  return { seeded: true };
}

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
