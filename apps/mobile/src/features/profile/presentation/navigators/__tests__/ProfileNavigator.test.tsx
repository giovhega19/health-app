/**
 * `ProfileNavigator` (RF-01.01/RF-01.03/RF-01.06/RF-01.08, tarea `F01-T16`).
 * Prueba de integración: menú -> iniciar sesión / editar perfil / registrar
 * peso / eliminar cuenta, con fakes de puertos (sin SQLite/red real, ya
 * cubiertos en las pruebas de infraestructura de cada adaptador). CA-01.06.1,
 * CA-01.08.1.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { createProfileContainer } from "@/features/profile";
import { ProfileNavigator } from "../ProfileNavigator";
import { UserProfile } from "@/features/profile/domain/UserProfile";
import { asId } from "@/shared/domain/Id";
import { isOk } from "@/shared/domain/Result";
import { FakeProfileRepository } from "@test/fakes/FakeProfileRepository";
import { FakeBodyMetricRepository } from "@test/fakes/FakeBodyMetricRepository";
import { FakeAuthPort } from "@test/fakes/FakeAuthPort";
import { FakeTokenStoragePort } from "@test/fakes/FakeTokenStoragePort";
import { FakeRemoteProfilePort } from "@test/fakes/FakeRemoteProfilePort";
import { FakeRoutineProposalPort } from "@test/fakes/FakeRoutineProposalPort";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { aUserProfileProps } from "@test/fakes/aUserProfileProps";

function buildContainer() {
  const clock = new FakeClock("2026-09-23T10:00:00Z");
  const created = UserProfile.create(
    asId("00000000-0000-4000-b000-000000000008"),
    aUserProfileProps(),
    clock.now(),
  );
  if (!isOk(created)) {
    throw new Error("fixture inválida: UserProfile.create debería aceptar un perfil válido");
  }
  const profileRepository = new FakeProfileRepository(created.value);
  const bodyMetricRepository = new FakeBodyMetricRepository();
  const authPort = new FakeAuthPort();
  const tokenStoragePort = new FakeTokenStoragePort();
  const remoteProfilePort = new FakeRemoteProfilePort();
  const routineProposalPort = new FakeRoutineProposalPort();
  const eventBus = new FakeEventBus();

  const profile = createProfileContainer({
    profileRepository,
    bodyMetricRepository,
    authPort,
    tokenStoragePort,
    routineProposalPort,
    remoteProfilePort,
    eventBus,
    clock,
  });

  return { profile, clock, profileRepository, bodyMetricRepository, authPort, tokenStoragePort, remoteProfilePort, eventBus };
}

describe("RF-01.01/RF-01.03/RF-01.06/RF-01.08 ProfileNavigator", () => {
  it("desde el menú, navega a iniciar sesión y vuelve al menú al iniciar sesión con éxito", async () => {
    const { profile, clock, tokenStoragePort } = buildContainer();
    await render(<ProfileNavigator container={{ profile, clock }} onAccountDeleted={jest.fn()} />);

    await fireEvent.press(screen.getByRole("button", { name: /iniciar sesión/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/correo electrónico/i)).toBeTruthy();
    });

    await fireEvent.changeText(screen.getByLabelText(/correo electrónico/i), "ana@fitapp.test");
    await fireEvent.changeText(screen.getByLabelText(/contraseña/i), "password123");
    await fireEvent.press(screen.getByRole("button", { name: /^iniciar sesión$/i }));

    await waitFor(() => {
      expect(screen.getByText(/tu perfil/i)).toBeTruthy();
    });
    expect(tokenStoragePort.saveCalls).toHaveLength(1);
  });

  it("CA-01.08.1 con credenciales inválidas, muestra el error y no vuelve al menú", async () => {
    const { profile, clock, authPort } = buildContainer();
    authPort.loginResult = { ok: false, error: { code: "HTTP_401" } };
    await render(<ProfileNavigator container={{ profile, clock }} onAccountDeleted={jest.fn()} />);

    await fireEvent.press(screen.getByRole("button", { name: /iniciar sesión/i }));
    await fireEvent.changeText(screen.getByLabelText(/correo electrónico/i), "ana@fitapp.test");
    await fireEvent.changeText(screen.getByLabelText(/contraseña/i), "wrong");
    await fireEvent.press(screen.getByRole("button", { name: /^iniciar sesión$/i }));

    await waitFor(() => {
      expect(screen.getByText(/el correo o la contraseña no son correctos/i)).toBeTruthy();
    });
  });

  it("precarga el perfil actual al abrir editar perfil y guarda los cambios", async () => {
    const { profile, clock, remoteProfilePort, profileRepository } = buildContainer();
    await render(<ProfileNavigator container={{ profile, clock }} onAccountDeleted={jest.fn()} />);

    await fireEvent.press(screen.getByRole("button", { name: /editar perfil/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(remoteProfilePort.updateCalls).toHaveLength(1);
    });
    expect(profileRepository.savedProfiles.length).toBeGreaterThan(0);
  });

  it("CA-01.06.1 registra el peso de hoy y vuelve al menú", async () => {
    const { profile, clock, bodyMetricRepository } = buildContainer();
    await render(<ProfileNavigator container={{ profile, clock }} onAccountDeleted={jest.fn()} />);

    await fireEvent.press(screen.getByRole("button", { name: /registrar peso/i }));
    await fireEvent.changeText(screen.getByLabelText(/peso de hoy/i), "59.5");
    await fireEvent.press(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(bodyMetricRepository.appendCalls).toHaveLength(1);
    });
    expect(bodyMetricRepository.appendCalls[0]?.weightKg).toBe(59.5);
  });

  it("CA-01.08.1 al confirmar la eliminación de cuenta escribiendo ELIMINAR, llama a onAccountDeleted", async () => {
    const { profile, clock } = buildContainer();
    const onAccountDeleted = jest.fn();
    await render(<ProfileNavigator container={{ profile, clock }} onAccountDeleted={onAccountDeleted} />);

    await fireEvent.press(screen.getByRole("button", { name: /eliminar cuenta/i }));
    await fireEvent.changeText(screen.getByLabelText(/escribe "eliminar"/i), "ELIMINAR");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /eliminar cuenta/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /eliminar cuenta/i }));

    await waitFor(() => {
      expect(onAccountDeleted).toHaveBeenCalledTimes(1);
    });
  });

  it("desde una pantalla secundaria, el botón Cancelar/Atrás vuelve al menú", async () => {
    const { profile, clock } = buildContainer();
    await render(<ProfileNavigator container={{ profile, clock }} onAccountDeleted={jest.fn()} />);

    await fireEvent.press(screen.getByRole("button", { name: /eliminar cuenta/i }));
    await fireEvent.press(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.getByText(/tu perfil/i)).toBeTruthy();
    });
  });
});
