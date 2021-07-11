import { Bukkit, Material, NamespacedKey } from 'org.bukkit';
import { ItemStack, RecipeChoice, ShapelessRecipe } from 'org.bukkit.inventory';

interface CustomShapelessRecipe {
  key: string;
  ingredients: (Material | ItemStack | RecipeChoice)[];
  result: ItemStack | Material;
}

export function shapelessRecipe({
  key,
  ingredients,
  result,
}: CustomShapelessRecipe) {
  const namespacedKey = new NamespacedKey('vk', key);
  let recipe: ShapelessRecipe;
  if (result instanceof ItemStack)
    recipe = new ShapelessRecipe(namespacedKey, result);
  else recipe = new ShapelessRecipe(namespacedKey, new ItemStack(result));

  ingredients.forEach((item) => {
    // We want the item to be either Material, RecipeChoice or ItemStack but not "Material | ItemStack | RecipeChoice"
    if (item instanceof Material) {
      recipe.addIngredient(item);
      return;
    }
    if (item instanceof ItemStack) {
      recipe.addIngredient(item);
      return;
    }
    if (item instanceof RecipeChoice) {
      recipe.addIngredient(item);
      return;
    }
  });
  Bukkit.server.addRecipe(recipe);
}
