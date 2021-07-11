import { Material } from 'org.bukkit';
import {
  MugEmpty,
  ScoopEmpty,
  WineGlassEmpty,
} from '../../../hydration/bottles';
import { PLANKS } from '../../utilities/choices';
import { shapedRecipe } from '../../utilities/shaped-recipe';

shapedRecipe({
  key: 'wine_glass_empty',
  shape: ['G G', ' G ', ' G '],
  ingredients: {
    G: Material.GLASS,
  },
  result: WineGlassEmpty.create({}, 4),
});

shapedRecipe({
  key: 'mug_empty',
  shape: ['PPS', 'PP '],
  ingredients: {
    P: PLANKS,
    S: Material.STICK,
  },
  result: MugEmpty.create({}, 1),
});

shapedRecipe({
  key: 'scoop_empty',
  shape: ['PSS'],
  ingredients: {
    P: MugEmpty.create({}),
    S: Material.STICK,
  },
  result: ScoopEmpty.create({}, 1),
});

shapedRecipe({
  key: 'glass_mug_empty',
  shape: ['P P', 'P P', 'PPP'],
  ingredients: {
    P: Material.GLASS,
  },
  result: ScoopEmpty.create({}, 6),
});
