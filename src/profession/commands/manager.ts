import { color, text } from 'craftjs-plugin/chat';
import { Bukkit, OfflinePlayer } from 'org.bukkit';
import { CommandSender } from 'org.bukkit.command';
import { Player } from 'org.bukkit.entity';
import { promptYesNo } from '../../chat/prompt';
import { errorMessage, successMessage } from '../../chat/system';
import { distanceBetween } from '../../common/helpers/locations';
import {
  clearAppointTime,
  clearProfession,
  getAppointTime,
  setProfession,
} from '../data/player';
import {
  getProfession,
  professionInNation,
  systemProfession,
} from '../data/profession';
import { Profession } from '../profession';
import { isSubordinateProfession } from '../tools';
import { getContextNation } from './core';

/**
 * Maximum distance between nominator and target.
 */
const NOMINATE_DISTANCE = 5;

/**
 * Days to wait between professions.
 */
const CHANGE_COOLDOWN_DAYS = 7;

registerCommand(
  'nimitä',
  (sender, alias, originalArgs) => {
    const [args, nation] = getContextNation(sender, originalArgs);
    if (args.length < 2) {
      return false; // Missing arguments
    }

    const player = Bukkit.getPlayer(args[0]);
    if (!player) {
      return errorMessage(sender, `${args[0]} ei ole juuri nyt paikalla.`);
    }

    const targetProf = nation
      ? professionInNation(nation, args[1])
      : systemProfession(args[1]);
    if (!targetProf) {
      return errorMessage(sender, `Ammattia ${args[1]} ei löydy valtiostasi.`);
    }

    // Some sanity checks for non-admin players
    if (!sender.hasPermission('vk.profession.admin')) {
      // Sanity check, we need sender to be player for most of the checks
      if (!(sender instanceof Player)) {
        // ???
        return errorMessage(
          sender,
          'Not a player, but missing vk.profession.admin!',
        );
      }

      // Check nominator profession (they need one)
      const senderProf = getProfession(sender);
      if (!senderProf) {
        return errorMessage(sender, 'Sinulla ei ole ammattia.');
      }
      if (!isSubordinateProfession(senderProf, targetProf)) {
        return errorMessage(
          sender,
          `Sinulla ei ole oikeutta nimittää ammattiin ${targetProf.name}.`,
        );
      }

      // Check distance between players
      if (
        distanceBetween(sender.location, player.location) > NOMINATE_DISTANCE
      ) {
        return errorMessage(sender, `${player.name} on liian kaukana sinusta.`);
      }
    }

    // Send request for profession change
    requestProfessionChange(sender, player, targetProf);
  },
  {
    permission: 'vk.profession.player',
  },
);

async function requestProfessionChange(
  source: CommandSender,
  target: Player,
  profession: Profession,
) {
  // Check if the target has recently changed their profession
  const cooldownMs = CHANGE_COOLDOWN_DAYS * 24 * 3600 * 1000;
  const timeElapsed = Date.now() - getAppointTime(target);
  if (timeElapsed < cooldownMs) {
    errorMessage(
      source,
      `${
        target.name
      } on karenssissa eikä voi saada uutta ammattia. Karenssia jäljellä: ${Math.ceil(
        (cooldownMs - timeElapsed) / 1000 / 3600 / 24,
      )} päivää.`,
    );
    return;
  }

  // If not, offer it to them
  successMessage(target, `${source.name} tarjoaa sinulle ammattia!`);
  target.sendMessage('Voit vaihtaa ammattia kerran 7 päivässä.');
  const answer = await promptYesNo(
    target,
    30,
    `Ota vastaan ammatti: ${profession.name}?`,
  );
  if (answer == 'yes') {
    successMessage(target, 'Ammattitarjous hyväksytty!');
    changeProfession(target, profession);
  } else if (answer == 'no') {
    successMessage(target, 'Ammattitarjous hylätty.');
    errorMessage(source, `${target.name} hylkäsi ammattitarjouksesi.`);
  } else if (answer == 'timeout') {
    errorMessage(target, 'Ammattitarjous peruttu, odotit liian pitkään.');
    errorMessage(source, `${target.name} ei vastannut ammattitarjoukseen.`);
  } // else: do nothing
}

function changeProfession(player: Player, profession: Profession) {
  // Let everyone know about this
  // TODO profession name formatting
  Bukkit.broadcast(
    color('#55FF55', text(`${player.name} on nyt ${profession.name}!`)),
  );
  setProfession(player, profession); // Actually change profession
}

// Admin command from clearing appoint time
registerCommand(
  'nollaakarenssi',
  (sender, _alias, args) => {
    const player = Bukkit.getOfflinePlayerIfCached(args[0]);
    if (player) {
      clearAppointTime(player);
      successMessage(sender, 'Karenssi nollattu.');
    } else {
      errorMessage(sender, `Pelaajaa ${args[0]} ei löydy.`);
    }
  },
  {
    permission: 'vk.profession.admin',
    usage: '/nollaakarenssi <pelaaja>',
  },
);

registerCommand(
  'erota',
  (sender, _alias, args) => {
    if (!args[0]) {
      return false;
    }
    const player = Bukkit.getOfflinePlayer(args[0]);
    if (!player) {
      errorMessage(sender, `Pelaajaa ${args[0]} ei löydy.`);
      return;
    }
    firePlayer(sender, player);
  },
  {
    permission: 'vk.profession.player',
    usage: '/erota <pelaaja>',
  },
);

async function firePlayer(sender: CommandSender, player: OfflinePlayer) {
  const profession = getProfession(player);
  if (!profession) {
    errorMessage(sender, 'prof.player_no_prof', player.name ?? '(unknown)');
    return;
  }

  // Unless admin/console, do some access checks
  if (!sender.hasPermission('vk.profession.admin')) {
    // Sanity check, we need sender to be player for most of the checks
    if (!(sender instanceof Player)) {
      // ???
      return errorMessage(
        sender,
        'Not a player, but missing vk.profession.admin!',
      );
    }
    const senderProf = getProfession(sender);
    if (!senderProf) {
      errorMessage(sender, `Sinulla ei ole ammattia.`);
      return;
    }
    if (!isSubordinateProfession(senderProf, profession)) {
      errorMessage(
        sender,
        `Sinulla ei ole oikeutta erottaa pelaajaa ${player.name}`,
      );
      return;
    }
  }
  switch (
    await promptYesNo(
      sender,
      10,
      `Erota ${player.name} ammatista ${profession.name}?`,
    )
  ) {
    case 'yes':
      clearProfession(player);
      Bukkit.broadcast(
        color(
          '#FF5555',
          text(`${player.name} ei ole enää ${profession.name}.`),
        ),
      );
      break;
    case 'no':
    case 'timeout':
      errorMessage(sender, 'Erottaminen peruttu.');
  }
}
