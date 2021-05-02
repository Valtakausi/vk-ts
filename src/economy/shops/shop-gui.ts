import { Bukkit, ChatColor } from 'org.bukkit';
import { Block, Container } from 'org.bukkit.block';
import { Player } from 'org.bukkit.entity';
import { findItemFromContainer, getShopItem } from './helpers';
import { getShop } from './ShopData';
import {
  InventoryClickEvent,
  InventoryCloseEvent,
} from 'org.bukkit.event.inventory';
import { PlayerSwapHandItemsEvent } from 'org.bukkit.event.player';

const GUI_ICON = '\uE009';

/**
 * Set of players who are using the shop GUI
 * This can be used to prevent inventory actions
 */
const openGUIs = new Set<Player>();

/**
 * Open GUI to display preview of the item in the shop
 * @param player Players who clicked the shop
 * @param chest Container behind the clicked sign (shop container)
 * @param sign The shop sign, where the data was stored
 */
export function openShopGUI(player: Player, chest: Container, sign: Block) {
  const shop = getShop(sign);
  if (!shop) return undefined;
  const item = getShopItem(
    shop.item.material,
    shop.item.modelId,
    shop.item.name,
  );
  let itemPreview = findItemFromContainer(chest, item);
  if (shop.type === 'BUYING') itemPreview = item;
  if (!itemPreview) return;
  const inv = createShopGuiInventory(sign);
  if (!inv) return;
  inv.setItem(13, itemPreview);

  openGUIs.add(player);
  player.openInventory(inv);
}

/**
 * Create the (empty) inventory to be displayed
 * @param sign The sign of the shop
 */
function createShopGuiInventory(sign: Block) {
  const shop = getShop(sign);
  if (!shop) return undefined;

  const unit =
    shop.price === 1
      ? shop.currency.unitPlural.slice(0, -1)
      : shop.currency.unitPlural;

  // There wasn't enough black magic?
  return Bukkit.createInventory(
    null,
    3 * 9,
    ChatColor.WHITE +
      '\uF808' +
      GUI_ICON +
      '\uF80C' +
      shop.price +
      ' ' +
      unit +
      '/kpl',
  );
}

registerEvent(InventoryCloseEvent, (event) => {
  if (event.player instanceof Player) openGUIs.delete(event.player);
});

/**
 * Prevent all inventory actions when player has shop GUI open
 */
registerEvent(InventoryClickEvent, (event) => {
  if (!(event.whoClicked instanceof Player)) return;
  if (openGUIs.has(event.whoClicked)) event.setCancelled(true);
});
registerEvent(PlayerSwapHandItemsEvent, (event) => {
  if (openGUIs.has(event.player)) {
    // This will look buggy on the client, but still prevents the action
    // In creative mode this will actually "dupe" the item
    event.setCancelled(true);
    event.player.updateInventory();
  }
});
