import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AttentionType, Franja } from "@/mocks/catalog";
import type { Slot } from "@/mocks/availability";
import type { CoverageResult } from "@/mocks/coverage";
import type { ValidationResult } from "@/mocks/validations";

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
  previousAseguradora?: string;
  coverage?: CoverageResult;
  acceptedSuggestedDate?: boolean;
  payParticularOverride?: boolean;
  preferredDate?: string;
  paymentMethod?: "online" | "clinic" | "none";
  confirmationCode?: string;
  chat: ChatMsg[];
  filterSource?: "ui" | "chat" | "init";
  coverageOnly?: boolean;
  coverageMinDate?: string;
  validationResult?: ValidationResult;
  _hasHydrated?: boolean;


  setSpecialty: (s: string) => void;
  setService: (s: string) => void;
  setDate: (d?: string) => void;
  setFilter: <K extends keyof Filters>(k: K, v: Filters[K], source?: "ui" | "chat") => void;
  clearFilter: (k: keyof Filters, source?: "ui" | "chat") => void;
  resetFilters: (source?: "ui" | "chat") => void;
  setSelectedSlot: (s?: Slot) => void;
  setPatient: (p: Patient) => void;
  setAseguradora: (a: string) => void;
  setPreviousAseguradora: (a?: string) => void;
  setCoverage: (c?: CoverageResult) => void;
  setAcceptedSuggestedDate: (v: boolean) => void;
  setPayParticularOverride: (v: boolean) => void;
  setPreferredDate: (d?: string) => void;
  setPaymentMethod: (m: "online" | "clinic" | "none") => void;
  setConfirmationCode: (c: string) => void;
  setCoverageOnly: (v: boolean) => void;
  setCoverageMinDate: (d?: string) => void;
  setValidationResult: (v?: ValidationResult) => void;
  pushChat: (m: Omit<ChatMsg, "id" | "ts">) => void;
  clearChat: () => void;
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
  previousAseguradora: undefined,
  coverage: undefined,
  acceptedSuggestedDate: false,
  payParticularOverride: false,
  preferredDate: undefined,
  paymentMethod: undefined,
  confirmationCode: undefined,
  chat: [] as ChatMsg[],
  filterSource: undefined as "ui" | "chat" | "init" | undefined,
  coverageOnly: false,
  coverageMinDate: undefined as string | undefined,
  validationResult: undefined as ValidationResult | undefined,
};

export const useBooking = create<BookingState>()(
  persist(
    (set) => ({
      ...initial,
      setSpecialty: (s) => set({ specialty: s }),
      setService: (s) => set({ service: s }),
      setDate: (d) => set({ date: d }),
      setFilter: (k, v, source = "ui") =>
        set((st) => ({ filters: { ...st.filters, [k]: v }, filterSource: source })),
      clearFilter: (k, source = "ui") =>
        set((st) => {
          const f = { ...st.filters };
          delete f[k];
          return { filters: f, filterSource: source };
        }),
      resetFilters: (source = "ui") => set({ filters: {}, filterSource: source }),
      setSelectedSlot: (s) => set({ selectedSlot: s }),
      setPatient: (p) => set({ patient: p }),
      setAseguradora: (a) => set({ aseguradora: a }),
      setPreviousAseguradora: (a) => set({ previousAseguradora: a }),
      setCoverage: (c) => set({ coverage: c }),
      setAcceptedSuggestedDate: (v) => set({ acceptedSuggestedDate: v }),
      setPayParticularOverride: (v) => set({ payParticularOverride: v }),
      setPreferredDate: (d) => set({ preferredDate: d }),
      setPaymentMethod: (m) => set({ paymentMethod: m }),
      setConfirmationCode: (c) => set({ confirmationCode: c }),
      setCoverageOnly: (v) => set({ coverageOnly: v }),
      setCoverageMinDate: (d) => set({ coverageMinDate: d }),
      setValidationResult: (v) => set({ validationResult: v }),
      pushChat: (m) =>
        set((st) => ({
          chat: [
            ...st.chat,
            { ...m, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now() },
          ],
        })),
      clearChat: () => set({ chat: [] }),
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
