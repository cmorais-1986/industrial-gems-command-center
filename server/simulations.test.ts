import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const authenticatedUser = {
  id: 987654,
  openId: "simulation-test-user",
  email: "simulation-test@example.com",
  name: "Simulation Test User",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("authenticated simulation workspace", () => {
  it("rejects unauthenticated access to simulation data", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.simulations.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.copilot.list({ simulationId: "SIM-024" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns a list from the persistent store for the current owner", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));
    const result = await caller.simulations.list({ status: "Concluída" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.every((run) => run.ownerId === authenticatedUser.id)).toBe(true);
  });

  it("rejects invalid scenario parameters before touching the database", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));
    await expect(caller.simulations.create({
      gemCode: "GEM-01",
      gemName: "Scorpios Metalworks",
      scenario: "",
      process: "Usinagem CNC",
      baselinePct: 4,
      targetPct: 2,
      windowDays: 90,
      failureMode: "Desgaste progressivo",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects malformed completion payloads", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));
    await expect(caller.simulations.complete({
      id: "SIM-024",
      roi: "",
      resultSummary: "resultado",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("loads owner-scoped copiloto and governance histories", async () => {
    const caller = appRouter.createCaller(createContext(authenticatedUser));
    const [messages, decisions, audits] = await Promise.all([
      caller.copilot.list({ simulationId: "SIM-024" }),
      caller.governance.list({ simulationId: "SIM-024", status: "Aprovada", from: new Date("2026-01-01") }),
      caller.governance.audit({ decisionId: 999999 }),
    ]);
    expect(Array.isArray(messages)).toBe(true);
    expect(Array.isArray(decisions)).toBe(true);
    expect(Array.isArray(audits)).toBe(true);
    expect(messages.every((message) => message.ownerId === authenticatedUser.id)).toBe(true);
    expect(decisions.every((decision) => decision.ownerId === authenticatedUser.id)).toBe(true);
    expect(audits.every((audit) => audit.ownerId === authenticatedUser.id)).toBe(true);
  });

  it("validates governance updates and blocks unauthenticated updates", async () => {
    const publicCaller = appRouter.createCaller(createContext());
    await expect(publicCaller.governance.update({ id: 1, decision: "A", rationale: "B", status: "Aprovada" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const caller = appRouter.createCaller(createContext(authenticatedUser));
    await expect(caller.governance.update({ id: 0, decision: "A", rationale: "B", status: "Aprovada" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
