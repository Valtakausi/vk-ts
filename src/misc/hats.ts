import { translate } from 'craftjs-plugin/chat';
import { GameMode, Material, Sound, SoundCategory } from 'org.bukkit';
import { ArmorStand, EntityType, Player } from 'org.bukkit.entity';
import { BlockDispenseArmorEvent } from 'org.bukkit.event.block';
import {
  InventoryAction,
  InventoryClickEvent,
  InventoryDragEvent,
  InventoryType,
} from 'org.bukkit.event.inventory';
import {
  PlayerInteractAtEntityEvent,
  PlayerInteractEvent,
} from 'org.bukkit.event.player';
import {
  EquipmentSlot,
  ItemStack,
  PlayerInventory,
} from 'org.bukkit.inventory';
import { isRightClick } from '../common/helpers/click';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';
import { equipPipe, Pipe } from './pipe';

export const HAT_MATERIAL = VkItem.HAT;
const HELMET_SLOT = 39;
const BOOTS_SLOT = 36;

function isHat(item: ItemStack | null) {
  if (item?.type !== HAT_MATERIAL) return false;
  if (item.itemMeta.hasCustomModelData()) return true;
  return false; // The item was not a custom item
}

// Prevent dispensing a hat to boots-slot
registerEvent(BlockDispenseArmorEvent, (event) => {
  if (!isHat(event.item)) return;
  event.setCancelled(true);
});

// Equip hat with right click
registerEvent(PlayerInteractEvent, (event) => {
  if (!event.item) return;
  if (!isHat(event.item)) return;
  if (!isRightClick(event.action)) return;
  event.setCancelled(true);

  const inventory = event.player.inventory as PlayerInventory;
  if (inventory.helmet) return;

  // Special case for the pipe. (Player might be filling the pipe)
  if (Pipe.check(event.item)) {
    if (!equipPipe(event.player)) {
      return;
    }
  }

  inventory.helmet = event.item;
  event.item.amount = 0;
  playEquipSound(event.player);
});

// Shift click a hat to equip
registerEvent(InventoryClickEvent, (event) => {
  if (!event.currentItem) return;
  if (!isHat(event.currentItem)) return;
  if (event.slot === HELMET_SLOT) return;
  if (event.action !== InventoryAction.MOVE_TO_OTHER_INVENTORY) return;
  if (event.inventory.type !== InventoryType.CRAFTING) return;
  const inventory = event.whoClicked.inventory as PlayerInventory;
  event.setCancelled(true);
  if (inventory.helmet) return;
  inventory.helmet = event.currentItem;
  event.currentItem.amount = 0;
});

// Drag a hat to helmet slot
registerEvent(InventoryClickEvent, (event) => {
  if (!event.cursor) return;
  if (!isHat(event.cursor)) return;
  if (event.slot === BOOTS_SLOT) {
    // Player tried to place hat to boots slot
    event.setCancelled(true);
    return;
  }
  if (event.slot !== HELMET_SLOT) return;
  const inventory = event.whoClicked.inventory as PlayerInventory;
  if (event.action === InventoryAction.NOTHING) {
    // Swap hats by clicking on the slot
    const hat = event.cursor.clone();
    event.cursor = inventory.helmet;
    inventory.helmet = hat;
    event.setCancelled(true);
    return;
  }
  if (event.action !== InventoryAction.PLACE_ALL) return;
  inventory.helmet = event.cursor;
  event.cursor.amount = 0;
  event.setCancelled(true);
});

// Equip a hat for armorstand
registerEvent(PlayerInteractAtEntityEvent, (event) => {
  if (event.hand !== EquipmentSlot.HAND) return;
  const entity = event.rightClicked;
  if (entity.type !== EntityType.ARMOR_STAND) return;
  const inventory = event.player.inventory as PlayerInventory;
  if (!isHat(inventory.itemInMainHand)) return;
  const armorstand = entity as ArmorStand;
  if (armorstand.isInvisible()) return;
  const itemInHand = inventory.itemInMainHand.clone() as ItemStack;
  inventory.itemInMainHand = armorstand.helmet;
  armorstand.helmet = itemInHand;
  event.setCancelled(true);
  playEquipSound(event.player);

  // Creative players do not lose item when placing it on armorstand
  if (event.player.gameMode === GameMode.CREATIVE) {
    if (inventory.itemInMainHand.type === Material.AIR) {
      inventory.itemInMainHand = armorstand.helmet;
    }
  }
});

