import { Material, Location, SoundCategory } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Entity, EntityType, Player, Snowball } from 'org.bukkit.entity';
import { Action } from 'org.bukkit.event.block';
import { ProjectileHitEvent } from 'org.bukkit.event.entity';
import {
  PlayerInteractEvent,
  PlayerToggleSneakEvent,
} from 'org.bukkit.event.player';
import { EquipmentSlot, PlayerInventory } from 'org.bukkit.inventory';
import { Vector } from 'org.bukkit.util';
import { CustomItem } from '../common/items/CustomItem';
import { PlayerLaunchProjectileEvent } from 'com.destroystokyo.paper.event.player';
import { text, translate } from 'craftjs-plugin/chat';
import { getPlainText } from '../chat/utils';

const BALL_DESPAWN_SECONDS = 30;
const JUMP_KICK_MULTIPLIER = 2;

export const Football = new CustomItem({
  id: 3,
  name: translate('vk.football'),
  type: Material.SNOWBALL,
});
const FootballItemStack = Football.create({});

// Player can pick up the football by clicking on the ground with empty hand
registerEvent(PlayerInteractEvent, (event) => {
  if (
    event.action === Action.RIGHT_CLICK_BLOCK &&
    event.hand === EquipmentSlot.HAND &&
    !event.item
  ) {
    const nearby = event.player.getNearbyEntities(1, 1, 1);
    for (const entity of nearby) {
      if (entity.type !== EntityType.SNOWBALL) continue;
      const snowball = entity as Snowball;
      if (Football.check(snowball.item)) {
        entity.remove();
        (event.player.inventory as PlayerInventory).itemInHand =
          FootballItemStack;
      }
      break;
    }
  }
});

// To start the game, player can throw the ball just like snowball
Football.event(
  PlayerLaunchProjectileEvent,
  (event) => event.itemStack,
  async (event) => {
    event.setCancelled(true);
    const player = event.player;
    const dir = player.location.direction;
    const ball = player.world.spawnEntity(
      player.location.add(0, 1.3, 0),
      EntityType.SNOWBALL,
    ) as Snowball;
    ball.item = FootballItemStack;

    ball.velocity = dir.multiply(0.2);
    ball.customName(text(Date.now().toString()));
    event.itemStack.amount -= 1;
  },
);

// The ball will bounce on other players, full blocks, fences and iron bars.
// The ball hits any other block or non-player entity, it will drop
Football.event(
  ProjectileHitEvent,
  (event) => (event.entity as Snowball).item,
  async (event) => {
    if (event.entityType !== EntityType.SNOWBALL) return;
    const ball = event.entity as Snowball;
    if (ball.isDead()) return;

    const name = getPlainText(event.entity.customName());
    const num = parseInt(name || '');
    event.entity.remove();

    if (isNaN(num)) return;

    // Stop bouncing if the ball has been untouched long enough
    const elapsed = Date.now() - num;
    if (elapsed > 1000 * BALL_DESPAWN_SECONDS) {
      stopBall(event.entity);
      return;
    }

    // Hit on block
    if (event.hitBlock && event.hitBlockFace) {
      bounceOnBlock(event.hitBlockFace, event.hitBlock, ball);
      return;
    }
    // Hit on entity
    if (event.hitEntity) {
      bounceOnEntity(event.hitEntity, ball);
    }
  },
);

function bounceOnEntity(entity: Entity, ball: Snowball) {
  if (entity.type !== EntityType.PLAYER) {
    stopBall(ball);
    return;
  }

  const player = entity as unknown as Player;
  const rand = new Vector(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5,
  );
  const velocity = player.location.direction.normalize();
  const newBall = player.world.spawnEntity(
    ball.location,
    EntityType.SNOWBALL,
  ) as Snowball;
  newBall.customName = ball.customName || '';
  newBall.item = FootballItemStack;

  let bounciness = player.isOnGround() ? 0.25 : 0.7;
  if (player.isSneaking()) {
    bounciness = 0.1;
  }
  const angle = velocity.angle(ball.velocity);
  if (angle < 1) {
    newBall.velocity = rand.multiply(bounciness);
  } else {
    newBall.velocity = velocity.multiply(bounciness);
  }
}

