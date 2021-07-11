import { Bukkit } from 'org.bukkit';

Bukkit.server.resetRecipes();

/**
 * Load all recipes
 */
require('./recipes/index');
