import { Bukkit, Material, NamespacedKey } from 'org.bukkit';
import { ItemStack, RecipeChoice, ShapedRecipe } from 'org.bukkit.inventory';
import { MaterialChoice } from 'org.bukkit.inventory.RecipeChoice';

interface Ingredient {
  [key: string]: Material | ItemStack | MaterialChoice;
}
interface CustomShapedRecipe {
  key: string;
  shape: string[];
  ingredients: Ingredient;
  result: ItemStack | Material;
}

export function shapedRecipe({
  key,
  shape,
  ingredients,
  result,
}: CustomShapedRecipe) {
  const namespacedKey = new NamespacedKey('vk', key);
  let shapedRecipe: ShapedRecipe;

  if (result instanceof ItemStack)
    shapedRecipe = new ShapedRecipe(namespacedKey, result);
  else shapedRecipe = new ShapedRecipe(namespacedKey, new ItemStack(result));

  shapedRecipe.shape(...shape);

  Object.keys(ingredients).forEach((symbol) => {
    const item = ingredients[symbol];
    // We want the item to be either Material or ItemStack or RecipeChoice but not "Material | ItemStack | RecipeChoice"
    if (item instanceof Material) {
      shapedRecipe.setIngredient(symbol, item);
      return;
    }
    if (item instanceof ItemStack) {
      shapedRecipe.setIngredient(symbol, item);
      return;
    }
    if (item instanceof RecipeChoice) {
      shapedRecipe.setIngredient(symbol, item);
      return;
    }
  });

  Bukkit.server.addRecipe(shapedRecipe);
}
