import { translate } from 'craftjs-plugin/chat';
import { GameMode, Material, SoundCategory } from 'org.bukkit';
import { Block } from 'org.bukkit.block';
import { Campfire, Dispenser } from 'org.bukkit.block.data.type';
import { EntityType } from 'org.bukkit.entity';
import {
  Action,
  BlockDispenseEvent,
  BlockPlaceEvent,
} from 'org.bukkit.event.block';
import { ProjectileHitEvent } from 'org.bukkit.event.entity';
import {
  PlayerBucketEmptyEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import { CustomBlock } from '../common/blocks/CustomBlock';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

const CHAIR = Material.SOUL_CAMPFIRE;
const SHOVELS = new Set([
  Material.WOODEN_SHOVEL,
  Material.STONE_SHOVEL,
  Material.IRON_SHOVEL,
  Material.GOLDEN_SHOVEL,
  Material.DIAMOND_SHOVEL,
  Material.NETHERITE_SHOVEL,
]);

export const ChairItem = new CustomItem({
  id: 2,
  type: VkItem.MISC,
  name: translate('vk.chair'),
});

const ChairBlock = new CustomBlock({
  type: CHAIR,
  state: {
    lit: 'false',
    facing: ['north', 'south', 'east', 'west'],
  },
});

/**
 * Use CustomItem (Dark oak stairs) to place the chair block
 */
ChairItem.event(
  PlayerInteractEvent,
  (event) => event.item,
  async (event) => {
    if (event.action !== Action.RIGHT_CLICK_BLOCK) return;
    const block = event.clickedBlock;
    if (!block) return;
    const chairBlock = block.type.isSolid()
      ? block.getRelative(event.blockFace)
      : block;
    if (chairBlock?.type.isSolid()) return;
    if (!event.item) return;
    if (event.isCancelled()) return;

    event.setCancelled(true);

    chairBlock.type = CHAIR;
    const campfire = chairBlock.blockData as Campfire;
    campfire.setLit(false);
    campfire.facing = event.player.facing;
    chairBlock.blockData = campfire;
    if (event.player.gameMode !== GameMode.CREATIVE) event.item.amount--;

    block.world.playSound(
      block.location,
      'minecraft:block.wood.place',
      SoundCategory.BLOCKS,
      1,
      1,
    );
  },
);

/**
 * Prevent the chair from turning into campfire
 */
// Place fire
registerEvent(PlayerInteractEvent, (event) => {
  if (!event.clickedBlock) return;
  if (!isChair(event.clickedBlock)) return;
  if (event.item?.type !== Material.FLINT_AND_STEEL) return;
  event.setCancelled(true);
});
// Dispense fire
registerEvent(BlockDispenseEvent, (event) => {
  if (
    event.item.type !== Material.FLINT_AND_STEEL &&
    event.item.type !== Material.FIRE_CHARGE
  )
    return;
  const dispenser = event.block.blockData as Dispenser;
  const blockAtFront = event.block.getRelative(dispenser.facing);
  if (isChair(blockAtFront)) {
    event.setCancelled(true);
  }
});
// Flaming arrows
registerEvent(ProjectileHitEvent, async (event) => {
  if (event.hitBlock?.type !== CHAIR) return;
  if (event.entity.type !== EntityType.ARROW) return;
  if (!event.entity.fireTicks) return;
  const campfire = event.hitBlock.blockData as Campfire;
  await wait(1, 'millis');
  campfire.setLit(false);
  event.hitBlock.blockData = campfire;
});

/**
 * Prevent the campfire from turning into chair
 */
// Shovel
registerEvent(PlayerInteractEvent, (event) => {
  if (!event.clickedBlock) return;
  if (event.clickedBlock?.type !== Material.SOUL_CAMPFIRE) return;
  if (isChair(event.clickedBlock)) return;
  if (!event.item) return;
  if (!SHOVELS.has(event.item.type)) return;
  extinguishSoulCampfire(event.clickedBlock);
});
// Water bucket
registerEvent(PlayerBucketEmptyEvent, async (event) => {
  if (event.blockClicked?.type !== Material.SOUL_CAMPFIRE) return;
  if (isChair(event.blockClicked)) return;
  await wait(1, 'millis');
  extinguishSoulCampfire(event.blockClicked);
});
// Place in water
registerEvent(BlockPlaceEvent, async (event) => {
  if (event.itemInHand.type !== Material.SOUL_CAMPFIRE) return;
  if (event.blockReplacedState.type !== Material.WATER) return;
  extinguishSoulCampfire(event.blockPlaced);
});
// Dispense water
registerEvent(BlockDispenseEvent, (event) => {
  if (event.item.type !== Material.WATER_BUCKET) return;
  const dispenser = event.block.blockData as Dispenser;
  const blockAtFront = event.block.getRelative(dispenser.facing);
  if (isChair(blockAtFront)) return;
  extinguishSoulCampfire(blockAtFront);
});

/**
 * Replace the defalut drop of the chair block (soul soil)
 */
ChairBlock.onBreak(async (event) => {
  event.block.type = Material.AIR;
  const drop = event.block.world.dropItemNaturally(
    event.block.location.add(0.5, 0, 0.5),
    ChairItem.create({}),
  );

  // Adjust the velocity to be more natural
  const velocity = drop.velocity;
  velocity.y = 0.1;
  drop.velocity = velocity;
  return true;
});

function extinguishSoulCampfire(block: Block) {
  const rotation = (block.blockData as Campfire).facing;
  const waterlogged = (block.blockData as Campfire).isWaterlogged();
  block.type = Material.CAMPFIRE;
  const data = block.blockData as Campfire;
  data.facing = rotation;
  data.setWaterlogged(waterlogged);
  data.setLit(false);
  block.blockData = data;

  block.world.playSound(
    block.location.toCenterLocation(),
    'minecraft:block.fire.extinguish',
    SoundCategory.BLOCKS,
    0.3,
    1,
  );
}

function isChair(block: Block) {
  if (block.type !== CHAIR) return false;
  const data = block.blockData as Campfire;
  if (data.isLit()) return false;
  return true;
}
