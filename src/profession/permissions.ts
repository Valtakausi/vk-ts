import { Player } from 'org.bukkit.entity';
import { PlayerJoinEvent, PlayerQuitEvent } from 'org.bukkit.event.player';
import { PermissionAttachment } from 'org.bukkit.permissions';

/**
 * Players mapped to Bukkit permission attachments.
 */
const attachments: Map<Player, PermissionAttachment> = new Map();

type PermissionSource = (player: Player) => string[];

/**
 * Functions that provide permissions for getPermissions().
 */
const permissionSources: PermissionSource[] = [];

function getPermissions(player: Player): string[] {
  const permissions = [];
  for (const source of permissionSources) {
    permissions.push(...source(player));
  }
  return [];
}

/**
 * Updates permissions of a player. This should be called after e.g.
 * profession changes.
 * @param player Player.
 */
export function updatePermissions(player: Player): void {
  // Remove old attachment if one exists
  const old = attachments.get(player);
  if (old) {
    player.removeAttachment(old);
  }

  // Create new attachment and add all permissions to it
  const attachment = player.addAttachment(currentPlugin);
  for (const permission of getPermissions(player)) {
    attachment.setPermission(permission, true);
  }
  attachments.set(player, attachment);
}

export function addPermissionSource(source: PermissionSource) {
  permissionSources.push(source);
}

registerEvent(PlayerJoinEvent, (event) => {
  updatePermissions(event.player); // Create permission attachment
});

registerEvent(PlayerQuitEvent, (event) => {
  attachments.delete(event.player); // Remove permission attachment
});
