import { clickEvent, color, text } from 'craftjs-plugin/chat';
import { Component } from 'net.kyori.adventure.text';
import { Action } from 'net.kyori.adventure.text.event.ClickEvent';
import { Player } from 'org.bukkit.entity';
import { dataHolder } from '../common/datas/holder';
import { sendMessages } from './system';

/**
 * All player-configurable chat options.
 */
const CHAT_OPTIONS: Record<string, ChatOption> = {
  voice: [
    'Puheääni',
    ['default', 'Kyläläinen'],
    ['trader', 'Kauppias'],
    ['pillager', 'Palkkasoturi'],
  ],
  pitch: [
    'Äänenkorkeus',
    ['medium', 'Oletus'],
    ['low', 'Matala'],
    ['high', 'Korkea'],
  ],
  mentionSound: [
    'Ääni mainittaessa',
    ['default', 'Oletus'],
    ['bell', 'Kellopeli'],
    ['silent', 'Ei ääntä'],
  ],
  mentionStyle: [
    'Korosta mainittaessa',
    ['default', 'Koko viesti'],
    ['alternative', 'Lähettäjän nimi'],
    ['none', 'Ei mitään'],
  ],
};
const VISIBLE_OPTIONS: [string, (keyof ChatOptions)[]][] = [
  ['Äänet', ['voice', 'pitch', 'mentionSound']],
  ['Ulkoasu', ['mentionStyle']],
];

/**
 * Chat option name and its choices. See above for examples.
 */
type ChatOption = [string, ...[string, string][]];
export type ChatOptions = {
  [k in keyof typeof CHAT_OPTIONS]: ChatOption;
};

/**
 * Gets the current value of a chat option for given player.
 * @param player Player.
 * @param key Option key.
 */
export function getChatOption(player: Player, key: keyof ChatOptions): string {
  return (
    dataHolder(player).get(`chat.option.${key}`, 'string') ??
    CHAT_OPTIONS[key][1][0] // Id of first option
  );
}

function setOption(player: Player, key: keyof ChatOptions, value: string) {
  for (const choice of CHAT_OPTIONS[key] ?? []) {
    if (choice[0] == value) {
      // Given value is valid for this option
      dataHolder(player).set(`chat.option.${key}`, 'string', value);
    }
  }
}

// Command for changing personal chat settings (excluding channels)
registerCommand(
  'chat',
  (sender, alias, args) => {
    const player = sender as unknown as Player;
    const action = args[0];
    if (action == 'options' || action == 'settings' || action == 'asetukset') {
      renderOptions(player);
    } else if (action == 'setopt' && args.length == 3) {
      setOption(player, args[1], args[2]);
      renderOptions(player);
    }
  },
  {
    permission: 'vk.chat.use',
    executableBy: 'players',
  },
);

/**
 * Renders player's chat options to them.
 * @param player Player to render.
 */
function renderOptions(player: Player) {
  player.sendMessage(
    color('#AAAAAA', text('=========== Chatin asetukset ===========')),
  );
  for (const category of VISIBLE_OPTIONS) {
    player.sendMessage(color('#32A860', text(category[0])));
    for (const key of category[1]) {
      const option = CHAT_OPTIONS[key];
      const selected = getChatOption(player, key);
      renderOption(player, key, option, selected);
    }
  }
}

function renderOption(
  player: Player,
  key: string,
  option: ChatOption,
  selected: string,
) {
  const parts: Component[] = [text(` ${option[0]} `)];
  for (const choice of option.slice(1)) {
    // Render currently selected option differently
    if (choice[0] == selected) {
      parts.push(
        color('#00AA00', text('✔')),
        color('#55FF55', text(`${choice[1]} `)),
      );
    } else {
      parts.push(
        clickEvent(
          Action.RUN_COMMAND,
          `/chat setopt ${key} ${choice[0]}`,
          color('#AAAAAA', text(`${choice[1]} `)),
        ),
      );
    }
  }
  sendMessages(player, ...parts);
}