function playEquipSound(player: Player) {
  player.world.playSound(
    player.location,
    Sound.ITEM_ARMOR_EQUIP_LEATHER,
    SoundCategory.PLAYERS,
    1,
    1,
  );
}

// Prevent hat equipping with hotbar buttons
registerEvent(InventoryClickEvent, (event) => {
  if (event.inventory.type !== InventoryType.CRAFTING) return;
  if (event.hotbarButton !== -1) {
    if (event.slot !== BOOTS_SLOT) return;
    const swapped = event.whoClicked.inventory.getItem(event.hotbarButton);
    if (isHat(swapped)) {
      event.setCancelled(true);
      return;
    }
  }
});

// Drag a hat to boots slot
registerEvent(InventoryDragEvent, (event) => {
  if (event.inventory.type !== InventoryType.CRAFTING) return;
  if (!event.inventorySlots.contains(BOOTS_SLOT)) return;
  if (isHat(event.oldCursor)) event.setCancelled(true);
});

/**
 * All Hat Customitems
 */

export const Tricorne = new CustomItem({
  type: VkItem.HAT,
  id: 1,
  name: translate('vk.tricorne'),
});

export const GoldenCrown = new CustomItem({
  type: VkItem.HAT,
  id: 2,
  name: translate('vk.golden_crown'),
});

export const Topper = new CustomItem({
  type: VkItem.HAT,
  id: 3,
  name: translate('vk.topper'),
});

export const SteamPunkTopper = new CustomItem({
  type: VkItem.HAT,
  id: 4,
  name: translate('vk.steam_punk_topper'),
});

export const HayHat = new CustomItem({
  type: VkItem.HAT,
  id: 5,
  name: translate('vk.hay_hat'),
});

export const SmallCowboyHay = new CustomItem({
  type: VkItem.HAT,
  id: 6,
  name: translate('vk.small_cowboy_hat'),
});

export const WizardHat = new CustomItem({
  type: VkItem.HAT,
  id: 7,
  name: translate('vk.wizard_hat'),
});

export const Mortarboard = new CustomItem({
  type: VkItem.HAT,
  id: 8,
  name: translate('vk.mortarboard'),
});

export const Beanie = new CustomItem({
  type: VkItem.HAT,
  id: 9,
  name: translate('vk.beanie'),
});

export const FlatCap = new CustomItem({
  type: VkItem.HAT,
  id: 10,
  name: translate('vk.flat_cap'),
});

export const Bowler = new CustomItem({
  type: VkItem.HAT,
  id: 11,
  name: translate('vk.bowler'),
});

export const Campero = new CustomItem({
  type: VkItem.HAT,
  id: 12,
  name: translate('vk.campero'),
});

export const Boater = new CustomItem({
  type: VkItem.HAT,
  id: 13,
  name: translate('vk.boater'),
});

export const ShephedHat = new CustomItem({
  type: VkItem.HAT,
  id: 14,
  name: translate('vk.shepher_hat'),
});

export const FurryCap = new CustomItem({
  type: VkItem.HAT,
  id: 15,
  name: translate('vk.furry_cap'),
});

export const HornHelmet = new CustomItem({
  type: VkItem.HAT,
  id: 16,
  name: translate('vk.horn_helmet'),
});

export const TyroleanHat = new CustomItem({
  type: VkItem.HAT,
  id: 17,
  name: translate('vk.tyrolean_hat'),
});

export const BearHat = new CustomItem({
  type: VkItem.HAT,
  id: 18,
  name: translate('vk.bear_hat'),
});

export const FeatherHat = new CustomItem({
  type: VkItem.HAT,
  id: 19,
  name: translate('vk.feather_hat'),
});

