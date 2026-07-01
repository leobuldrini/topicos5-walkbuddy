export type WalkStatus = "solicitado" | "aceito" | "em_andamento" | "concluido" | "cancelado";
export type WalkAction = "accept" | "reject" | "start" | "complete" | "cancel";

const TRANSITIONS: Record<WalkAction, { from: WalkStatus[]; to: WalkStatus }> = {
  accept: { from: ["solicitado"], to: "aceito" },
  reject: { from: ["solicitado"], to: "solicitado" },
  start: { from: ["aceito"], to: "em_andamento" },
  complete: { from: ["em_andamento"], to: "concluido" },
  cancel: { from: ["solicitado", "aceito"], to: "cancelado" },
};

export function canTransition(from: WalkStatus, action: WalkAction): boolean {
  return TRANSITIONS[action].from.includes(from);
}

export function nextStatus(from: WalkStatus, action: WalkAction): WalkStatus {
  if (!canTransition(from, action)) {
    throw new Error(`Transição inválida: ${from} -> ${action}`);
  }

  return TRANSITIONS[action].to;
}
