import { Material, Bukkit } from 'org.bukkit';
import { Levelled, Waterlogged } from 'org.bukkit.block.data';
import { Player, Entity } from 'org.bukkit.entity';
import { Action, CauldronLevelChangeEvent } from 'org.bukkit.event.block';
import {
  PlayerInteractEvent,
  PlayerItemConsumeEvent,
} from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { PotionMeta } from 'org.bukkit.inventory.meta';
import { isRightClick } from '../common/helpers/click';
import { CustomItem } from '../common/items/CustomItem';
import {
  canFillCauldron,
  getPotionData,
  getWaterQuality,
  WaterQuality,
} from './water-quality';
import { ChangeReason } from 'org.bukkit.event.block.CauldronLevelChangeEvent';
import { Block } from 'org.bukkit.block';
import { translate } from 'craftjs-plugin/chat';

export const WineGlass = new CustomItem({
  name: translate('vk.wine_glass'),
  id: 1,
  type: Material.POTION,
});
export const WineGlassEmpty = new CustomItem({
  name: translate('vk.wine_glass'),
  id: 1,
  type: Material.GLASS_BOTTLE,
});

export const Mug = new CustomItem({
  name: translate('vk.mug'),
  id: 2,
  type: Material.POTION,
});
export const MugEmpty = new CustomItem({
  name: translate('vk.mug'),
  id: 2,
  type: Material.GLASS_BOTTLE,
});

export const Scoop = new CustomItem({
  name: translate('vk.scoop'),
  id: 3,
  type: Material.POTION,
});
export const ScoopEmpty = new CustomItem({
  name: translate('vk.scoop'),
  id: 3,
  type: Material.GLASS_BOTTLE,
});

const BOTTLES = new Map<number, { full: ItemStack; empty: ItemStack }>([
  [1, { full: WineGlass.create({}), empty: WineGlassEmpty.create({}) }],
  [2, { full: Mug.create({}), empty: MugEmpty.create({}) }],
  [3, { full: Scoop.create({}), empty: ScoopEmpty.create({}) }],
]);

export function canBreak(item: ItemStack): boolean {
  const unbreakableCustomBottles = [Mug, MugEmpty, Scoop, ScoopEmpty];
  for (const bottle of unbreakableCustomBottles) {
    if (bottle.check(item)) return false;
  }
  return true;
}

export function getFullBottle(item: ItemStack) {
  const modelId = item?.itemMeta.hasCustomModelData()
    ? item?.itemMeta.customModelData
    : 0;

  return BOTTLES.get(modelId)?.full || new ItemStack(Material.POTION);
}

export function getEmptyBottle(item?: ItemStack) {
  const modelId = item?.itemMeta.hasCustomModelData()
    ? item?.itemMeta.customModelData
    : 0;

  return BOTTLES.get(modelId)?.empty || new ItemStack(Material.GLASS_BOTTLE);
}

/*
Replace default bottle filling functionality
and re-implement it so we can define the itemMeta of the bottle.
Needed for custom bottle models (wine glass, mug etc.)
because those items would otherwise become normal bottles without custom model data
*/

// Fill a bottle
registerEvent(PlayerInteractEvent, async (event) => {
  if (event.item?.type !== Material.GLASS_BOTTLE) return;
  if (!isRightClick(event.action)) return;

  event.setCancelled(true);
  let bottleCanFill = false;
  let waterQuality: WaterQuality | undefined = undefined;

  const clickedBlock = event.clickedBlock;
  if (clickedBlock) {
    const blockData = clickedBlock.blockData;
    // Check if the block can be used to fill a bottle
    if (blockData instanceof Waterlogged) {
      bottleCanFill = blockData.isWaterlogged();
    }
    // Check if cauldron
    else if (blockData instanceof Levelled) {
      // TODO 1.17: Check if the cauldroin contains water instead of lava :)
      if (blockData.level > 0) {
        bottleCanFill = true;

        // Call cauldron level change event because the level changes
        if (
          !checkCauldronEvent(clickedBlock, event.player, blockData.level, -1)
        )
          return;

        // Decrease the level of the cauldron
        blockData.level--;
        clickedBlock.blockData = blockData;

        // Cauldrons provide normal water
        waterQuality = 'NORMAL';
      }
    }
    // If the block on the clicked side was water
    const blockNextTo = clickedBlock.getRelative(event.blockFace);
    if (blockNextTo.type === Material.WATER) {
      bottleCanFill = true;
    }
  } else {
    // Check if players line of sight contains water
    const lineOfSight = event.player.getLineOfSight(null, 4);
    if (!lineOfSight) return;
    for (const block of lineOfSight) {
      if (block.type === Material.WATER) {
        bottleCanFill = true;
      }
    }
  }

  if (bottleCanFill) {
    // Get corresponding customitem
    const potion = getFullBottle(event.item);
    const meta = potion.itemMeta;
    meta.displayName = '';

    // Clear weird data from the potion (it would be pink)
    if (!waterQuality) {
      waterQuality = getWaterQuality(event);
    }

    const potionData = getPotionData(waterQuality);
    (meta as PotionMeta).basePotionData = potionData;
    potion.itemMeta = meta;

    event.item.amount--;
    giveItem(event.player, potion, event.hand);
  }
});

