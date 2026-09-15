import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"] = null): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const user = { id: 456789, openId: "production-test-user", email: "production@example.com", name: "Production Test User", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("integrated brake-pad production", () => {
  it("requires authentication for production data", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.production.orders({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.production.materialLots()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.production.engineering()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.production.inspections()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns orders and lots isolated to the current owner", async () => {
    const caller = appRouter.createCaller(context(user));
    const [orders, lots] = await Promise.all([caller.production.orders({}), caller.production.materialLots()]);
    expect(Array.isArray(orders)).toBe(true);
    expect(Array.isArray(lots)).toBe(true);
    expect(orders.every((order) => order.ownerId === user.id)).toBe(true);
    expect(lots.every((lot) => lot.ownerId === user.id)).toBe(true);
  });

  it("rejects invalid production orders before persistence", async () => {
    const caller = appRouter.createCaller(context(user));
    await expect(caller.production.createOrder({ productCode: "BP-AX-001", quantity: 0, customer: "Cliente", dueDate: new Date() })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.production.updateOrderStatus({ id: 0, status: "Concluída" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("loads the integrated industrial modules for the current owner", async () => {
    const caller = appRouter.createCaller(context(user));
    const [engineering, bom, stamping, reports, inspections] = await Promise.all([
      caller.production.engineering(), caller.production.bom({ productCode: "BP-AX-001" }), caller.production.stamping(), caller.production.reports(), caller.production.inspections(),
    ]);
    expect(engineering.every((item) => item.ownerId === user.id)).toBe(true);
    expect(bom.every((item) => item.ownerId === user.id)).toBe(true);
    expect(stamping.every((item) => item.ownerId === user.id)).toBe(true);
    expect(reports.every((item) => item.ownerId === user.id)).toBe(true);
    expect(inspections.every((item) => item.ownerId === user.id)).toBe(true);
  });

  it("validates production reports and digital inspection approval inputs", async () => {
    const caller = appRouter.createCaller(context(user));
    await expect(caller.production.report({ orderCode: "OP-1", operatorName: "", machineCode: "P04", shift: "1º turno", goodQty: 1, scrapQty: 0 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.production.approveInspection({ id: 0, result: "Conforme" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("validates new engineering part registration", async () => {
    const publicCaller = appRouter.createCaller(context());
    await expect(publicCaller.production.createEngineeringItem({ itemCode: "BP-NEW", title: "Peça", revision: "A", ownerName: "Engenharia" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const caller = appRouter.createCaller(context(user));
    await expect(caller.production.createEngineeringItem({ itemCode: "", title: "Peça", revision: "A", ownerName: "Engenharia" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
