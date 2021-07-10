import { color, component, text } from 'craftjs-plugin/chat';
import { Audience } from 'net.kyori.adventure.audience';
import { Component } from 'net.kyori.adventure.text';
import { Player } from 'org.bukkit.entity';
import { t } from '../common/localization/localization';
import { defaultChatTheme, getChatTheme } from './style/theme';

export function sendMessages(
  target: Audience,
  ...messages: (Component | string)[]
) {
  // Merge components to one, then send it
  // This imitates how old Bungeecord sendMessages() used to work
  target.sendMessage(
    component(
      ...messages.map((msg) => (typeof msg == 'string' ? text(msg) : msg)),
    ),
  );
}

export function statusMessage(
  receiver: Audience,
  msg: string,
  ...formatArgs: string[]
) {
  if (msg != '') {
    const translated = t(receiver, msg, ...formatArgs);
    const theme =
      receiver instanceof Player ? getChatTheme(receiver) : defaultChatTheme();
    receiver.sendMessage(color(theme.system.status, translated));
  }
}

export function errorMessage(
  receiver: Audience,
  msg: string,
  ...formatArgs: string[]
) {
  if (msg != '') {
    const translated = t(receiver, msg, ...formatArgs);
    const theme =
      receiver instanceof Player ? getChatTheme(receiver) : defaultChatTheme();
    receiver.sendMessage(color(theme.system.error, translated));
  }
}

export function successMessage(
  receiver: Audience,
  msg: string,
  ...formatArgs: string[]
) {
  if (msg != '') {
    const translated = t(receiver, msg, ...formatArgs);
    const theme =
      receiver instanceof Player ? getChatTheme(receiver) : defaultChatTheme();
    receiver.sendMessage(color(theme.system.success, translated));
  }
}
