import type { AppLocale } from "@/lib/i18n/locales";

const ERROR_MESSAGES: Record<AppLocale, Record<string, string>> = {
  fi: {
    FORBIDDEN: "Ei oikeutta tähän toimintoon",
    NOT_FOUND: "Ei löytynyt",
    UNAUTHORIZED: "Kirjautuminen vaaditaan",
    INVALID_INPUT: "Virheelliset tiedot",
  },
  en: {
    FORBIDDEN: "You do not have permission for this action",
    NOT_FOUND: "Not found",
    UNAUTHORIZED: "Sign-in required",
    INVALID_INPUT: "Invalid input",
  },
  fr: {
    FORBIDDEN: "Vous n'avez pas l'autorisation pour cette action",
    NOT_FOUND: "Introuvable",
    UNAUTHORIZED: "Connexion requise",
    INVALID_INPUT: "Données invalides",
  },
  sv: {
    FORBIDDEN: "Du har inte behörighet för den här åtgärden",
    NOT_FOUND: "Hittades inte",
    UNAUTHORIZED: "Inloggning krävs",
    INVALID_INPUT: "Ogiltiga uppgifter",
  },
  de: {
    FORBIDDEN: "Sie haben keine Berechtigung für diese Aktion",
    NOT_FOUND: "Nicht gefunden",
    UNAUTHORIZED: "Anmeldung erforderlich",
    INVALID_INPUT: "Ungültige Eingabe",
  },
  es: {
    FORBIDDEN: "No tienes permiso para esta acción",
    NOT_FOUND: "No encontrado",
    UNAUTHORIZED: "Inicio de sesión requerido",
    INVALID_INPUT: "Datos no válidos",
  },
  ja: {
    FORBIDDEN: "この操作を行う権限がありません",
    NOT_FOUND: "見つかりません",
    UNAUTHORIZED: "ログインが必要です",
    INVALID_INPUT: "入力が無効です",
  },
};

const UNKNOWN_ERROR: Record<AppLocale, string> = {
  fi: "Tuntematon virhe",
  en: "Unknown error",
  fr: "Erreur inconnue",
  sv: "Okänt fel",
  de: "Unbekannter Fehler",
  es: "Error desconocido",
  ja: "不明なエラー",
};

export function mapConvexError(
  code: string | undefined,
  locale: AppLocale,
  fallbackMessage?: string
): string {
  if (code) {
    const mapped = ERROR_MESSAGES[locale][code];
    if (mapped) return mapped;
  }
  if (fallbackMessage) {
    return fallbackMessage;
  }
  return UNKNOWN_ERROR[locale];
}

export function getConvexErrorFromUnknown(
  error: unknown,
  locale: AppLocale
): string {
  const data = (error as { data?: { code?: string; message?: string } })?.data;
  const fallback =
    error instanceof Error ? error.message : undefined;
  return mapConvexError(data?.code, locale, data?.message ?? fallback);
}
