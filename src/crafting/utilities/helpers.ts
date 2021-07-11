import { NamespacedKey } from 'org.bukkit';

/**
 * Get a namespaced key for a recipe
 * @param key Key for the recipe. eg "iron_sword"
 * @returns The NamespacedKey
 */
export function getNamespacedKey(key: string) {
  return new NamespacedKey(currentPlugin, key);
}
