import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { isOk } from "@/shared/domain/Result";
import { colors, spacing } from "@/shared/ui";
import { strings } from "@/shared/i18n";
import { calculateAge, calculateBmi, calculateBmr, bmiCategory } from "../../domain/UserProfile";
import type { AppContainer } from "@/composition/container";
import { WelcomeScreen } from "../screens/Welcome";
import { GoalScreen } from "../screens/Goal";
import { LevelScreen } from "../screens/Level";
import { AvailabilityScreen } from "../screens/Availability";
import { EquipmentScreen } from "../screens/Equipment";
import { BodyDataScreen } from "../screens/BodyData";
import { FitnessQuestionnaireScreen } from "../screens/FitnessQuestionnaire";
import { ConsentScreen } from "../screens/Consent";
import { SummaryScreen } from "../screens/Summary";
import type { SummaryPlanDay } from "../screens/Summary";
import { AccountChoiceScreen } from "../screens/AccountChoice";
import { NotificationsPermissionScreen } from "../screens/NotificationsPermission";
import { useOnboardingStore } from "../stores/useOnboardingStore";

/**
 * `OnboardingNavigator` (RF-01.02, tarea `F01-T14`/`F01-T15`): orquesta el
 * asistente completo (`spec.md` "Flujo de onboarding": Bienvenida -> Objetivo
 * -> Nivel -> Disponibilidad -> Equipo -> Datos corporales -> Cuestionario de
 * aptitud -> Consentimiento -> Resumen -> [Crear cuenta | Continuar como
 * invitado] -> Permiso de notificaciones -> Inicio), CA-01.02.1. Vive en
 * `presentation/` (no en `app/`): la ruta de Expo Router
 * (`app/onboarding/index.tsx`) solo monta este componente e inyecta el
 * contenedor de composición y el callback de navegación final (Art. 3.1,
 * "Expo Router solo en app/").
 *
 * Decisión de diseño: los 11 pasos se manejan con un índice de paso en
 * memoria (no 11 rutas de Expo Router), porque ninguna CA exige que cada
 * paso sea una URL profundamente enlazable; "cada paso se puede retroceder"
 * (`spec.md`) se cumple con el botón "Atrás" de cada pantalla. Simplifica el
 * paso de datos entre pasos (todo vive en `useOnboardingStore`) sin
 * serializar el borrador en parámetros de ruta.
 */
type Step =
  | "welcome"
  | "goal"
  | "level"
  | "availability"
  | "equipment"
  | "bodyData"
  | "fitnessQuestionnaire"
  | "consent"
  | "summary"
  | "accountChoice"
  | "notifications";

const STEP_ORDER: Step[] = [
  "welcome",
  "goal",
  "level",
  "availability",
  "equipment",
  "bodyData",
  "fitnessQuestionnaire",
  "consent",
  "summary",
  "notifications",
];

export interface OnboardingNavigatorProps {
  container: Pick<AppContainer, "profile" | "clock">;
  onFinish: () => void;
}

