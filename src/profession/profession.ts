import { text } from 'craftjs-plugin/chat';
import { Component } from 'net.kyori.adventure.text';

/**
 * Profession details.
 */
interface BaseProfession {
  /**
   * Type of profession.
   */
  type: string;

  /**
   * Display name of the profession. This is always in lower case.
   */
  name: string;

  /**
   * Profession description, shown on mouse hover in chat.
   */
  description: string;

  /**
   * Direct subordinates of this profession.
   */
  subordinates: string[];

  /**
   * Profession features that grant it permissions.
   */
  roles: ProfessionRole[];
}

/**
 * System professions are defined in code, belong to no nation and cannot be
 * changed (even by admins) with in-game commands.
 */
export interface SystemProfession extends BaseProfession {
  type: 'system';
}

/**
 * Player-created professions are associated with nations and managed by
 * rulers or admins.
 */
export interface PlayerProfession extends BaseProfession {
  type: 'player';

  /**
   * The nation this profession is associated with.
   */
  nation: string;

  /**
   * UUID of player who created this profession.
   */
  creator: string;
}

export type Profession = SystemProfession | PlayerProfession;

/**
 * Special profession roles that grants permissions.
 */
interface ProfessionRole {
  /**
   * Who can add this feature to a profession.
   */
  availability: 'ruler' | 'admin';

  /**
   * Permissions this feature grants to professions.
   */
  permissions: string[];
}

/**
 * Creates an unique id for a profession.
 * @param profession Profession data.
 * @returns Profession id.
 */
export function professionId(profession: Profession) {
  if (profession.type == 'system') {
    return 'system:' + profession.name;
  } else {
    return `${profession.nation}:${profession.name}`;
  }
}

export function formatProfession(
  profession: Profession,
  capitalize = false,
  tooltip = false,
): Component {
  return text(profession.name); // TODO
}
