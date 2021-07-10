import { addPermissionSource } from '../permissions';
import { getProfessionPermissions } from './permission';
import { getProfession } from './profession';

require('./permission');
require('./player');
require('./profession');

// Plug in player profession to permission system
addPermissionSource((player) => {
  const profession = getProfession(player);
  if (profession) {
    return getProfessionPermissions(profession);
  }
  return [];
});
