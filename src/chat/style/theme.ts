import { NamedTextColor, TextColor } from 'net.kyori.adventure.text.format';
import { Player } from 'org.bukkit.entity';
import { dataHolder } from '../../common/datas/holder';

/**
 * Chat themes contain most colors used by Valtakausi for chat messages.
 * In addition to giving players the choice about color themes, they help
 * ensure consistency of colors used by Valtakausi chat systems.
 *
 * All colors are defined in web-style RGB format, i.e. #RRGGBB.
 * Color strings are then 'compiled' to ChatColors for performance reasons,
 * which is the reason why this is a generic interface.
 */
interface Theme<T> {
  /**
   * Chat channel name color. Not shown in global.
   */
  channel: {
    name: T;
    parentheses: T;
  };

  /**
   * Profession name color. Not shown in whisper channel.
   */
  profession: {
    /**
     * Colors of actual name differ for "normal" players, nation leaders and
     * server admins.
     */
    name: {
      normal: T;
      leader: T;
      admin: T;
    };
    brackets: T;
  };

  /**
   * Player name (and including ':') color.
   */
  playerName: {
    normal: T;

    /**
     * When mentionStyle chat option is 'alternative', sender of messages
     * that mention the receiver is highlighted with this color.
     */
    mention: T;
  };

  /**
   * Base color of the chat message content.
   */
  message: {
    normal: T;

    /**
     * When mentionStyle chat option is 'default', messages that mention the
     * receiver are highlighted with this color.
     */
    mention: T;
  };

  /**
   * System message colors.
   */
  system: {
    /**
     * Status message color. Status messages are sent e.g. when chat channel
     * changes.
     */
    status: T;

    /**
     * Error message color.
     */
    error: T;

    /**
     * Succeess message color.
     */
    success: T;
  };
}

/**
 * Define new chat themes here.
 */
const CHAT_THEMES: Record<string, Theme<string>> = {
  default: {
    channel: { name: '#AAAAAA', parentheses: '#555555' },
    profession: {
      name: { normal: '#FFFFFF', leader: '#FFAA00', admin: '#55FFFF' },
      brackets: '#555555',
    },
    playerName: {
      normal: '#AAAAAA',
      mention: '#FF55FF',
    },
    message: {
      normal: '#FFFFFF',
      mention: '#FFFF55',
    },
    system: {
      status: '#AAAAAA',
      error: '#FF5555',
      success: '#55FF55',
    },
  },
};

/**
 * Recursively parses strings to ChatColors with a bunch of magic tricks.
 * @param record Chat theme(s) with color strings.
 */
function compileThemes(record: Record<string, Record<string, any> | string>) {
  const compiled: Record<string, Record<string, any> | TextColor> = {};
  for (const [key, value] of Object.entries(record)) {
    compiled[key] =
      typeof value == 'string'
        ? TextColor.fromCSSHexString(value) ?? NamedTextColor.WHITE
        : compileThemes(value);
  }
  return compiled;
}

/**
 * Chat themes contain most colors used by Valtakausi for chat messages.
 * In addition to giving players the choice about color themes, they help
 * ensure consistency of colors used by Valtakausi chat systems.
 *
 * This type represents chat themes that have been compiled to use ChatColors
 * instead of hex strings.
 */
export type ChatTheme = Theme<TextColor>;

/**
 * Themes that have been compiled to use ChatColors.
 */
const COMPILED_THEMES = compileThemes(CHAT_THEMES) as Record<string, ChatTheme>;

export function getChatTheme(player: Player): Theme<TextColor> {
  return COMPILED_THEMES[
    dataHolder(player).get('chat.theme', 'string') ?? 'default'
  ];
}

export function defaultChatTheme(): Theme<TextColor> {
  return COMPILED_THEMES.default;
}

// TODO add theme change support
