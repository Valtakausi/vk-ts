import { Material } from 'org.bukkit';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { BlockBreakEvent, Action } from 'org.bukkit.event.block';

const DIRT_LIKE = new Set([
  Material.DIRT.ordinal(),
  Material.GRASS_BLOCK.ordinal(),
  Material.GRASS_PATH.ordinal(),
]);

function isHoe(type: Material | undefined) {
  return type === Material.IRON_HOE || type === Material.DIAMOND_HOE;
}

function isAxe(type: Material | undefined) {
  return type === Material.IRON_AXE || type === Material.STONE_AXE;
}

function isLog(type: Material) {
  const name = type.toString();
  return name.endsWith('_LOG') || name.endsWith('_WOOD');
}

// Prevent farmland formation
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  const type = event.item?.type;
  if (!isHoe(type)) return;

  const block = event.clickedBlock;
  if (!block) return;
  if (!DIRT_LIKE.has(block.type.ordinal())) return;

  if (!event.item?.itemMeta.hasCustomModelData()) return;
  event.setCancelled(true);
});

// Prevent breaking blocks with a hoe
registerEvent(BlockBreakEvent, (event) => {
  const item = event.player.itemInHand;
  if (!isHoe(item.type)) return;

  if (!item.itemMeta.hasCustomModelData()) return;

  // TODO: Make better check when needed or if more custom items need to be excluded
  if (item.itemMeta.customModelData <= 2) return; // Scythe and sickle

  event.setCancelled(true);
});

// Prevent stripping of logs
registerEvent(PlayerInteractEvent, (event) => {
  if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
  const type = event.item?.type;
  if (!isAxe(type)) return;

  const block = event.clickedBlock;
  if (!block) return;
  if (!isLog(block.type)) return;

  event.setCancelled(true);
});
