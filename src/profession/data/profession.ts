import { Table } from 'craftjs-plugin';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { getTable } from '../../common/datas/database';
import { Nation } from '../nation';
import { updatePermissions } from '../permissions';
import {
  PlayerProfession,
  Profession,
  professionId,
  SystemProfession,
} from '../profession';
import { reloadPermissions } from './permission';
import { clearProfession, getPractitioners, getProfessionId } from './player';

/**
 * Serialized profession data.
 */
const professionTable: Table<string, string> = getTable('profession_defs');

/**
 * Professions by their ids.
 */
const professions: Map<string, Profession> = new Map();

/**
 * Profession names to maps of nation ids to professions.
 * Since multiple nations can have different professions with overlapping
 * names, many user-facing commands actually operate on MANY professions.
 */
const professionsByNames: Map<string, Map<string, Profession>> = new Map();

/**
 * Professions by nation ids.
 */
const professionsByNation: Map<string, PlayerProfession[]> = new Map();

/**
 * Loads non-system professions.
 */
function loadProfessions() {
  // Load professions from JSON
  for (const [id, json] of professionTable) {
    professions.set(id, JSON.parse(json));
    updateCaches(id);
  }
}

/**
 * Updates caches after a profession has been modified or loaded.
 * @param id Profession id.
 */
function updateCaches(id: string) {
  const profession = professions.get(id);
  if (!profession) {
    throw new Error(`profession ${id} does not exist`);
  }

  // Cache permissions from features
  reloadPermissions(profession);

  // Update name -> nation, profession lookup table
  const name = profession.name;
  if (!professionsByNames.has(name)) {
    professionsByNames.set(name, new Map());
  }
  const key = profession.type == 'player' ? profession.nation : 'system';
  professionsByNames.get(name)?.set(key, profession);

  if (profession.type == 'player') {
    // Update nation -> profession list lookup table
    let nationProfs = professionsByNation.get(profession.nation) ?? [];
    nationProfs = nationProfs.filter((prof) => prof.name == name); // Clear previous
    nationProfs.push(profession); // Add to end
    nationProfs.sort((a, b) =>
      a.name > b.name ? 1 : b.name > a.name ? -1 : 0,
    ); // Sort by profession name
    professionsByNation.set(profession.nation, nationProfs);
  }
}

/**
 * Gets a profession by its id.
 * @param id Profession id.
 * @returns A profession, or undefined if no profession with given id exists.
 */
export function professionById(id: string): Profession | undefined {
  return professions.get(id);
}

/**
 * Gets all professions that share the given name.
 * @param name Profession name (case doesn't matter).
 * @returns Professions by nation ids, or empty map if no profession with given
 * name exists.
 */
export function professionsByName(name: string): Map<string, Profession> {
  return professionsByNames.get(name.toLowerCase()) ?? new Map();
}

/**
 * Gets a profession by name in given nation.
 * @param nation Nation data.
 * @param name Profession name (case doesn't matter).
 * @returns Profession data, or undefined if the profession does not exist in
 * given nation.
 */
export function professionInNation(
  nation: Nation,
  name: string,
): PlayerProfession | undefined {
  // All professions in nations are player-created
  return professionById(
    nation.id + ':' + name.toLowerCase(),
  ) as PlayerProfession;
}

/**
 * Gets a system profession by name.
 * @param name Profession name (case doesn't matter).
 * @returns A system profession, or undefined if no exists.
 */
export function systemProfession(name: string): SystemProfession | undefined {
  return professionById('system:' + name.toLowerCase()) as SystemProfession;
}

/**
 * Gets ALL professions in a nation.
 * @param nation Nation.
 * @returns Array of professions in undefined order.
 */
export function professionsInNation(nation: Nation): PlayerProfession[] {
  return professionsByNation.get(nation.id) ?? [];
}

/**
 * Adds a new system profession.
 * @param profession Profession data.
 */
export function addSystemProfession(profession: SystemProfession): void {
  const id = professionId(profession);
  professions.set(id, profession);
  updateCaches(id);
}

/**
 * Updates or adds a new player-created profession.
 * @param profession Profession data.
 */
export function updateProfession(profession: PlayerProfession) {
  const id = professionId(profession);
  professions.set(id, profession); // Update in-memory
  professionTable.set(id, JSON.stringify(profession)); // And to database
  updateCaches(id); // Cached things might have changed

  // Refresh permissions of online players with this profession
  for (const player of Bukkit.onlinePlayers) {
    if (getProfession(player) == profession) {
      updatePermissions(player);
    }
  }
}

/**
 * Deletes a player-created profession.
 * @param profession Profession data.
 * @returns The players who had this profession before it was deleted.
 */
export function removeProfession(
  profession: PlayerProfession,
): OfflinePlayer[] {
  const id = professionId(profession);

  // Remove profession from all players
  const players = getPractitioners(profession).map((uuid) =>
    Bukkit.getOfflinePlayer(uuid),
  );
  players.forEach((player) => clearProfession(player));

  // Delete the profession
  professions.delete(id);
  professionTable.delete(id);
  return players;
}

/**
 * Gets profession of a player.
 * @param player Player.
 * @returns A profession, or undefined if they currently lack one.
 */
export function getProfession(player: OfflinePlayer): Profession | undefined {
  const id = getProfessionId(player);
  return id ? professionById(id) : undefined;
}

loadProfessions(); // Load non-system professions from database
