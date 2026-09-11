import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("simulations router", () => {
  it("returns a list from the persistent simulation store", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.simulations.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects invalid scenario parameters before touching the database", async () => {
    const caller = appRouter.createCaller(createPublicContext());
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
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.simulations.complete({
      id: "SIM-024",
      roi: "",
      resultSummary: "resultado",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
