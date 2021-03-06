import { Material, Particle, Sound } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Furnace } from 'org.bukkit.block.data.type';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot, PlayerInventory } from 'org.bukkit.inventory';
import { getEmptyBottle } from '../hydration/bottles';

const SAUNA_STONES = Material.COBBLESTONE_SLAB;

registerEvent(PlayerInteractEvent, async (event) => {
  if (event.clickedBlock?.type !== SAUNA_STONES) return;
  if (event.item?.type !== Material.POTION) return;
  const blockBelow = event.clickedBlock.getRelative(BlockFace.DOWN);
  if (blockBelow.type !== Material.FURNACE) return;
  if (!(blockBelow.blockData as Furnace).isLit()) return;
  event.setCancelled(true);

  // Remove water from the item
  const replacement = getEmptyBottle(event.item);
  await wait(1, 'ticks');

  if (event.hand === EquipmentSlot.HAND) {
    (event.player.inventory as PlayerInventory).itemInMainHand = replacement;
  } else {
    (event.player.inventory as PlayerInventory).itemInOffHand = replacement;
  }

  playSaunaEffects(event.clickedBlock);
});

function playSaunaEffects(block: Block) {
  const location = block.location.add(0.5, 0.8, 0.5);
  block.world.playSound(location, Sound.BLOCK_FIRE_EXTINGUISH, 1, 1);
  for (let i = 0; i < 20; i++) {
    block.world.spawnParticle(
      Particle.CLOUD,
      location,
      0,
      Math.random() * 0.1 - 0.05,
      Math.random() * 0.15, // Y
      Math.random() * 0.1 - 0.05,
    );
  }
}
