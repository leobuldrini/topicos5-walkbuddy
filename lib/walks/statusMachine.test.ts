import { expect, test } from "vitest";
import { canTransition, nextStatus } from "@/lib/walks/statusMachine";

test("accept moves solicitado to aceito", () => {
  expect(nextStatus("solicitado", "accept")).toBe("aceito");
});

test("cannot start a solicitado walk", () => {
  expect(canTransition("solicitado", "start")).toBe(false);
  expect(() => nextStatus("solicitado", "start")).toThrow("Transição inválida");
});

test("cancel is allowed before start only", () => {
  expect(canTransition("solicitado", "cancel")).toBe(true);
  expect(canTransition("aceito", "cancel")).toBe(true);
  expect(canTransition("em_andamento", "cancel")).toBe(false);
});

test("reject keeps solicitado", () => {
  expect(nextStatus("solicitado", "reject")).toBe("solicitado");
});
