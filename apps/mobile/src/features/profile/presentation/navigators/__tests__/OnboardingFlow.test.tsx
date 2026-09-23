/**
 * `OnboardingNavigator` (RF-01.02, tarea `F01-T14`/`F01-T15`). Prueba de
 * integración que recorre los pasos clave del onboarding en modo invitado
 * (CA-01.02.1: "Dado que abro la app por primera vez, cuando completo todos
 * los pasos y elijo 'Continuar como invitado', entonces se crea un perfil
 * local sin cuenta en el servidor y veo mi plan semanal propuesto en la
 * pantalla de inicio"). Usa `createProfileContainer` con fakes en memoria
 * (mismo patrón que las pruebas de aplicación, `07-estrategia-pruebas.md`
 * §2.4): no depende de SQLite/red real, eso ya está cubierto por las
 * pruebas de infraestructura.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { createProfileContainer } from "@/features/profile";
import { OnboardingNavigator } from "../OnboardingNavigator";
import { useOnboardingStore } from "../../stores/useOnboardingStore";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeBodyMetricRepository } from "@test/fakes/FakeBodyMetricRepository";
import { FakeAuthPort } from "@test/fakes/FakeAuthPort";
import { FakeTokenStoragePort } from "@test/fakes/FakeTokenStoragePort";
import { FakeRemoteProfilePort } from "@test/fakes/FakeRemoteProfilePort";
import { FakeRoutineProposalPort } from "@test/fakes/FakeRoutineProposalPort";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";

function buildContainer() {
  const profileRepository = new FakeProfileRepository();
  const bodyMetricRepository = new FakeBodyMetricRepository();
  const routineProposalPort = new FakeRoutineProposalPort();
  routineProposalPort.result = {
    ok: true,
    value: {
      days: [
        {
          dayNumber: 1,
          estimatedDurationSeconds: 2700,
          routine: { timerDefaults: {} as never, blocks: [] },
        },
      ],
    },
  };
  const eventBus = new FakeEventBus();
  const clock = new FakeClock("2026-09-22T10:00:00Z");

  const profile = createProfileContainer({
    profileRepository,
    bodyMetricRepository,
    authPort: new FakeAuthPort(),
    tokenStoragePort: new FakeTokenStoragePort(),
    routineProposalPort,
    remoteProfilePort: new FakeRemoteProfilePort(),
    eventBus,
    clock,
  });

  return { profile, clock, profileRepository };
}

describe("RF-01.02 OnboardingNavigator", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("CA-01.02.1 completa el onboarding en modo invitado: crea un perfil local y muestra el plan propuesto", async () => {
    const { profile, clock, profileRepository } = buildContainer();
    const onFinish = jest.fn();

    await render(<OnboardingNavigator container={{ profile, clock }} onFinish={onFinish} />);

    // Bienvenida -> Objetivo
    await fireEvent.press(screen.getByRole("button", { name: /empezar/i }));
    await fireEvent.press(screen.getByRole("radio", { name: /salud general/i }));
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    // Nivel
    await fireEvent.press(screen.getByRole("radio", { name: /principiante/i }));
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    // Disponibilidad (valores por defecto ya válidos)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continuar/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    // Equipo (sin seleccionar nada = NONE)
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    // Datos corporales
    await fireEvent.changeText(screen.getByLabelText(/fecha de nacimiento/i), "1996-01-15");
    await fireEvent.changeText(screen.getByLabelText(/estatura \(cm\)/i), "165");
    await fireEvent.changeText(screen.getByLabelText(/peso \(kg\)/i), "60");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continuar/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    // Cuestionario de aptitud (todo "No")
    for (const noButton of screen.getAllByRole("radio", { name: /^no$/i })) {
      await fireEvent.press(noButton);
    }
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    // Consentimiento
    await fireEvent.press(screen.getByRole("checkbox", { name: /acepto el tratamiento/i }));
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    // Resumen: perfil ya creado localmente (CA-01.02.1), plan visible
    await waitFor(() => {
      expect(profileRepository.savedProfiles.length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/día 1/i)).toBeTruthy();

    // Continuar como invitado -> Notificaciones -> Inicio
    await fireEvent.press(screen.getByRole("button", { name: /continuar como invitado/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /activar notificaciones/i })).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole("button", { name: /ahora no/i }));

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(profileRepository.savedProfiles[0]?.goal).toBe("GENERAL_HEALTH");
  }, 15000);
});
