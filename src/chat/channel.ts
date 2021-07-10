import { Bukkit } from 'org.bukkit';
import { Player } from 'org.bukkit.entity';
import {
  PlayerChangedWorldEvent,
  PlayerChatEvent,
} from 'org.bukkit.event.player';
import { dataHolder } from '../common/datas/holder';
import { TUONELA_WORLD } from '../death/tuonela';
import { ignoreChannel, IGNORABLE_CHANNELS, setIgnoreChannel } from './ignore';
import {
  ChatMessage,
  ChatPipeline,
  GLOBAL_PIPELINE,
  LocalPipeline,
  LOCAL_PIPELINE,
  PipelineStage,
} from './pipeline';
import { errorMessage, statusMessage } from './system';
import {
  isChannelAllowed,
  setChannelChatPolicy,
  setWorldChatPolicy,
} from './worlds';

interface ChannelMessages {
  speaking: string;
  join?: string;
  leave?: string;
}

export class ChatChannel {
  /**
   * Internal id of this channel.. Not visible to players.
   */
  readonly id: string;

  /**
   * Player-facing names of this channel. First name is primary and will
   * be used in system messages that mention this channel.
   */
  readonly names: string[];

  /**
   * Messages to use when speaking/joining/leaving etc. this channel.
   */
  readonly messages: ChannelMessages;

  /**
   * Permission needed to listen to or talk in this channel.
   */
  readonly permission?: string;

  /**
   * Pipeline that messages to this channel pass through once.
   */
  readonly global: ChatPipeline;

  /**
   * Pipeline that messages to this channel pass through once per every online
   * player.
   */
  readonly local: LocalPipeline;

  constructor(
    id: string,
    names: string[],
    messages: ChannelMessages,
    permission?: string,
  ) {
    this.id = id;
    this.names = names;
    this.messages = messages;
    this.permission = permission;
    this.global = new ChatPipeline();
    this.local = new LocalPipeline();
  }

  /**
   * Sends a message from player to this channel.
   * @param sender Sender of the message.
   * @param msg The message.
   */
  sendMessage(sender: Player, msg: string) {
    if (this.permission && !sender.hasPermission(this.permission)) {
      errorMessage(sender, 'Sinulla ei ole oikeutta puhua tällä kanavalla');
      return;
    }
    this.handleMessage(new ChatMessage(sender, this, msg));
  }

  /**
   * Passes a message through chat handlers for all stages that it has not
   * already passed through.
   * @param msg Message to handle.
   * @param receiver Receiving player, if the message is already in local stages.
   */
  handleMessage(msg: ChatMessage, receiver?: Player) {
    // Global pipelines are executed at most once per message
    // Discarding (probably) prevents anyone from seeing the message
    if (
      msg.enterStage(PipelineStage.COMMON_GLOBAL) &&
      !GLOBAL_PIPELINE.handleMessage(msg)
    ) {
      return; // Discarded
    }
    if (
      msg.enterStage(PipelineStage.CHANNEL_GLOBAL) &&
      !this.global.handleMessage(msg)
    ) {
      return; // Discarded
    }

    // Local pipelines are executed once per online player
    // Discarding is used to control who can see the message
    if (receiver) {
      this.handleLocal(msg.shallowClone(), receiver);
    } else {
      for (const player of Bukkit.onlinePlayers) {
        this.handleLocal(msg.shallowClone(), player);
      }
    }
  }

  private handleLocal(msg: ChatMessage, player: Player) {
    if (
      msg.enterStage(PipelineStage.COMMON_LOCAL) &&
      !LOCAL_PIPELINE.handleMessage(msg, player)
    ) {
      return; // Discarded
    }
    if (
      msg.enterStage(PipelineStage.CHANNEL_LOCAL) &&
      !this.local.handleMessage(msg, player)
    ) {
      return; // Discarded
    }
  }
}

/**
 * All chat channels players can talk on.
 * Channels that are only used internally don't have to be added here.
 */
export const CHAT_CHANNELS = {
  whisper: new ChatChannel('whisper', ['kuiskaa', 'k', 'whisper', 'w'], {
    speaking: 'Puhut nyt kuiskaus-kanavalla',
  }),
  local: new ChatChannel('local', ['local', 'l', 'paikallinen', 'lähi'], {
    speaking: 'Puhut nyt paikallisella kanavalla',
  }),
  global: new ChatChannel(
    'global',
    ['global', 'g', 'julkinen'],
    {
      speaking: 'Puhut nyt julkisella kanavalla',
      join: 'Liityit julkiselle kanavalle',
      leave: 'Poistuit julkiselta kanavalta',
    },
    'vk.chat.global',
  ),
  tuonela: new ChatChannel('tuonela', ['tuonela'], {
    speaking: '', // No messages for entering this channel
  }),
};

/**
 * Default chat channel for new players.
 */
const DEFAULT_CHANNEL = CHAT_CHANNELS.local;

// Tuonela chat in world of the dead only
setWorldChatPolicy(TUONELA_WORLD, [CHAT_CHANNELS.tuonela]);
setChannelChatPolicy(CHAT_CHANNELS.tuonela, 'deny-implied');

function getChatChannel(id: string | null) {
  return (
    (CHAT_CHANNELS as Record<string, ChatChannel>)[id ?? DEFAULT_CHANNEL.id] ??
    DEFAULT_CHANNEL
  );
}

function createNameTable() {
  const names: Record<string, ChatChannel> = {};
  for (const channel of Object.values(CHAT_CHANNELS)) {
    for (const name of channel.names) {
      names[name] = channel;
    }
  }
  return names;
}

/**
 * Lookup table for player-facing chat channel names.
 * These should be NEVER saved internally.
 */
