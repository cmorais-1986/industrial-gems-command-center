import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { bootstrapSimulationRuns, completeSimulationRun, createSimulationRun, listSimulationRuns } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  simulations: router({
    list: publicProcedure.query(() => listSimulationRuns()),
    create: publicProcedure.input(z.object({
      gemCode: z.string().min(1).max(32),
      gemName: z.string().min(1).max(160),
      scenario: z.string().min(1).max(255),
      process: z.string().min(1).max(120),
      baselinePct: z.number().int().min(0).max(100),
      targetPct: z.number().int().min(0).max(100),
      windowDays: z.number().int().min(1).max(3650),
      failureMode: z.string().min(1).max(160),
    })).mutation(({ input }) => createSimulationRun({ ...input, status: "Executando", roi: "—" })),
    complete: publicProcedure.input(z.object({
      id: z.string().min(1).max(32),
      roi: z.string().min(1).max(32),
      resultSummary: z.string().max(2000),
    })).mutation(({ input }) => completeSimulationRun(input.id, input.roi, input.resultSummary)),
    bootstrap: publicProcedure.mutation(() => bootstrapSimulationRuns([
      { id: "SIM-024", gemCode: "GEM-01", gemName: "Scorpios Metalworks", scenario: "Refugo elevado na CNC-02", process: "Usinagem CNC", baselinePct: 4, targetPct: 2, windowDays: 90, failureMode: "Desgaste progressivo", status: "Executando", roi: "4.2 : 1", resultSummary: "Processo instável; desgaste da ferramenta responde por 42% do impacto." },
      { id: "SIM-023", gemCode: "GEM-01", gemName: "Scorpios Metalworks", scenario: "VOCs acima do baseline", process: "Pintura E-coat", baselinePct: 8, targetPct: 5, windowDays: 90, failureMode: "Variação de matéria-prima", status: "Concluída", roi: "3.7 : 1", resultSummary: "Redução de VOCs após ajuste de exaustão." },
      { id: "SIM-022", gemCode: "GEM-02", gemName: "Forja Nação", scenario: "Invasão zona de exclusão", process: "Prensa hidráulica", baselinePct: 3, targetPct: 1, windowDays: 60, failureMode: "Sensor de posição", status: "Concluída", roi: "2.9 : 1", resultSummary: "Plano de contenção aprovado para NR-12." },
      { id: "SIM-021", gemCode: "GEM-04", gemName: "CyberNetics AeroSpace", scenario: "Viés na inspeção visual", process: "Inspeção automatizada", baselinePct: 4, targetPct: 2, windowDays: 120, failureMode: "Parâmetro fora do padrão", status: "Em revisão", roi: "—", resultSummary: "Revisão de dados e fairness gate pendente." },
    ])),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
