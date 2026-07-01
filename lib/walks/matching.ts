export interface AvailabilitySlot {
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface WalkerMatchProfile {
  active: boolean;
  service_region: string | null;
  accepted_sizes: string[];
  availability: AvailabilitySlot[];
}

export interface WalkMatchRequest {
  region: string;
  weekday: number;
  startTime: string;
  petSize: string;
}

export function isAvailableAt(slots: AvailabilitySlot[], weekday: number, time: string): boolean {
  return slots.some((slot) => slot.weekday === weekday && slot.start_time <= time && time < slot.end_time);
}

export function canWalkerServeWalk(walker: WalkerMatchProfile, request: WalkMatchRequest): boolean {
  if (!walker.active) return false;
  if ((walker.service_region ?? "").toLowerCase() !== request.region.toLowerCase()) return false;
  if (!walker.accepted_sizes.includes(request.petSize)) return false;
  return isAvailableAt(walker.availability, request.weekday, request.startTime);
}
