export interface AvailabilitySlot {
  weekday: number;
  start_time: string;
  end_time: string;
}

export function isAvailableAt(slots: AvailabilitySlot[], weekday: number, time: string): boolean {
  return slots.some((slot) => slot.weekday === weekday && slot.start_time <= time && time < slot.end_time);
}
