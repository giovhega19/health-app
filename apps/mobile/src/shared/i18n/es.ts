/**
 * Diccionario de textos en español (Art. 8.2 de la constitución: "Textos de
 * UI solo mediante i18n, nunca literales en componentes"). Recurso de
 * traducción real de i18next (`./index.ts`); se mantiene `strings` como
 * export nombrado por compatibilidad con el código de H1 que ya lo consume
 * directamente (p. ej. `features/profile/presentation/screens/Consent.tsx`).
 */
export const strings = {
  home: {
    title: "FitApp",
    onboardingCta: "Empezar onboarding",
    catalogCta: "Ver catálogo",
    profileCta: "Mi perfil",
  },
  common: {
    continue: "Continuar",
    back: "Atrás",
    skip: "Omitir",
    cancel: "Cancelar",
    confirm: "Confirmar",
    loading: "Cargando…",
    stepIndicator: "Paso {{step}} de {{total}}",
  },
  profile: {
    consent: {
      explanation:
        "Necesitamos tu consentimiento para tratar tus datos de salud (estatura, peso y respuestas del cuestionario de aptitud) y ofrecerte una propuesta segura. Puedes retirarlo eliminando tu cuenta en cualquier momento.",
      checkboxLabel: "Acepto el tratamiento de mis datos de salud",
      continueLabel: "Continuar",
    },
    menu: {
      title: "Tu perfil",
      loginCta: "Iniciar sesión",
      editProfileCta: "Editar perfil",
      logWeightCta: "Registrar peso",
      deleteAccountCta: "Eliminar cuenta",
    },
    login: {
      title: "Inicia sesión",
      emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña",
      submitCta: "Iniciar sesión",
      errors: {
        invalidEmail: "Ingresa un correo válido.",
        invalidCredentials: "El correo o la contraseña no son correctos.",
      },
    },
    editProfile: {
      title: "Editar perfil",
      goalLabel: "Objetivo",
      levelLabel: "Nivel",
      daysLabel: "Días por semana",
      minutesLabel: "Minutos por sesión",
      heightLabel: "Estatura (cm)",
      equipmentLabel: "Equipo",
      targetWeightLabel: "Peso objetivo (kg, opcional)",
      saveCta: "Guardar cambios",
      errors: {
        invalidRange: "Fuera del rango permitido.",
        invalidHeight: "La estatura debe estar entre 100 y 250 cm.",
        invalidWeight: "El peso debe estar entre 25 y 350 kg.",
      },
    },
    logWeight: {
      title: "Registrar peso",
      weightLabel: "Peso de hoy (kg)",
      saveCta: "Guardar",
      errors: {
        invalidWeight: "El peso debe estar entre 25 y 350 kg.",
      },
    },
    deleteAccount: {
      title: "Eliminar cuenta",
      warning:
        "Esta acción borra tu cuenta y todos tus datos de forma permanente. No se puede deshacer.",
      confirmationLabel: 'Escribe "ELIMINAR" para confirmar',
      confirmationWord: "ELIMINAR",
      confirmCta: "Eliminar cuenta",
      cancelCta: "Cancelar",
    },
  },
  onboarding: {
    welcome: {
      title: "¡Hola! Soy tu compañero de entrenamiento",
      subtitle: "Vamos a armar tu plan en menos de 3 minutos.",
      cta: "Empezar",
    },
    goal: {
      title: "¿Cuál es tu objetivo principal?",
      options: {
        LOSE_WEIGHT: "Perder peso",
        ENDURANCE: "Mejorar resistencia",
        MUSCLE_GAIN: "Ganar músculo",
        STRENGTH: "Ganar fuerza",
        GENERAL_HEALTH: "Salud general",
      },
    },
    level: {
      title: "¿Cuál es tu nivel actual?",
      options: {
        BEGINNER: "Principiante",
        INTERMEDIATE: "Intermedio",
        ADVANCED: "Avanzado",
      },
    },
    availability: {
      title: "¿Cuánto tiempo tienes disponible?",
      daysLabel: "Días por semana",
      minutesLabel: "Minutos por sesión",
    },
    equipment: {
      title: "¿Con qué equipo cuentas?",
      options: {
        NONE: "Sin equipo",
        DUMBBELLS: "Mancuernas",
        PULL_UP_BAR: "Barra de dominadas",
        BANDS: "Bandas elásticas",
        KETTLEBELL: "Kettlebell",
        BENCH: "Banco",
        JUMP_ROPE: "Cuerda para saltar",
        GYM: "Gimnasio completo",
      },
    },
    bodyData: {
      title: "Cuéntanos sobre ti",
      birthDateLabel: "Fecha de nacimiento (AAAA-MM-DD)",
      genderLabel: "Género",
      heightLabel: "Estatura (cm)",
      weightLabel: "Peso (kg)",
      genders: {
        MALE: "Masculino",
        FEMALE: "Femenino",
        OTHER: "Otro",
        PREFER_NOT_TO_SAY: "Prefiero no decirlo",
      },
      errors: {
        ageBelowMinimum: "La app requiere una edad mínima de 16 años.",
        invalidHeight: "La estatura debe estar entre 100 y 250 cm.",
        invalidWeight: "El peso debe estar entre 25 y 350 kg.",
        required: "Este campo es obligatorio.",
      },
    },
    fitnessQuestionnaire: {
      title: "Cuestionario de aptitud (PAR-Q)",
      questions: [
        "¿Un médico te ha dicho alguna vez que tienes un problema cardíaco?",
        "¿Sientes dolor en el pecho al realizar actividad física?",
        "¿Has perdido el equilibrio por mareo o has perdido el conocimiento en el último año?",
      ],
      yes: "Sí",
      no: "No",
      positiveWarning:
        "Te recomendamos consultar a un profesional de la salud antes de comenzar. Por tu seguridad, solo te propondremos rutinas de nivel principiante o de salud general.",
      understand: "Entiendo",
    },
    summary: {
      title: "Tu resumen",
      bmiLabel: "IMC",
      bmiCategory: {
        UNDERWEIGHT: "Bajo peso",
        NORMAL: "Normal",
        OVERWEIGHT: "Sobrepeso",
        OBESITY: "Obesidad",
      },
      bmrLabel: "TMB (kcal/día)",
      disclaimer: "Estimación, no es consejo médico.",
      planTitle: "Tu plan semanal propuesto",
      planDayLabel: "Día {{day}}",
      noPlanAvailable: "No pudimos generar una propuesta todavía.",
    },
    accountChoice: {
      title: "Guarda tu progreso",
      createAccountCta: "Crear cuenta",
      continueAsGuestCta: "Continuar como invitado",
      emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña",
      errors: {
        invalidEmail: "Ingresa un correo válido.",
        passwordTooShort: "La contraseña debe tener al menos 8 caracteres.",
      },
    },
    notifications: {
      title: "Mantente motivado",
      subtitle: "Actívalas para recordarte tus sesiones de entrenamiento.",
      allowCta: "Activar notificaciones",
      skipCta: "Ahora no",
    },
  },
  catalog: {
    list: {
      title: "Ejercicios",
      filtersCta: "Filtros",
      resultsAnnouncement: "{{count}} ejercicios encontrados",
      empty: "No hay ejercicios que coincidan con los filtros.",
    },
    filters: {
      title: "Filtrar ejercicios",
      muscleGroupLabel: "Grupo muscular",
      equipmentLabel: "Equipo",
      clearCta: "Limpiar filtros",
      applyCta: "Aplicar",
      allOption: "Todos",
    },
    detail: {
      stepsTitle: "Pasos",
      mistakesTitle: "Errores comunes",
      watchVideoCta: "Ver video",
      difficultyLabel: "Dificultad",
      equipmentLabel: "Equipo",
    },
    proposal: {
      title: "Tu propuesta de plan",
      acceptCta: "Aceptar propuesta",
      dayLabel: "Día {{day}}",
      durationLabel: "{{minutes}} min",
    },
  },
} as const;