function bounceOnBlock(
  hitBlockFace: BlockFace,
  hitblock: Block,
  ball: Snowball,
) {
  const location = ball.location;
  let bounciness = 0.8;

  const hitMaterial = hitblock.type;
  const hitMaterialStr = hitMaterial.toString();

  // The ball will bounce off from 1x1x1 cubes (isOcculuding() === true)
  // Or from fences and iron bars
  if (hitMaterialStr.includes('_FENCE') || hitMaterial === Material.IRON_BARS) {
    bounciness = 0.2;
  } else if (!hitMaterial.isOccluding()) {
    stopBall(ball);
    return;
  }

  let bounceVector = new Vector(0.8, -1.0, 0.8);
  if (hitBlockFace === BlockFace.SOUTH || hitBlockFace === BlockFace.NORTH) {
    bounceVector = new Vector(0.8, 0.8, -1.0);
  } else if (
    hitBlockFace === BlockFace.EAST ||
    hitBlockFace === BlockFace.WEST
  ) {
    bounceVector = new Vector(-1.0, 0.8, 0.8);
  }

  const oldVelocity = ball.velocity;
  const velocity = new Vector(
    oldVelocity.x * bounceVector.x,
    oldVelocity.y * bounceVector.y,
    oldVelocity.z * bounceVector.z,
  ).multiply(bounciness);

  const newBall = ball.world.spawnEntity(
    location,
    EntityType.SNOWBALL,
  ) as Snowball;
  newBall.item = FootballItemStack;
  newBall.customName = ball.customName;
  newBall.velocity = velocity;
  playBounceSound(location, 2 * velocity.length());
}

// Kick the ball
registerEvent(PlayerToggleSneakEvent, (event) => {
  const player = event.player;
  if (player.isSneaking()) return;
  const nearby = player.getNearbyEntities(2, 2, 2);
  for (const entity of nearby) {
    if (entity?.type !== EntityType.SNOWBALL) continue;

    const ball = entity as Snowball;
    if (!Football.check(ball.item)) continue;

    if (entity.velocity.lengthSquared() > 0.1) continue;

    ball.customName(text(Date.now().toString()));

    const location = player.location;
    const pitch = 90 - location.pitch;
    const b = ball.location;
    const delta = b.add(location.multiply(-1)).toVector();
    const dir = delta.normalize();
    dir.y = 0.15;
    let angle = (pitch / 180) * Math.PI;
    if (angle >= Math.PI / 2) {
      angle = Math.PI / 2 - 0.01;
    }
    let power = 0.06 + (Math.tan(angle) * player.eyeHeight) / 12;
    if (power > 1) {
      power = 1;
    }

    // Power from jump + kick
    if (!player.isOnGround()) {
      power *= JUMP_KICK_MULTIPLIER;
      playKickSound(ball, 3);
    } else {
      playKickSound(ball, 0.3);
    }

    const velocity = ball.velocity;
    velocity.add(dir.multiply(power));
    ball.velocity = velocity;
    break;
  }
});

function playBounceSound(location: Location, volume: number) {
  location.world.playSound(
    location,
    'minecraft:block.wool.hit',
    SoundCategory.BLOCKS,
    volume,
    2,
  );
}

function playKickSound(ball: Entity, volume: number) {
  ball.world.playSound(
    ball.location,
    'minecraft:entity.player.attack.knockback',
    SoundCategory.BLOCKS,
    volume,
    1.2,
  );
}

function stopBall(ball: Entity) {
  ball.world.dropItem(ball.location, FootballItemStack);
  ball.remove();
  ball.world.playSound(
    ball.location,
    'minecraft:entity.generic.small_fall',
    SoundCategory.BLOCKS,
    1,
    0.7,
  );
}
