import { Material } from 'org.bukkit';
import { Boomerang } from '../../../games/boomerang';
import { Football } from '../../../games/football';
import { shapedRecipe } from '../../utilities/shaped-recipe';

shapedRecipe({
  key: 'boomerang',
  shape: [' S ', 'S S'],
  ingredients: {
    S: Material.STICK,
  },
  result: Boomerang.create({}),
});

shapedRecipe({
  key: 'football',
  shape: ['LLL', 'L L', 'LLL'],
  ingredients: {
    L: Material.LEATHER,
  },
  result: Football.create({}),
});
