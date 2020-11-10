import { Door, Gate } from 'org.bukkit.block.data.type';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { Saw } from './saw';

registerEvent(PlayerInteractEvent, (event) => {
  const block = event.clickedBlock;
  if (!block) return;
  if (event.player.isSneaking()) return;

  // Doors
  if (block.blockData instanceof Door) {
    // Custom sound names with vanilla sound files (sounds.json)
    const sound = (block.blockData as Door).isOpen()
      ? 'non-silent.wooden_door.close'
      : 'non-silent.wooden_door.open';
    block.world.playSound(block.location, sound, 1, 1);
  }

  // Fence gates
  else if (block.blockData instanceof Gate) {
    if (Saw.check(block)) return;
    // Custom sound names with vanilla sound files (sounds.json)
    const sound = (block.blockData as Gate).isOpen()
      ? 'non-silent.fence_gate.close'
      : 'non-silent.fence_gate.open';
    block.world.playSound(block.location, sound, 1, 1);
  }
});