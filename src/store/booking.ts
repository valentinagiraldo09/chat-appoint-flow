import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AttentionType, Franja } from "@/mocks/catalog";
import type { Slot } from "@/mocks/availability";
import type { CoverageResult } from "@/mocks/coverage";

export type Filters = {
  sede?: string;
  profesional?: string;
  attention?: AttentionType;
  franja?: Franja;
};

export type ChatMsg = { id: string; from: "bot" | "user" | "system"; text: string; ts: number };


export type Patient = {
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
};

export type BookingState = {
  specialty?: string;
  service?: string;
  date?: string; // yyyy-mm-dd, undefined = "lo más pronto"
  filters: Filters;
  selectedSlot?: Slot;
  patient?: Patient;
  aseguradora?: string;
  coverage?: CoverageResult;
  acceptedSuggestedDate?: boolean;
  payParticularOverride?: boolean;
  preferredDate?: string;
  paymentMethod?: "online" | "clinic" | "none";
  confirmationCode?: string;

  setSpecialty: (s: string) => void;
  setService: (s: string) => void;
  setDate: (d?: string) => void;
  setFilter: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  clearFilter: (k: keyof Filters) => void;
  resetFilters: () => void;
  setSelectedSlot: (s?: Slot) => void;
  setPatient: (p: Patient) => void;
  setAseguradora: (a: string) => void;
  setCoverage: (c?: CoverageResult) => void;
  setAcceptedSuggestedDate: (v: boolean) => void;
  setPayParticularOverride: (v: boolean) => void;
  setPreferredDate: (d?: string) => void;
  setPaymentMethod: (m: "online" | "clinic" | "none") => void;
  setConfirmationCode: (c: string) => void;
  reset: () => void;
};

const initial = {
  specialty: undefined,
  service: undefined,
  date: undefined,
  filters: {},
  selectedSlot: undefined,
  patient: undefined,
  aseguradora: undefined,
  coverage: undefined,
  acceptedSuggestedDate: false,
  payParticularOverride: false,
  preferredDate: undefined,
  paymentMethod: undefined,
  confirmationCode: undefined,
};

export const useBooking = create<BookingState>()(
  persist(
    (set) => ({
      ...initial,
      setSpecialty: (s) => set({ specialty: s }),
      setService: (s) => set({ service: s }),
      setDate: (d) => set({ date: d }),
      setFilter: (k, v) => set((st) => ({ filters: { ...st.filters, [k]: v } })),
      clearFilter: (k) =>
        set((st) => {
          const f = { ...st.filters };
          delete f[k];
          return { filters: f };
        }),
      resetFilters: () => set({ filters: {} }),
      setSelectedSlot: (s) => set({ selectedSlot: s }),
      setPatient: (p) => set({ patient: p }),
      setAseguradora: (a) => set({ aseguradora: a }),
      setCoverage: (c) => set({ coverage: c }),
      setAcceptedSuggestedDate: (v) => set({ acceptedSuggestedDate: v }),
      setPayParticularOverride: (v) => set({ payParticularOverride: v }),
      setPreferredDate: (d) => set({ preferredDate: d }),
      setPaymentMethod: (m) => set({ paymentMethod: m }),
      setConfirmationCode: (c) => set({ confirmationCode: c }),
      reset: () => set({ ...initial }),
    }),
    {
      name: "booking-flow",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : (undefined as unknown as Storage),
      ),
    },
  ),
);