// Fill a cauldron
registerEvent(PlayerInteractEvent, async (event) => {
  if (event.item?.type !== Material.POTION) return;

  const a = event.action;
  if (a !== Action.RIGHT_CLICK_AIR && a !== Action.RIGHT_CLICK_BLOCK) return;

  const block = event.clickedBlock;
  if (block?.type !== Material.CAULDRON) return;
  const levelled = block.blockData as Levelled;
  if (levelled.level === levelled.maximumLevel) return;

  event.setCancelled(true);

  if (!canFillCauldron(event.item)) {
    event.player.sendActionBar(
      'Voit täyttää padan vain tavallisella tai kirkkaalla vedellä',
    );
    return;
  }

  // Call cauldron level change event because the level changes
  if (!checkCauldronEvent(block, event.player, levelled.level, 1)) return;

  // Fill the cauldron
  levelled.level++;
  block.blockData = levelled;

  // Player is filling a cauldron with custom bottle
  const bottle = getEmptyBottle(event.item);

  // Wait 1 millis so we dont fire bottle fill event
  await wait(1, 'millis');

  const inventory = event.player.inventory as PlayerInventory;
  if (event.hand === EquipmentSlot.HAND) {
    inventory.itemInMainHand = bottle;
  } else {
    inventory.itemInOffHand = bottle;
  }
});

// Drink a bottle
registerEvent(PlayerItemConsumeEvent, (event) => {
  if (event.item.type !== Material.POTION) return;
  if (!event.item.itemMeta.hasCustomModelData()) return; // Default bottle

  const replacement = getEmptyBottle(event.item);

  event.replacement = replacement;
});

function giveItem(player: Player, item: ItemStack, hand: EquipmentSlot | null) {
  if (item.type === Material.AIR) return;
  // Prioritice players current hand
  // OffHand
  if (hand === EquipmentSlot.OFF_HAND) {
    if ((player.inventory as PlayerInventory).itemInOffHand.type.isEmpty()) {
      (player.inventory as PlayerInventory).itemInOffHand = item;
      return;
    }
  }
  // MainHand
  else {
    if ((player.inventory as PlayerInventory).itemInMainHand.type.isEmpty()) {
      (player.inventory as PlayerInventory).itemInMainHand = item;
      return;
    }
  }
  const leftOver = player.inventory.addItem(item);
  if (leftOver.size()) {
    player.world.dropItem(player.location, leftOver.get(0));
  }
}

/**
 * Call CauldonLevelChangeEvent
 * @param block The cauldron
 * @param player Who clicked
 * @param oldLevel Level of the cauldron
 * @param change How much the level did change? -1 or +1
 */
export function checkCauldronEvent(
  block: Block,
  player: Player,
  oldLevel: number,
  change: -1 | 1,
) {
  const reason =
    change === 1 ? ChangeReason.BOTTLE_EMPTY : ChangeReason.BOTTLE_FILL;

  const cauldronEvent = new CauldronLevelChangeEvent(
    block,
    (player as unknown) as Entity,
    reason,
    oldLevel,
    oldLevel + change,
  );
  Bukkit.server.pluginManager.callEvent(cauldronEvent);
  return !cauldronEvent.isCancelled();
}
