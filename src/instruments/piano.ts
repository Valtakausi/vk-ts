import { Float } from 'java.lang';
import { Material } from 'org.bukkit';
import { Block, BlockFace } from 'org.bukkit.block';
import { Action } from 'org.bukkit.event.block';
import { PlayerInteractEvent } from 'org.bukkit.event.player';
import { EquipmentSlot } from 'org.bukkit.inventory';
import { Directional } from 'org.bukkit.material';
import { Vector } from 'org.bukkit.util';

const PIANO = Material.BROWN_GLAZED_TERRACOTTA;
const MAX_PIANO_WIDTH = 5;
const MAX_OCTAVE = 4;
const NOTES_PER_BLOCK = 12;
const KEYS_IN_OCTAVE = 12;

const WHITES = [6, 8, 10, 11, 13, 15, 17];
const BLACKS = [7, 9, 12, 14, 16];

const BLACK_POSITIONS = [0.1, 0.25, 0.52, 0.68, 0.82];
const BLACK_VERTICAL_MAX = 0.8;
const KEYS_VERTICAL_MIN = 0.62;

function playNote(block: Block, note: number) {
  const octave = Math.min(MAX_OCTAVE, Math.floor(note / KEYS_IN_OCTAVE));

  if (isNaN(octave)) {
    return;
  }

  const pitch = 0.5 * 2 ** ((note - octave * KEYS_IN_OCTAVE) / KEYS_IN_OCTAVE);

  block.world.playSound(
    block.location,
    `custom.piano${octave + 2}`,
    2,
    (new Float(pitch) as unknown) as number,
  );
}

export function playPianoChord(block: Block, chord: number, minor = false) {
  const notes = [chord, chord + (minor ? 3 : 4), chord + 7];
  notes.forEach((note) => playNote(block, note));
}

function getPianoIndex(clickedBlock: Block, left: Vector) {
  let current = clickedBlock;
  for (let i = 0; i < MAX_PIANO_WIDTH; i++) {
    const loc = current.location;
    current = loc.subtract(left).block;
    if (current.type !== PIANO) {
      return i;
    }
  }
  return 0;
}

registerEvent(PlayerInteractEvent, (event) => {
  const player = event.player;
  const action = event.action;
  const block = event.clickedBlock;
  const face = event.blockFace;
  if (!block || block.type !== PIANO) {
    return;
  }
  if (event.hand !== EquipmentSlot.HAND || face !== BlockFace.UP) {
    return;
  }
  const raytrace = player.rayTraceBlocks(4);
  if (!raytrace) {
    return;
  }

  const hitPos = raytrace.hitPosition;
  const loc = block.location.toVector();
  const delta = hitPos.subtract(loc);
  const data = (block.blockData as unknown) as Directional;
  const facing = data.facing;
  const forward = facing.direction;
  const top = new Vector(0, 1, 0);
  const left = top.getCrossProduct(forward);

  // How many piano blocks there are on the left side of the block
  const pianoIndex = getPianoIndex(block, left);

  const hor = delta.x * left.x + delta.z * left.z;
  const ver = delta.z * left.x + delta.x * left.z * -1;

  const horizontal = hor + (hor < 0 ? 1 : 0);
  const vertical = ver + (ver < 0 ? 1 : 0);

  if (vertical < KEYS_VERTICAL_MIN) {
    // Did hit behind the keys (qwood)
    return;
  }
  event.setCancelled(true);

  const isBlack =
    vertical < BLACK_VERTICAL_MAX &&
    BLACK_POSITIONS.some((hor) => horizontal > hor && horizontal < hor + 0.1);

  const isChord = action !== Action.RIGHT_CLICK_BLOCK;

  const isMinor = player.isSneaking();
  const offsetNotes = pianoIndex * NOTES_PER_BLOCK;

  let note = 0;

  if (isBlack) {
    let index = 0;
    BLACK_POSITIONS.forEach((hor, i) => {
      if (horizontal > hor) {
        index = i;
      }
    });
    note = offsetNotes + BLACKS[index];
  } else {
    // White key
    const key = Math.floor(horizontal / (1 / 7));
    note = offsetNotes + WHITES[key];
  }

  if (isChord) {
    playPianoChord(block, note, isMinor);
  } else {
    playNote(block, note);
  }
});
