import { shapelessRecipe } from '../../utilities/shapeless-recipes';
import { IronSwordPart } from '../../../blacksmith/metal-parts';
import { Material } from 'org.bukkit';
import { makeDamaged } from '../../../blacksmith/damaged-tools';
import { shapedRecipe } from '../../utilities/shaped-recipe';
import { HotIronBlade } from '../../../blacksmith/blacksmith';
import { VkItem } from '../../../common/items/VkItem';

shapedRecipe({
  key: 'iron_sword_part',
  shape: ['B ', 'B '],
  ingredients: {
    B: HotIronBlade.create({}),
  },
  result: IronSwordPart.create({}),
});

shapelessRecipe({
  key: 'iron_sword',
  ingredients: [IronSwordPart.create({}), Material.STICK],
  result: makeDamaged(VkItem.SWORD),
});