export const CHANNEL_NAMES: Record<string, ChatChannel> = createNameTable();

/**
 * Gets the channel where messages sent by given player should go by default.
 * The player can usually change this by prefixing their message with channel
 * tags or commands.
 * @param player Sender.
 */
function getDefaultChannel(player: Player): ChatChannel {
  return getChatChannel(dataHolder(player).get('chat.channel', 'string'));
}

/**
 * Sets the channel where given players' messages go by default.
 * @param player Player.
 * @param channel Chat channel.
 */
function setDefaultChannel(player: Player, channel: ChatChannel) {
  dataHolder(player).set('chat.channel', 'string', channel.id);
}

// Redirect incoming chat messages to our chat system
registerEvent(PlayerChatEvent, async (event) => {
  event.setCancelled(true); // Block Vanilla delivery

  // Figure out where the message should go
  const [channel, message] = parseChannelTag(event.message) ?? [
    getDefaultChannel(event.player),
    event.message,
  ];

  // Our chat system handles it from this point
  channel.sendMessage(event.player, message);
});

/**
 * Attempts to parse a channel tag (e.g. @l, @glocal) from start of message.
 * @param msg Chat message.
 * @returns Channel and message without the tag, or undefined if no
 * channel tag is present.
 */
function parseChannelTag(msg: string): [ChatChannel, string] | undefined {
  const trimmed = msg.trimStart();
  if (trimmed.startsWith('@')) {
    const tagEnd = trimmed.indexOf(' ');
    if (tagEnd != -1) {
      // Figure out channel and (obviously) strip out the tag
      return [
        CHANNEL_NAMES[trimmed.substring(1, tagEnd)],
        msg.substring(tagEnd + 1),
      ];
    }
  }
  return undefined;
}

/**
 * Primary names of channels for tab completion.
 */
const PRIMARY_NAMES = Object.values(CHAT_CHANNELS)
  .map((channel) => channel.names[0])
  .sort();

// Command to change and join/leave channels
registerCommand(
  ['ch', 'channel', 'kanava'],
  (sender, _alias, args) => {
    const player = sender as unknown as Player;
    if (args.length == 1) {
      // One argument: change default channel
      changeChannel(player, args[0]);
    } else if (args.length == 2) {
      const [action, name] = args;
      const channel = CHANNEL_NAMES[name];
      if (!channel) {
        errorMessage(sender, `Kanavaa ${channel} ei ole olemassa`);
        return;
      }

      // Join (unignore) or leave (ignore) a channel
      if (action == 'join' || action == 'liity') {
        ignoreChannel(player, channel, false);
      } else if (action == 'leave' || action == 'poistu') {
        ignoreChannel(player, channel, true);
        if (channel == getDefaultChannel(player)) {
          changeChannel(player, DEFAULT_CHANNEL.id); // Cannot speak on ignored channel
        }
      } else {
        return false;
      }
    } else {
      return false; // Show usage
    }
  },
  {
    executableBy: 'players',
    permission: 'vk.chat.use',
    usage: '/ch <kanava> tai /ch <liity|poistu> <kanava>',
    completer: (_sender, _alias, args) => {
      if (args.length == 1) {
        return [...PRIMARY_NAMES, 'join', 'leave'];
      } else if (args.length == 2) {
        return [...IGNORABLE_CHANNELS];
      } else {
        return [];
      }
    },
  },
);

function changeChannel(player: Player, name: string) {
  const channel = CHANNEL_NAMES[name];
  if (!channel) {
    errorMessage(player, `Kanavaa ${name} ei ole olemassa`);
    return;
  }
  if (channel.permission && !player.hasPermission(channel.permission)) {
    errorMessage(player, `Sinulla ei ole oikeutta puhua kanavalla ${name}`);
    return;
  }
  if (!isChannelAllowed(channel, player.world)) {
    errorMessage(player, `Et kuule kanavaa ${name} täällä`);
    return;
  }
  setIgnoreChannel(player, channel, false); // Automatically join ignored channel
  setDefaultChannel(player, channel);
  statusMessage(
    player,
    channel.messages.speaking ?? `Puhut nyt kanavalla ${channel.names[0]}`,
  );
}

// Generate commands for all channel aliases
for (const [name, channel] of Object.entries(CHANNEL_NAMES)) {
  registerCommand(
    name,
    (sender, _alias, args) => {
      const player = sender as unknown as Player;
      if (args.length == 0) {
        // Change default channel
        changeChannel(player, channel.names[0]);
      } else {
        // Message was provided after command name
        channel.sendMessage(player, args.join(' '));
      }
    },
    {
      executableBy: 'players',
      permission: 'vk.chat.use',
    },
  );
}

// Move players between channels when they change between worlds
registerEvent(PlayerChangedWorldEvent, (event) => {
  const world = event.player.world; // To world
  if (!isChannelAllowed(getDefaultChannel(event.player), world)) {
    // Default channel?
    if (isChannelAllowed(DEFAULT_CHANNEL, world)) {
      changeChannel(event.player, DEFAULT_CHANNEL.id);
      return;
    }

    // Try to find a channel that is allowed
    // Multiple choices? Choose randomly
    for (const channel of Object.values(CHAT_CHANNELS)) {
      if (isChannelAllowed(channel, world)) {
        changeChannel(event.player, channel.id);
        return;
      }
    }

    // If all else fails, there is VOID (and don't message about it)
    setDefaultChannel(event.player, VOID_CHANNEL);
  }
});

/**
 * Channel that does not deliver messages to anyone.
 */
const VOID_CHANNEL = new ChatChannel('internal_void', ['void'], {
  speaking: '',
});
VOID_CHANNEL.global.addHandler('discardAll', 0, (msg) => (msg.discard = true));
