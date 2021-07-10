import { Profession } from './profession';
import { professionById, professionsByName } from './data/profession';
import { UUID } from 'java.util';
import { getPractitioners } from './data/player';

export function isSubordinateProfession(
  leader: Profession,
  subordinate: Profession,
): boolean {
  if (leader.subordinates.includes(subordinate.name)) {
    return true; // Direct subordinate
  } else if (leader.subordinates.length == 0) {
    return false; // Definitely not subordinate of this
  }

  // Not direct subordinate, but could be indirect one
  for (const id of leader.subordinates) {
    const prof = professionById(id);
    if (prof && isSubordinateProfession(prof, subordinate)) {
      return true; // Indirect subordinate
    }
  }
  return false; // Not subordinate
}

export function iteratePractitioners(
  name: string,
  callback: (profession: Profession, uuid: UUID) => void,
) {
  const nationsMap = professionsByName(name);
  for (const profession of nationsMap.values()) {
    for (const uuid of getPractitioners(profession)) {
      callback(profession, uuid);
    }
  }
}
