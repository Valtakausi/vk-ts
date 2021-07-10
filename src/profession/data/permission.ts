import { Profession, professionId } from '../profession';

/**
 * Profession ids to cached permissions of them.
 */
const permissionCache: Map<string, string[]> = new Map();

/**
 * Gets permissions granted by a profession.
 * @param profession Profession data.
 * @returns List of permissions granted by the profession.
 */
export function getProfessionPermissions(profession: Profession): string[] {
  return permissionCache.get(professionId(profession)) ?? [];
}

export function reloadPermissions(profession: Profession): void {
  const perms = [];
  for (const feature of profession.roles) {
    perms.push(...feature.permissions);
  }
  permissionCache.set(professionId(profession), perms);
}
