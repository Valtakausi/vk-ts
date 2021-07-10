import { Audience } from 'net.kyori.adventure.audience';
import { Player } from 'org.bukkit.entity';
import { sprintf } from 'sprintf-js';

interface Translations {
  fi_fi: string;
  en_us: string;
  [locale: string]: string;
}
const TRANSLATIONS = new Map<string, Translations>();

type FormatArg = string | number;

/**
 * Default locale, used by e.g. console messages and when unknown locales are
 * encountered.
 */
const DEFAULT_LOCALE = 'en_us';

/**
 * Gets a localized string in audience's language.
 * @param audience Who is receiving the message
 * @param key Translation key for the message
 * @param formatArgs Arguments to be added to the translated string
 * @returns The translated and formatted string.
 */
export function t(audience: Audience, key: string, ...formatArgs: FormatArg[]) {
  const locale =
    audience instanceof Player ? audience.locale.toString() : DEFAULT_LOCALE;
  const msg = translateKey(key, locale);

  return sprintf(msg, ...formatArgs);
}

/**
 * Get a translator function. It can be used as:
 * const tr = getTranslator(player);
 * player.sendMessage(tr("hello_world"));
 * player.sendMessage(tr("hello_player", player.name));
 *
 * @param audience Audience who will be receiving the message
 * @returns Function to call for translation
 */
export function getTranslator(audience: Audience) {
  return (key: string, ...formatArgs: FormatArg[]) =>
    t(audience, key, ...formatArgs);
}

function translateKey(key: string, locale: string) {
  const translations = TRANSLATIONS.get(key);
  if (!translations) {
    log.error(`Missing translation for key "${key}"`);
    return key;
  }

  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

/**
 * Add translation for messages etc. NO ITEM NAMES OR BLOCK NAMES!
 * This function should be called when scripts are loaded
 *
 * @param key Translation key for the message
 * @param translations All translations with where format aruments are %s. For example "Hello %s"
 */
export function addTranslation(key: string, translations: Translations) {
  if (TRANSLATIONS.has(key)) {
    log.error(`Duplicate translation key "${key}"! Translation ignored`);
    return;
  }
  TRANSLATIONS.set(key, translations);
}
