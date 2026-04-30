import {
  PROFESIONALES,
  SEDES,
  ATTENTION_TYPES,
  type AttentionType,
  franjaForHour,
} from "./catalog";

export type Slot = {
  id: string;
  date: string; // yyyy-mm-dd
  hour: number;
  minute: number;
  profesional: string;
  sede: string;
  attention: AttentionType;
  price: number;
};

// Deterministic PRNG (Mulberry32) seeded by string
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Determine if a date has availability. ~65% of upcoming days have availability,
 * deterministic by date+specialty.
 */
export function hasAvailability(date: Date, specialty: string, service: string): boolean {
  // Combinaciones forzadas sin disponibilidad para demo
  if (specialty === "Dermatología" && service === "Procedimiento") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d0 = new Date(date);
  d0.setHours(0, 0, 0, 0);
  if (d0 < today) return false;
  // Only within ~90 days
  const diff = (d0.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff > 90) return false;
  const r = mulberry32(hash(`${ymd(d0)}|${specialty}|${service}`))();
  return r < 0.65;
}

/**
 * Generate slots for a given day. Number and content vary deterministically.
 */
export function generateSlots(date: Date, specialty: string, service: string): Slot[] {
  if (!hasAvailability(date, specialty, service)) return [];
  const seed = hash(`${ymd(date)}|${specialty}|${service}|slots`);
  const rng = mulberry32(seed);
  const count = 6 + Math.floor(rng() * 9); // 6..14
  const used = new Set<string>();
  const slots: Slot[] = [];
  let attempts = 0;
  while (slots.length < count && attempts < 60) {
    attempts++;
    const hour = 7 + Math.floor(rng() * 12); // 7..18
    const minute = [0, 15, 30, 45][Math.floor(rng() * 4)];
    const key = `${hour}:${minute}`;
    if (used.has(key)) continue;
    used.add(key);
    const prof = PROFESIONALES[Math.floor(rng() * PROFESIONALES.length)];
    const sede = SEDES[Math.floor(rng() * SEDES.length)];
    const attention = ATTENTION_TYPES[Math.floor(rng() * ATTENTION_TYPES.length)];
    const basePrice = service === "Primera vez" ? 120000 : 90000;
    const price = basePrice + Math.floor(rng() * 8) * 10000;
    slots.push({
      id: `${ymd(date)}-${key}-${slots.length}`,
      date: ymd(date),
      hour,
      minute,
      profesional: prof,
      sede,
      attention,
      price,
    });
  }
  // Sort by hour
  return slots.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}

export type SlotFilters = {
  sede?: string;
  profesional?: string;
  attention?: AttentionType;
  franja?: "Mañana" | "Tarde" | "Noche";
};

export function filterSlots(slots: Slot[], f: SlotFilters): Slot[] {
  return slots.filter((s) => {
    if (f.sede && s.sede !== f.sede) return false;
    if (f.profesional && s.profesional !== f.profesional) return false;
    if (f.attention && s.attention !== f.attention) return false;
    if (f.franja && franjaForHour(s.hour) !== f.franja) return false;
    return true;
  });
}

export function findNextAvailableDate(
  from: Date,
  specialty: string,
  service: string,
  maxDays = 90,
): Date | null {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < maxDays; i++) {
    if (hasAvailability(d, specialty, service)) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return null;
}

export function getMonthAvailability(
  year: number,
  month: number, // 0-indexed
  specialty: string,
  service: string,
): Set<string> {
  const set = new Set<string>();
  const days = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= days; day++) {
    const d = new Date(year, month, day);
    if (hasAvailability(d, specialty, service)) set.add(ymd(d));
  }
  return set;
}

export function formatTime(hour: number, minute: number): string {
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
}