export const Beret = new CustomItem({
  type: VkItem.HAT,
  id: 20,
  name: translate('vk.beret'),
});

export const CowboyHat = new CustomItem({
  type: VkItem.HAT,
  id: 21,
  name: translate('vk.cowboy_hat'),
});

export const LargeCowboyHat = new CustomItem({
  type: VkItem.HAT,
  id: 22,
  name: translate('vk.large_cowboy_hat'),
});

export const FlowerCrown = new CustomItem({
  type: VkItem.HAT,
  id: 23,
  name: translate('vk.flower_crown'),
});

// Pipe is declared in pipe.ts
// id: 24

export const CorinthianHelmet = new CustomItem({
  type: VkItem.HAT,
  id: 25,
  name: translate('vk.corinthian_helmet'),
});

export const NormanHelmet = new CustomItem({
  type: VkItem.HAT,
  id: 26,
  name: translate('vk.norman_helmet'),
});

export const WolfHat = new CustomItem({
  type: VkItem.HAT,
  id: 27,
  name: translate('vk.wolf_hat'),
});

export const BlackWolfHat = new CustomItem({
  type: VkItem.HAT,
  id: 28,
  name: translate('vk.black_wolf_hat'),
});

export const WhiteWolfHat = new CustomItem({
  type: VkItem.HAT,
  id: 29,
  name: translate('vk.white_wolf_hat'),
});

export const FoxHat = new CustomItem({
  type: VkItem.HAT,
  id: 30,
  name: translate('vk.fox_hat'),
});

export const FeatherHeadband = new CustomItem({
  type: VkItem.HAT,
  id: 31,
  name: translate('vk.feather_headband'),
});

export const PlagueMasg = new CustomItem({
  type: VkItem.HAT,
  id: 32,
  name: translate('vk.plague_mask'),
});

export const BlackstoneMask = new CustomItem({
  type: VkItem.HAT,
  id: 33,
  name: translate('vk.blackstone_mask'),
});

export const SkullMask = new CustomItem({
  type: VkItem.HAT,
  id: 34,
  name: translate('vk.skull_mask'),
});

export const CageMask = new CustomItem({
  type: VkItem.HAT,
  id: 35,
  name: translate('vk.cage_mask'),
});

export const Monocle = new CustomItem({
  type: VkItem.HAT,
  id: 36,
  name: translate('vk.monocle'),
});

export const MonocleLowSide = new CustomItem({
  type: VkItem.HAT,
  id: 37,
  name: translate('vk.monocle'),
});

export const MonocleUpperSide = new CustomItem({
  type: VkItem.HAT,
  id: 38,
  name: translate('vk.monocle'),
});

export const MonocleUpper = new CustomItem({
  type: VkItem.HAT,
  id: 39,
  name: translate('vk.monocle'),
});

export const HorseHeadWhite = new CustomItem({
  type: VkItem.HAT,
  id: 40,
  name: translate('vk.horse_head'),
});

export const HorseHeadGray = new CustomItem({
  type: VkItem.HAT,
  id: 41,
  name: translate('vk.horse_head'),
});

export const HorseHeadBrown = new CustomItem({
  type: VkItem.HAT,
  id: 42,
  name: translate('vk.horse_head'),
});

export const HorseHeadBlack = new CustomItem({
  type: VkItem.HAT,
  id: 43,
  name: translate('vk.horse_head'),
});

export const HorseHeadChestnut = new CustomItem({
  type: VkItem.HAT,
  id: 44,
  name: translate('vk.horse_head'),
});

export const HorseHeadCreamy = new CustomItem({
  type: VkItem.HAT,
  id: 45,
  name: translate('vk.horse_head'),
});

export const HorseHeadDarkbrown = new CustomItem({
  type: VkItem.HAT,
  id: 46,
  name: translate('vk.horse_head'),
});

export const SkeletonHorseHead = new CustomItem({
  type: VkItem.HAT,
  id: 47,
  name: translate('vk.skeleton_horse_head'),
});

