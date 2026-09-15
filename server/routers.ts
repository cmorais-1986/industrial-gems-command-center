import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import {
  bootstrapSimulationRuns,
  completeSimulationRun,
  createCopilotMessage,
  createGovernanceDecision,
  createSimulationRun,
  listCopilotMessages,
  listGovernanceAudits,
  listGovernanceDecisions,
  listSimulationRuns,
  listMaterialLots,
  listProductionOrders,
  createProductionOrder,
  bootstrapProduction,
  updateProductionOrderStatus,
  listEngineeringItems,
  listBomItems,
  listStampingOperations,
  listProductionReports,
  createProductionReport,
  listQualityInspections,
  approveQualityInspection,
  updateGovernanceDecision,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const simulationFilters = z.object({
  gemCode: z.string().max(32).optional(),
  process: z.string().max(120).optional(),
  status: z.enum(["Concluída", "Em revisão", "Executando"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).optional();

const governanceFilters = z.object({
  simulationId: z.string().min(1).max(32),
  status: z.enum(["Registrada", "Aprovada", "Rejeitada"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const seedRuns = [
  { id: "SIM-024", gemCode: "GEM-01", gemName: "Scorpios Metalworks", scenario: "Refugo elevado na CNC-02", process: "Usinagem CNC", baselinePct: 4, targetPct: 2, windowDays: 90, failureMode: "Desgaste progressivo", status: "Executando" as const, roi: "4.2 : 1", resultSummary: "Processo instável; desgaste da ferramenta responde por 42% do impacto." },
  { id: "SIM-023", gemCode: "GEM-01", gemName: "Scorpios Metalworks", scenario: "VOCs acima do baseline", process: "Pintura E-coat", baselinePct: 8, targetPct: 5, windowDays: 90, failureMode: "Variação de matéria-prima", status: "Concluída" as const, roi: "3.7 : 1", resultSummary: "Redução de VOCs após ajuste de exaustão." },
  { id: "SIM-022", gemCode: "GEM-02", gemName: "Forja Nação", scenario: "Invasão zona de exclusão", process: "Prensa hidráulica", baselinePct: 3, targetPct: 1, windowDays: 60, failureMode: "Sensor de posição", status: "Concluída" as const, roi: "2.9 : 1", resultSummary: "Plano de contenção aprovado para NR-12." },
  { id: "SIM-021", gemCode: "GEM-04", gemName: "CyberNetics AeroSpace", scenario: "Viés na inspeção visual", process: "Inspeção automatizada", baselinePct: 4, targetPct: 2, windowDays: 120, failureMode: "Parâmetro fora do padrão", status: "Em revisão" as const, roi: "—", resultSummary: "Revisão de dados e fairness gate pendente." },
];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  simulations: router({
    list: protectedProcedure.input(simulationFilters).query(({ ctx, input }) => listSimulationRuns({ ownerId: ctx.user.id, ...(input ?? {}) })),
    create: protectedProcedure.input(z.object({
      gemCode: z.string().min(1).max(32),
      gemName: z.string().min(1).max(160),
      scenario: z.string().min(1).max(255),
      process: z.string().min(1).max(120),
      baselinePct: z.number().int().min(0).max(100),
      targetPct: z.number().int().min(0).max(100),
      windowDays: z.number().int().min(1).max(3650),
      failureMode: z.string().min(1).max(160),
    })).mutation(({ ctx, input }) => createSimulationRun(ctx.user.id, { ...input, status: "Executando", roi: "—" })),
    complete: protectedProcedure.input(z.object({
      id: z.string().min(1).max(32),
      roi: z.string().min(1).max(32),
      resultSummary: z.string().max(2000),
    })).mutation(({ ctx, input }) => completeSimulationRun(ctx.user.id, input.id, input.roi, input.resultSummary)),
    bootstrap: protectedProcedure.mutation(({ ctx }) => bootstrapSimulationRuns(ctx.user.id, seedRuns)),
  }),

  copilot: router({
    list: protectedProcedure.input(z.object({ simulationId: z.string().min(1).max(32) })).query(({ ctx, input }) => listCopilotMessages(ctx.user.id, input.simulationId)),
    create: protectedProcedure.input(z.object({
      simulationId: z.string().min(1).max(32),
      role: z.enum(["user", "assistant"]),
      message: z.string().min(1).max(4000),
    })).mutation(({ ctx, input }) => createCopilotMessage(ctx.user.id, input)),
  }),

  governance: router({
    list: protectedProcedure.input(governanceFilters).query(({ ctx, input }) => listGovernanceDecisions(ctx.user.id, input)),
    audit: protectedProcedure.input(z.object({ decisionId: z.number().int().positive() })).query(({ ctx, input }) => listGovernanceAudits(ctx.user.id, input.decisionId)),
    create: protectedProcedure.input(z.object({
      simulationId: z.string().min(1).max(32),
      decision: z.string().min(1).max(160),
      rationale: z.string().min(1).max(4000),
      status: z.enum(["Registrada", "Aprovada", "Rejeitada"]).default("Registrada"),
    })).mutation(({ ctx, input }) => createGovernanceDecision(ctx.user.id, ctx.user, input)),
    update: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      decision: z.string().min(1).max(160),
      rationale: z.string().min(1).max(4000),
      status: z.enum(["Registrada", "Aprovada", "Rejeitada"]),
    })).mutation(({ ctx, input }) => updateGovernanceDecision(ctx.user.id, ctx.user, input.id, input)),
  }),

  production: router({
    orders: protectedProcedure.input(z.object({ search: z.string().max(160).optional() })).query(({ ctx, input }) => listProductionOrders(ctx.user.id, input.search)),
    materialLots: protectedProcedure.query(({ ctx }) => listMaterialLots(ctx.user.id)),
    bootstrap: protectedProcedure.mutation(({ ctx }) => bootstrapProduction(ctx.user.id)),
    createOrder: protectedProcedure.input(z.object({ productCode: z.string().min(1).max(32), quantity: z.number().int().positive().max(1000000), customer: z.string().min(1).max(160), dueDate: z.coerce.date() })).mutation(({ ctx, input }) => createProductionOrder(ctx.user.id, input)),
    updateOrderStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["Planejada", "Em produção", "Em inspeção", "Concluída", "Quarentena"]) })).mutation(({ ctx, input }) => updateProductionOrderStatus(ctx.user.id, input.id, input.status)),
    engineering: protectedProcedure.query(({ ctx }) => listEngineeringItems(ctx.user.id)),
    bom: protectedProcedure.input(z.object({ productCode: z.string().max(32).optional() })).query(({ ctx, input }) => listBomItems(ctx.user.id, input.productCode)),
    stamping: protectedProcedure.query(({ ctx }) => listStampingOperations(ctx.user.id)),
    reports: protectedProcedure.query(({ ctx }) => listProductionReports(ctx.user.id)),
    report: protectedProcedure.input(z.object({ orderCode: z.string().min(1).max(32), operatorName: z.string().min(1).max(120), machineCode: z.string().min(1).max(64), shift: z.enum(["1º turno", "2º turno", "3º turno"]), goodQty: z.number().int().min(0), scrapQty: z.number().int().min(0), notes: z.string().max(1000).optional() })).mutation(({ ctx, input }) => createProductionReport(ctx.user.id, input)),
    inspections: protectedProcedure.query(({ ctx }) => listQualityInspections(ctx.user.id)),
    approveInspection: protectedProcedure.input(z.object({ id: z.number().int().positive(), result: z.enum(["Conforme", "Não conforme"]) })).mutation(({ ctx, input }) => approveQualityInspection(ctx.user.id, input.id, ctx.user.name ?? "Qualidade", input.result)),
  }),
});

export type AppRouter = typeof appRouter;
