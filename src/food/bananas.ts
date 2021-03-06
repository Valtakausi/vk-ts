import { translate } from 'craftjs-plugin/chat';
import { Material } from 'org.bukkit';
import { LeavesDecayEvent } from 'org.bukkit.event.block';
import { CustomItem } from '../common/items/CustomItem';
import { VkItem } from '../common/items/VkItem';

export const Banana = new CustomItem({
  id: 5,
  type: VkItem.FOOD,
  name: translate('vk.banana'),
});

const BANANA_CHANCE = 0.005;

registerEvent(LeavesDecayEvent, (event) => {
  const type = event.block?.type;
  if (type !== Material.JUNGLE_LEAVES) return;
  if (Math.random() > BANANA_CHANCE) return;

  const item = Banana.create({});
  const block = event.block;

  block.world.dropItem(block.location.add(0.5, 0.5, 0.5), item);
});