export const ZombieHorseHead = new CustomItem({
  type: VkItem.HAT,
  id: 48,
  name: translate('vk.zombie_horse_head'),
});

export const MuleHead = new CustomItem({
  type: VkItem.HAT,
  id: 49,
  name: translate('vk.mule_head'),
});

export const DonkeyHead = new CustomItem({
  type: VkItem.HAT,
  id: 50,
  name: translate('vk.donkey_head'),
});

export const CowHead = new CustomItem({
  type: VkItem.HAT,
  id: 51,
  name: translate('vk.cow_head'),
});

export const PigHead = new CustomItem({
  type: VkItem.HAT,
  id: 52,
  name: translate('vk.pig_head'),
});

export const SheepHead = new CustomItem({
  type: VkItem.HAT,
  id: 53,
  name: translate('vk.sheep_head'),
});

export const ChickenHead = new CustomItem({
  type: VkItem.HAT,
  id: 54,
  name: translate('vk.chicken_head'),
});

export const CardHat = new CustomItem({
  type: VkItem.HAT,
  id: 55,
  name: translate('vk.card_hat'),
});

export const Bicorne = new CustomItem({
  type: VkItem.HAT,
  id: 56,
  name: translate('vk.bicorne'),
});

export const PirateBicorne = new CustomItem({
  type: VkItem.HAT,
  id: 57,
  name: translate('vk.pirate_bicorne'),
});

export const RotatedBicone = new CustomItem({
  type: VkItem.HAT,
  id: 58,
  name: translate('vk.rotated_bicorne'),
});

export const JesterHat = new CustomItem({
  type: VkItem.HAT,
  id: 59,
  name: translate('vk.jester_hat'),
});

export const ExecutionHood = new CustomItem({
  type: VkItem.HAT,
  id: 60,
  name: translate('vk.execution_hood'),
});

export const Wig = new CustomItem({
  type: VkItem.HAT,
  id: 61,
  name: translate('vk.wig'),
});

export const DarkHood = new CustomItem({
  type: VkItem.HAT,
  id: 62,
  name: translate('vk.dark_hood'),
});

export const Saucepan = new CustomItem({
  type: VkItem.HAT,
  id: 63,
  name: translate('vk.saucepan'),
});

export const Headband = new CustomItem({
  type: VkItem.HAT,
  id: 64,
  name: translate('vk.headband'),
});

export const PlagueMaskHat = new CustomItem({
  type: VkItem.HAT,
  id: 65,
  name: translate('vk.plague_mask_hat'),
});

export const SkullHelmet = new CustomItem({
  type: VkItem.HAT,
  id: 66,
  name: translate('vk.skull_helmet'),
});

export const BlackSkullHelmet = new CustomItem({
  type: VkItem.HAT,
  id: 67,
  name: translate('vk.black_skull_helmet'),
});

export const GoldenSkullHelmet = new CustomItem({
  type: VkItem.HAT,
  id: 68,
  name: translate('vk.golden_skull_helmet'),
});

export const ChefsHat = new CustomItem({
  type: VkItem.HAT,
  id: 69,
  name: translate('vk.chefs_hat'),
});

export const GjermundbuHelmet = new CustomItem({
  type: VkItem.HAT,
  id: 70,
  name: translate('vk.gjermundbu_helmet'),
});

export const TaurusHelmet = new CustomItem({
  type: VkItem.HAT,
  id: 71,
  name: translate('vk.taurus_helmet'),
});

export const WinterHood = new CustomItem({
  type: VkItem.HAT,
  id: 72,
  name: translate('vk.winter_hood'),
});

export const SilverCrown = new CustomItem({
  type: VkItem.HAT,
  id: 73,
  name: translate('vk.silver_crowm'),
});

export const GoldenDwarfCrown = new CustomItem({
  type: VkItem.HAT,
  id: 74,
  name: translate('vk.golden_dwarf_crown'),
});

export const Bowtie = new CustomItem({
  type: VkItem.HAT,
  id: 75,
  name: translate('vk.bowtie'),
});