export function OnboardingNavigator({ container, onFinish }: OnboardingNavigatorProps): React.JSX.Element {
  const [step, setStep] = useState<Step>("welcome");
  const [summary, setSummary] = useState<{
    bmi: number;
    bmiCategory: ReturnType<typeof bmiCategory>;
    bmr: number;
    plan: SummaryPlanDay[] | null;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const store = useOnboardingStore();

  const goTo = useCallback((next: Step) => {
    setStep(next);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!store.goal || !store.level || store.daysPerWeek === null || store.minutesPerSession === null) {
      return;
    }
    if (!store.birthDate || !store.gender || store.heightCm === null || store.weightKg === null) {
      return;
    }

    const result = await container.profile.completeOnboarding.execute({
      goal: store.goal,
      level: store.level,
      daysPerWeek: store.daysPerWeek,
      minutesPerSession: store.minutesPerSession,
      equipment: store.equipment.length > 0 ? store.equipment : ["NONE"],
      unitSystem: store.unitSystem,
      birthDate: new Date(store.birthDate),
      gender: store.gender,
      heightCm: store.heightCm,
      weightKg: store.weightKg,
      fitnessQuestionnaireAnswers: store.fitnessQuestionnaireAnswers,
      healthDataConsent: store.healthDataConsent,
    });

    if (!isOk(result)) {
      setSummary({ bmi: 0, bmiCategory: "NORMAL", bmr: 0, plan: null });
      return;
    }

    const today = container.clock.now();
    const age = calculateAge(new Date(store.birthDate), today);
    const bmi = calculateBmi(store.weightKg, store.heightCm);
    const bmr = calculateBmr({ weightKg: store.weightKg, heightCm: store.heightCm, age, gender: store.gender });
    const rawProposal = result.value.proposal as
      | { days: { dayNumber: number; estimatedDurationSeconds: number }[] }
      | undefined;
    const plan = rawProposal && Array.isArray(rawProposal.days) ? rawProposal.days : null;

    setSummary({
      bmi,
      bmiCategory: bmiCategory(bmi),
      bmr,
      plan: plan ? plan.map((day) => ({ dayNumber: day.dayNumber, durationMinutes: Math.round(day.estimatedDurationSeconds / 60) })) : null,
    });
  }, [container, store]);

  useEffect(() => {
    if (step !== "summary" || summary) {
      return;
    }
    // `completeOnboarding` llama a `setSummary` solo dentro de su propio
    // `await` (obtención asíncrona de la propuesta vía `RoutineProposalPort`),
    // nunca de forma síncrona en el cuerpo del efecto: es el patrón
    // recomendado de "fetch de datos en un efecto" (React docs), no una
    // cascada de renders síncrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ver comentario
    void completeOnboarding();
  }, [step, summary, completeOnboarding]);

  switch (step) {
    case "welcome":
      return <WelcomeScreen onStart={() => { goTo("goal"); }} />;
    case "goal":
      return (
        <GoalScreen
          selected={store.goal}
          onSelect={store.setGoal}
          onContinue={() => { goTo("level"); }}
          step={2}
          totalSteps={STEP_ORDER.length}
        />
      );
    case "level":
      return (
        <LevelScreen
          selected={store.level}
          onSelect={store.setLevel}
          onContinue={() => { goTo("availability"); }}
          onBack={() => { goTo("goal"); }}
          step={3}
          totalSteps={STEP_ORDER.length}
        />
      );
    case "availability":
      return (
        <AvailabilityScreen
          defaultValues={{ daysPerWeek: store.daysPerWeek ?? undefined, minutesPerSession: store.minutesPerSession ?? undefined }}
          onContinue={(values) => {
            store.setAvailability(values.daysPerWeek, values.minutesPerSession);
            goTo("equipment");
          }}
          onBack={() => { goTo("level"); }}
          step={4}
          totalSteps={STEP_ORDER.length}
        />
      );
    case "equipment":
      return (
        <EquipmentScreen
          selected={store.equipment}
          onToggle={store.toggleEquipment}
          onContinue={() => { goTo("bodyData"); }}
          onBack={() => { goTo("availability"); }}
          step={5}
          totalSteps={STEP_ORDER.length}
        />
      );
    case "bodyData":
      return (
        <BodyDataScreen
          unitSystem={store.unitSystem}
          onContinue={(result) => {
            store.setBodyData(result);
            goTo("fitnessQuestionnaire");
          }}
          onBack={() => { goTo("equipment"); }}
          step={6}
          totalSteps={STEP_ORDER.length}
        />
      );
    case "fitnessQuestionnaire":
      return (
        <FitnessQuestionnaireScreen
          onContinue={(answers) => {
            store.setFitnessQuestionnaireAnswers(answers);
            goTo("consent");
          }}
          onBack={() => { goTo("bodyData"); }}
          step={7}
          totalSteps={STEP_ORDER.length}
        />
      );
    case "consent":
      return (
        <ConsentScreen
          onAccept={() => {
            store.setHealthDataConsent(true);
            goTo("summary");
          }}
        />
      );
    case "summary":
      return (
        <SummaryScreen
          bmi={summary?.bmi ?? 0}
          bmiCategory={summary?.bmiCategory ?? "NORMAL"}
          bmr={summary?.bmr ?? 0}
          plan={summary?.plan ?? null}
          onCreateAccount={() => { goTo("accountChoice"); }}
          onContinueAsGuest={() => {
            void container.profile.continueAsGuest.execute().then(() => {
              goTo("notifications");
            });
          }}
        />
      );
    case "accountChoice":
      return (
        <AccountChoiceScreen
          submitting={submitting}
          onBack={() => { goTo("summary"); }}
          onSubmit={(values) => {
            setSubmitting(true);
            void container.profile.createAccount
              .execute({ email: values.email, password: values.password, acceptedTermsVersion: "v1" })
              .finally(() => {
                setSubmitting(false);
                goTo("notifications");
              });
          }}
        />
      );
    case "notifications":
      return <NotificationsPermissionScreen onAllow={onFinish} onSkip={onFinish} />;
    default:
      return (
        <View style={{ padding: spacing.lg, backgroundColor: colors.background }}>
          <Text>{strings.common.loading}</Text>
        </View>
      );
  }
}
