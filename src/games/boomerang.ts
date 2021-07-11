import { ProjectileCollideEvent } from 'com.destroystokyo.paper.event.entity';
import { translate } from 'craftjs-plugin/chat';
import { Material, Sound, SoundCategory } from 'org.bukkit';
import { Player, Snowball } from 'org.bukkit.entity';
import {
  ProjectileHitEvent,
  ProjectileLaunchEvent,
} from 'org.bukkit.event.entity';
import { giveItem } from '../common/helpers/inventory';
import { CustomItem } from '../common/items/CustomItem';
import { EquipmentSlot } from 'org.bukkit.inventory';

export const Boomerang = new CustomItem({
  id: 2,
  name: translate('vk.boomerang'),
  type: Material.SNOWBALL,
});

const BoomerangSpin = new CustomItem({
  id: 4,
  name: translate('vk.boomerang'),
  type: Material.SNOWBALL,
});

const flyingBoomerangs = new Set<Snowball>();

Boomerang.event(
  ProjectileLaunchEvent,
  (event) => (event.entity instanceof Snowball ? event.entity.item : null),
  async (event) => {
    if (!(event.entity instanceof Snowball)) return;
    event.entity.item = BoomerangSpin.create({});
    await wait(0.2, 'seconds');
    flyingBoomerangs.add(event.entity);
    event.entity.velocity = event.entity.velocity.multiply(1.5);
  },
);

setInterval(() => {
  flyingBoomerangs.forEach((boomerang) => {
    if (!boomerang.isValid()) flyingBoomerangs.delete(boomerang);
    else {
      const velocity = boomerang.velocity;
      if (velocity.y < 0) {
        // Boomerangs fall down slower
        velocity.y = velocity.y * 0.5;
      }
      // Rotation to left
      boomerang.velocity = velocity.rotateAroundY(0.4 * velocity.length());
    }
  });
}, 400);

Boomerang.event(
  ProjectileLaunchEvent,
  (event) => (event.entity instanceof Snowball ? event.entity.item : null),
  async (event) => {
    if (!(event.entity instanceof Snowball)) return;
    event.entity.item = BoomerangSpin.create({});
    await wait(0.2, 'seconds');
    flyingBoomerangs.add(event.entity);
    event.entity.velocity = event.entity.velocity.multiply(1.5);
  },
);

BoomerangSpin.event(
  ProjectileHitEvent,
  (event) => (event.entity instanceof Snowball ? event.entity.item : null),
  async (event) => {
    const entity = event.entity;
    if (!(entity instanceof Snowball)) return;
    if (!entity.isValid()) return;
    entity.remove();
    entity.world.dropItemNaturally(entity.location, Boomerang.create({}));
  },
);

BoomerangSpin.event(
  ProjectileCollideEvent,
  (event) => (event.entity instanceof Snowball ? event.entity.item : null),
  async (event) => {
    const entity = event.entity;
    if (!(entity instanceof Snowball)) return;
    if (!entity.isValid()) return;
    entity.remove();
    if (event.collidedWith instanceof Player) {
      // Player catches the boomerang
      giveItem(event.collidedWith, Boomerang.create({}), EquipmentSlot.HAND);
      entity.world.playSound(
        entity.location,
        Sound.BLOCK_WOOD_PLACE,
        SoundCategory.PLAYERS,
        2,
        2,
      );
    } else {
      entity.world.dropItemNaturally(entity.location, Boomerang.create({}));
    }
  },
);
