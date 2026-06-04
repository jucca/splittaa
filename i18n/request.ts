import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  resolveLocale,
  type AppLocale,
} from "../lib/i18n/locale-codes";

async function loadMessages(locale: AppLocale) {
  switch (locale) {
    case "fi":
      return (await import("../messages/fi.json")).default;
    case "en":
      return (await import("../messages/en.json")).default;
    default: {
      const _exhaustive: never = locale;
      return _exhaustive;
    }
  }
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: AppLocale = resolveLocale(cookieLocale);

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
