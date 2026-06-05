import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  resolveLocale,
  type AppLocale,
} from "../lib/i18n/locale-codes";

async function loadMessages(locale: AppLocale) {
  return (await import(`../messages/${locale}.json`)).default;
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
