import { Table } from 'craftjs-plugin';
import { UUID } from 'java.util';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { getTable } from '../../common/datas/database';
import { updatePermissions } from '../permissions';
import { Profession, professionId } from '../profession';
import { getProfession } from './profession';

/**
 * Players mapped to their professions.
 */
const playerProfessions: Table<UUID, string> = getTable('professions');

/**
 * Players mapped to when they were appointed to a profession last time.
 */
const appointTimes: Table<UUID, number> = getTable('profession_appoint_times');

/**
 * Profession ids mapped to lists of UUIDs. ES6 sets don't support Java UUIDS,
 * so we'll have to do without (for now).
 */
const practitioners: Map<string, UUID[]> = new Map();

/**
 * Gets profession id of a player. See getProfession() in profession.ts.
 * @param player Player.
 * @returns Profession id or null.
 */
export function getProfessionId(player: OfflinePlayer): string | null {
  return playerProfessions.get(player.uniqueId);
}

function clearPractitioner(profession: Profession, player: OfflinePlayer) {
  const uuids = getPractitioners(profession);
  practitioners.set(
    professionId(profession),
    uuids.filter((uuid) => uuid != player.uniqueId),
  );
}

/**
 * Sets profession of a player.
 * @param player Player.
 * @param profession Profession to give.
 */
export function setProfession(
  player: OfflinePlayer,
  profession: Profession,
): void {
  const oldProf = getProfession(player);
  playerProfessions.set(player.uniqueId, professionId(profession));
  appointTimes.set(player.uniqueId, Date.now());

  // Update practitioners lookup table
  if (oldProf) {
    clearPractitioner(oldProf, player);
  }
  const uuids = getPractitioners(profession); // Add to new profession's list
  uuids.push(player.uniqueId);
  practitioners.set(professionId(profession), uuids);

  // Ensure that profession permissions work immediately
  const online = player.player;
  if (online) {
    updatePermissions(online);
  }
}

/**
 * Clears profession of a player, if they have one.
 * @param player Player.
 */
export function clearProfession(player: OfflinePlayer): void {
  const oldProf = getProfession(player);
  playerProfessions.delete(player.uniqueId);

  // If the player had profession, update practitioners lookup table
  if (oldProf) {
    clearPractitioner(oldProf, player);
  }

  // Ensure that profession permissions are removed immediately
  const online = player.player;
  if (online) {
    updatePermissions(online);
  }
}

/**
 * Gets when player was last appointed to a profession.
 * @param player Player.
 * @returns Milliseconds since UNIX epoch.
 */
export function getAppointTime(player: OfflinePlayer): number {
  return appointTimes.get(player.uniqueId) ?? 0;
}

export function clearAppointTime(player: OfflinePlayer): void {
  appointTimes.delete(player.uniqueId);
}

/**
 * Gets UUIDs of all players who have the given profession. Note that this does
 * NOT cross nations; use iteratePractitioners() from tools for that.
 * @param profession Profession.
 * @returns List of UUIDs, potentially empty.
 */
export function getPractitioners(profession: Profession): UUID[] {
  return practitioners.get(professionId(profession)) ?? [];
}

/**
 * Filters out professions from players.
 * @param callback Function that is called with UUID of each player with
 * profession and that profession. Players without professions are ignored.
 * If the function returns false, the profession is removed.
 */
export function filterProfessions(
  callback: (uuid: UUID, id: string) => boolean,
): void {
  const removeQueue = [];
  for (const [uuid, id] of playerProfessions) {
    if (!callback(uuid, id)) {
      removeQueue.push(uuid);
    }
  }

  // Clear professions after iteration (probably should not modify table during it)
  for (const uuid of removeQueue) {
    clearProfession(Bukkit.getOfflinePlayer(uuid));
  }
}
