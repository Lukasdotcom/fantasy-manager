/**
 * Used to grab the correct locales data.
 * @param {string | undefined} locale - The locale
 * @return {Promise<Record<string, string> | undefined>} The locale data.
 */
export default async function getLocales(
  locale: string | undefined
): Promise<Record<string, string> | null> {
  if (locale === "en") {
    return null;
  }
  return JSON.parse(JSON.stringify(await import(`./${locale}.json`)));
}
