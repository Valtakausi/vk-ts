import { CustomItem } from '../common/items/CustomItem';
import { Material, Location } from 'org.bukkit';
import { PlayerDropItemEvent } from 'org.bukkit.event.player';
import { EntityType, Player } from 'org.bukkit.entity';

const Dice1 = new CustomItem({
  id: 12,
  modelId: 12,
  name: 'Noppa [1]',
  type: Material.SHULKER_SHELL,
});

const Dice2 = new CustomItem({
  id: 13,
  modelId: 13,
  name: 'Noppa [2]',
  type: Material.SHULKER_SHELL,
});

const Dice3 = new CustomItem({
  id: 14,
  modelId: 14,
  name: 'Noppa [3]',
  type: Material.SHULKER_SHELL,
});

const Dice4 = new CustomItem({
  id: 15,
  modelId: 15,
  name: 'Noppa [4]',
  type: Material.SHULKER_SHELL,
});

const Dice5 = new CustomItem({
  id: 16,
  modelId: 16,
  name: 'Noppa [5]',
  type: Material.SHULKER_SHELL,
});

const Dice6 = new CustomItem({
  id: 17,
  modelId: 17,
  name: 'Noppa [6]',
  type: Material.SHULKER_SHELL,
});

const PICKUP_DELAY = 3.5; // Seconds
const DICES = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

registerEvent(PlayerDropItemEvent, (event) => {
  const item = event.itemDrop.itemStack;
  if (item.type !== Material.SHULKER_SHELL) return;

  if (!DICES.some((dice) => dice.check(item))) return;
  const amount = item.amount;

  const face = Math.ceil(Math.random() * 6);
  event.itemDrop.itemStack = DICES[face - 1].create();
  event.itemDrop.itemStack.amount = amount;
  event.itemDrop.pickupDelay = PICKUP_DELAY * 20;

  announceDice(event.itemDrop.location, face);
});

// Send dice face as title to nearby players
function announceDice(location: Location, face: number) {
  const entities = location.world.getNearbyEntities(location, 5, 5, 5);
  for (const entity of entities) {
    if (entity.type === EntityType.PLAYER) {
      (entity as Player).sendTitle('§6' + face, '', 0, 40, 20);
    }
  }
}
