import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { isOk } from "@/shared/domain/Result";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import { strings } from "@/shared/i18n";
import type { AppContainer } from "@/composition/container";
import { LoginScreen } from "../screens/Login";
import { EditProfileScreen } from "../screens/EditProfile";
import type { EditProfileCurrentValues, EditProfileFormValues } from "../screens/EditProfile";
import { LogWeightScreen } from "../screens/LogWeight";
import { DeleteAccountConfirmationScreen } from "../screens/DeleteAccountConfirmation";

/**
 * `ProfileNavigator` (RF-01.01/RF-01.03/RF-01.06/RF-01.08, tarea `F01-T16`):
 * orquesta las pantallas de perfil fuera del asistente de onboarding
 * (iniciar sesión, editar perfil, registrar peso, eliminar cuenta). Mismo
 * patrón de índice de vista en memoria que `OnboardingNavigator`/
 * `CatalogNavigator` (ver su comentario sobre por qué no son rutas de Expo
 * Router adicionales: ninguna CA exige que cada pantalla sea una URL
 * profundamente enlazable). La ruta (`app/profile/index.tsx`) solo inyecta
 * el contenedor de composición y el callback de navegación tras eliminar la
 * cuenta (CA-01.08.1: "vuelvo a la pantalla de bienvenida").
 */
type ProfileView = "menu" | "login" | "editProfile" | "logWeight" | "deleteConfirmation";

export interface ProfileNavigatorProps {
  container: Pick<AppContainer, "profile" | "clock">;
  onAccountDeleted: () => void;
}

const { title, loginCta, editProfileCta, logWeightCta, deleteAccountCta } = strings.profile.menu;

export function ProfileNavigator({ container, onAccountDeleted }: ProfileNavigatorProps): React.JSX.Element {
  const [view, setView] = useState<ProfileView>("menu");
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentValues, setCurrentValues] = useState<EditProfileCurrentValues | null>(null);

  const loadCurrentProfile = useCallback(async () => {
    const result = await container.profile.getCurrentProfile.execute();
    if (isOk(result) && result.value) {
      const profile = result.value;
      setCurrentValues({
        goal: profile.goal,
        level: profile.level,
        daysPerWeek: profile.daysPerWeek,
        minutesPerSession: profile.minutesPerSession,
        heightCm: profile.heightCm,
        equipment: profile.equipment,
        targetWeightKg: profile.targetWeightKg,
      });
    }
  }, [container]);

  useEffect(() => {
    if (view !== "editProfile" || currentValues) {
      return;
    }
    // `loadCurrentProfile` llama a `setCurrentValues` solo dentro de su
    // propio `await` (lectura asíncrona vía `GetCurrentProfile`), nunca de
    // forma síncrona en el cuerpo del efecto: mismo patrón de "fetch de
    // datos en un efecto" que `CatalogNavigator`/`OnboardingNavigator`.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ver comentario
    void loadCurrentProfile();
  }, [view, currentValues, loadCurrentProfile]);

  if (view === "login") {
    return (
      <LoginScreen
        submitting={submitting}
        errorCode={loginError}
        onBack={() => {
          setView("menu");
        }}
        onSubmit={(values) => {
          setSubmitting(true);
          setLoginError(null);
          void container.profile.loginUser
            .execute({ email: values.email, password: values.password })
            .then((result) => {
              if (!isOk(result)) {
                // `LoginUserError` es `AuthError | StorageError`: solo el
                // primero tiene `code` (el segundo, un fallo al guardar el
                // token localmente, es un caso mucho menos frecuente y no
                // tiene un mensaje específico en `strings.profile.login`).
                setLoginError("code" in result.error ? result.error.code : "STORAGE_ERROR");
                return;
              }
              setView("menu");
            })
            .finally(() => {
              setSubmitting(false);
            });
        }}
      />
    );
  }

  if (view === "editProfile") {
    if (!currentValues) {
      return <LoadingView />;
    }
    return (
      <EditProfileScreen
        currentValues={currentValues}
        submitting={submitting}
        onSubmit={(values: EditProfileFormValues) => {
          setSubmitting(true);
          void container.profile.updateProfile.execute(values).finally(() => {
            setSubmitting(false);
            setView("menu");
          });
        }}
      />
    );
  }

  if (view === "logWeight") {
    return (
      <LogWeightScreen
        submitting={submitting}
        onSubmit={(weightKg) => {
          setSubmitting(true);
          void container.profile.logBodyWeight
            .execute({ weightKg, date: container.clock.now() })
            .finally(() => {
              setSubmitting(false);
              setView("menu");
            });
        }}
      />
    );
  }

  if (view === "deleteConfirmation") {
    return (
      <DeleteAccountConfirmationScreen
        submitting={submitting}
        onCancel={() => {
          setView("menu");
        }}
        onConfirm={() => {
          setSubmitting(true);
          void container.profile.deleteAccount.execute().then((result) => {
            setSubmitting(false);
            if (isOk(result)) {
              onAccountDeleted();
            }
          });
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: "center" }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg }}>
        {title}
      </Text>
      <PrimaryButton
        label={loginCta}
        onPress={() => {
          setLoginError(null);
          setView("login");
        }}
      />
      <View style={{ height: spacing.sm }} />
      <PrimaryButton
        label={editProfileCta}
        onPress={() => {
          setCurrentValues(null);
          setView("editProfile");
        }}
      />
      <View style={{ height: spacing.sm }} />
      <PrimaryButton
        label={logWeightCta}
        onPress={() => {
          setView("logWeight");
        }}
      />
      <View style={{ height: spacing.sm }} />
      <PrimaryButton
        label={deleteAccountCta}
        variant="secondary"
        onPress={() => {
          setView("deleteConfirmation");
        }}
      />
    </View>
  );
}

function LoadingView(): React.JSX.Element {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.lg }}>
      <Text>{strings.common.loading}</Text>
    </View>
  );
}
