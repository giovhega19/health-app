import { create } from "zustand";
import type { FitnessGoal } from "@/shared/domain/FitnessGoal";
import type { Level } from "@/shared/domain/Level";
import type { Equipment } from "@/shared/domain/Equipment";
import type { UnitSystem } from "@/shared/domain/UnitSystem";
import type { Gender } from "@/shared/domain/Gender";

/**
 * `useOnboardingStore` (Zustand, tarea `F01-T14`): borrador multi-paso del
 * asistente de onboarding (`spec.md` "Flujo de onboarding"). Cada pantalla
 * lee/escribe solo su propio pedazo de estado (Art. 3.1: estado de UI con
 * Zustand); la navegación real entre pasos la resuelve Expo Router
 * (`app/onboarding/*`), no este store.
 */
export interface OnboardingDraft {
  goal: FitnessGoal | null;
  level: Level | null;
  daysPerWeek: number | null;
  minutesPerSession: number | null;
  equipment: Equipment[];
  unitSystem: UnitSystem;
  birthDate: string | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  fitnessQuestionnaireAnswers: boolean[];
  healthDataConsent: boolean;
}

export interface OnboardingStore extends OnboardingDraft {
  setGoal: (goal: FitnessGoal) => void;
  setLevel: (level: Level) => void;
  setAvailability: (daysPerWeek: number, minutesPerSession: number) => void;
  toggleEquipment: (equipment: Equipment) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setBodyData: (data: {
    birthDate: string;
    gender: Gender;
    heightCm: number;
    weightKg: number;
  }) => void;
  setFitnessQuestionnaireAnswers: (answers: boolean[]) => void;
  setHealthDataConsent: (consent: boolean) => void;
  reset: () => void;
}

const initialDraft: OnboardingDraft = {
  goal: null,
  level: null,
  daysPerWeek: null,
  minutesPerSession: null,
  equipment: [],
  unitSystem: "METRIC",
  birthDate: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  fitnessQuestionnaireAnswers: [],
  healthDataConsent: false,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...initialDraft,
  setGoal: (goal) => {
    set({ goal });
  },
  setLevel: (level) => {
    set({ level });
  },
  setAvailability: (daysPerWeek, minutesPerSession) => {
    set({ daysPerWeek, minutesPerSession });
  },
  toggleEquipment: (equipment) => {
    set((state) => ({
      equipment: state.equipment.includes(equipment)
        ? state.equipment.filter((item) => item !== equipment)
        : [...state.equipment, equipment],
    }));
  },
  setUnitSystem: (unitSystem) => {
    set({ unitSystem });
  },
  setBodyData: ({ birthDate, gender, heightCm, weightKg }) => {
    set({ birthDate, gender, heightCm, weightKg });
  },
  setFitnessQuestionnaireAnswers: (fitnessQuestionnaireAnswers) => {
    set({ fitnessQuestionnaireAnswers });
  },
  setHealthDataConsent: (healthDataConsent) => {
    set({ healthDataConsent });
  },
  reset: () => {
    set(initialDraft);
  },
}));
