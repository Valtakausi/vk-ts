import { Bukkit, Material, NamespacedKey } from 'org.bukkit';
import {
  BlastingRecipe,
  CampfireRecipe,
  FurnaceRecipe,
  ItemStack,
  SmokingRecipe,
} from 'org.bukkit.inventory';

interface CustomFurnaceRecipe {
  key: string;
  input: Material;
  result: Material | ItemStack;
  seconds: number;
  furnaces: ('blasting' | 'campfire' | 'smoking' | 'smelting')[];
}

export function furnaceRecipe({
  key,
  input,
  result,
  seconds,
  furnaces,
}: CustomFurnaceRecipe) {
  let RecipeConstructor;
  for (const furnace of furnaces) {
    let ticks = seconds * 20;
    const namespacedKey = new NamespacedKey('vk', key);
    switch (furnace) {
      case 'blasting':
        RecipeConstructor = BlastingRecipe;
        ticks = ticks / 2; // Blast furnace is twice as fast
        break;
      case 'campfire':
        RecipeConstructor = CampfireRecipe;
        break;
      case 'smoking':
        RecipeConstructor = SmokingRecipe;
        ticks = ticks / 2; // Smoker is twice as fast
        break;
      default:
        // Smelting
        RecipeConstructor = FurnaceRecipe;
        break;
    }
    // Params allows material and itemstack, but we need an ItemStack
    const output = result instanceof Material ? new ItemStack(result) : result;

    const recipe = new RecipeConstructor(
      namespacedKey,
      output,
      input,
      0,
      Math.floor(ticks),
    );
    Bukkit.server.addRecipe(recipe);
  }
}
