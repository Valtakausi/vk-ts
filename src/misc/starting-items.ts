import { Material } from 'org.bukkit';
import { PlayerJoinEvent } from 'org.bukkit.event.player';
import { ItemStack } from 'org.bukkit.inventory';
import { PotionMeta } from 'org.bukkit.inventory.meta';
import { PotionData, PotionType } from 'org.bukkit.potion';
import { giveItem } from '../common/helpers/inventory';
import { Mug } from '../hydration/bottles';
import { FlatCap } from './hats';

// TODO: Use better and more interesting items (when implemented)
// Hat? Custom food? Book?
const BOTTLE = new ItemStack(Material.POTION);
const bottleMeta = BOTTLE.itemMeta as PotionMeta;
bottleMeta.basePotionData = new PotionData(PotionType.WATER);
BOTTLE.itemMeta = bottleMeta;

const MUG = Mug.create({});
const mugMeta = MUG.itemMeta as PotionMeta;
mugMeta.basePotionData = new PotionData(PotionType.WATER);
MUG.itemMeta = mugMeta;

const ITEMS = [
  // First item is going to be placed on the main hand
  FlatCap.create({}),
  new ItemStack(Material.COOKED_BEEF, 10),
  BOTTLE,
  MUG,
];

/**
 * Give all basic starting items for the player
 */
registerEvent(PlayerJoinEvent, (event) => {
  if (event.player.hasPlayedBefore()) return;
  for (const item of ITEMS) {
    giveItem(event.player, item);
  }
});
