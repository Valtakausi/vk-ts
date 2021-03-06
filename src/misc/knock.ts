import { Location, Material, SoundCategory } from 'org.bukkit';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';

function knockSound(location: Location, sound: string) {
  const pitch = 1.45 + 0.1 * Math.random();
  location.world.playSound(location, sound, SoundCategory.PLAYERS, 1, pitch);
}

registerEvent(PlayerInteractEvent, (event) => {
  if (event.action === Action.LEFT_CLICK_BLOCK) {
    // Only allow knocking with fist and when sneaking
    if (!event.player.isSneaking() || event.item) {
      return;
    }

    // Check block type and play correct knocking sound
    const location = event.clickedBlock?.location;
    if (!location) {
      return; // No block?
    }
    const type = event.clickedBlock?.type;
    switch (type) {
      case Material.ACACIA_DOOR:
      case Material.BIRCH_DOOR:
      case Material.DARK_OAK_DOOR:
      case Material.JUNGLE_DOOR:
      case Material.OAK_DOOR:
      case Material.SPRUCE_DOOR:
      case Material.OAK_TRAPDOOR:
      case Material.ACACIA_TRAPDOOR:
      case Material.BIRCH_TRAPDOOR:
      case Material.DARK_OAK_TRAPDOOR:
      case Material.JUNGLE_TRAPDOOR:
      case Material.SPRUCE_TRAPDOOR:
        knockSound(location, 'entity.zombie.attack_wooden_door');
        break;
      case Material.IRON_DOOR:
      case Material.IRON_BARS:
      case Material.IRON_TRAPDOOR:
        knockSound(location, 'entity.zombie.attack_iron_door');
        break;
    }
  }
});
