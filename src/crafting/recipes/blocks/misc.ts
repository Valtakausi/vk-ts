import { Material } from 'org.bukkit';
import { ItemStack } from 'org.bukkit.inventory';
import { PIANO } from '../../../instruments/piano';
import { shapedRecipe } from '../../utilities/shaped-recipe';

shapedRecipe({
  key: 'piano',
  shape: ['QQQ', 'DND', 'DDD'],
  ingredients: {
    Q: Material.QUARTZ_SLAB,
    D: Material.DARK_OAK_PLANKS,
    N: Material.NOTE_BLOCK,
  },
  result: new ItemStack(PIANO),
});
