import { Bukkit } from 'org.bukkit';
import { CommandSender } from 'org.bukkit.command';
import { errorMessage, statusMessage } from '../../chat/system';
import { getContextNation, guessNation } from './core';
import { Nation } from '../nation';
import {
  createProfession,
  deleteProfession,
  manageProfession,
  showRulerOverview,
} from './ruler';
import {
  getProfession,
  professionInNation,
  professionsByName,
  professionsInNation,
} from '../data/profession';
import {
  addTranslation,
  getTranslator,
} from '../../common/localization/localization';

registerCommand(
  'ammatti',
  (sender, _alias, originalArgs) => {
    // Figure out the nation this command is operating on
    // Admins and console can set it; for everyone else, guess it from their profession
    const [args, nation] = getContextNation(sender, originalArgs);

    if (!args[0]) {
      return false; // Print usage
    }

    switch (args[0]) {
      case 'luo':
        createProfession(sender, nation, args[1]);
        break;
      case 'poista':
        deleteProfession(sender, nation, args[1]);
        break;
      default:
        viewOrManage(sender, nation, args[0], args.slice(1));
    }
  },
  {
    permission: 'vk.profession.player',
    usage: (sender) => {
      // Different instructions depending on player permissions
      if (sender.hasPermission('vk.profession.ruler')) {
        sender.sendMessage('/ammatti <luo|poista> <nimi> - luo/poista ammatti');
        sender.sendMessage('/ammatti <ammatti> - katso/muokkaa ammattia');
        sender.sendMessage('/ammatti <pelaaja> - pelaajan ammatti');
      } else {
        sender.sendMessage('/ammatti <ammatti> - ammatin harjoittajat');
        sender.sendMessage('/ammatti <pelaaja> - pelaajan ammatti');
      }
    },
    completer: (sender, _alias, args) => {
      if (args.length == 1) {
        const names = [];
        for (const player of Bukkit.onlinePlayers) {
          names.push(player.name);
        }
        if (sender.hasPermission('vk.profession.ruler')) {
          names.push('luo');
          names.push('poista');
        }
        return names;
      } else if (args.length == 2) {
        const nation = guessNation(sender);
        if (args[0] == 'poista' && nation) {
          return professionsInNation(nation).map((prof) => prof.name);
        } else if (args[0] != 'luo') {
          return ['alaiset', 'kuvaile'];
        }
      } else if (args.length == 3) {
        if (args[1] == 'alaiset') {
          return ['lisää', 'poista', 'nollaa'];
        }
      }
      return [];
    },
  },
);

function viewOrManage(
  sender: CommandSender,
  nation: Nation | undefined,
  name: string,
  opts: string[],
) {
  const tr = getTranslator(sender);
  const professions = professionsByName(name.toLowerCase());
  if (professions.size == 0) {
    // Maybe they meant to get a profession of player?
    const player = Bukkit.getOfflinePlayerIfCached(name);
    if (player) {
      const prof = getProfession(player);
      if (prof) {
        sender.sendMessage(
          tr('prof.player_prof', player.name ?? '(unknown)', prof.name),
        );
      } else {
        sender.sendMessage(
          tr('prof.player_no_prof', player.name ?? '(unknown)'),
        );
      }
    } else {
      errorMessage(sender, tr('prof.not_found', name));
    }
    return;
  }

  // Print list of players with the given profession
  if (opts.length == 0 || opts[0] == '--tab') {
    if (sender.hasPermission('vk.profession.ruler')) {
      if (!nation) {
        return errorMessage(sender, tr('prof.no_nation')); // Likely admin or console
      }
      let tab = 'profession';
      if (opts[0] == '--tab') {
        tab = opts[1];
        opts = opts.slice(2);
      }
      const profession = professionInNation(nation, name);
      if (profession) {
        showRulerOverview(sender, profession, tab);
      } else {
        // Not an error, just let the ruler know that why they will see regular player UI
        statusMessage(sender, tr('prof.nation_no_prof', name));
      }
    }
    return;
  }

  // All other operations are reserved for rulers and admins
  if (!sender.hasPermission('vk.profession.ruler')) {
    return errorMessage(sender, tr('prof.not_ruler'));
  } else if (!nation) {
    return errorMessage(sender, tr('prof.no_nation'));
  }

  const profession = professions.get(nation.id);
  if (!profession) {
    return errorMessage(sender, tr('prof.nation_no_prof', name));
  } else if (profession.type != 'player') {
    throw new Error(`system profession in player nation ${nation.id}`);
  }
  manageProfession(sender, profession, opts);
}

// Non-ruler management commands
require('./manager');

addTranslation('prof.player_prof', {
  fi_fi: '%s on ammatiltaan %s.',
  en_us: '%s is a %s.',
});
addTranslation('prof.player_no_prof', {
  fi_fi: '%s ei tällä hetkellä harjoita ammattia.',
  en_us: '%s is currently without a profession.',
});
addTranslation('prof.not_found', {
  fi_fi: 'Pelaajaa tai ammattia %s ei löydy!',
  en_us: 'No player or profession %s exists!',
});
addTranslation('prof.not_ruler', {
  fi_fi: 'Sinulla ei ole oikeutta hallita ammatteja!',
  en_us: 'You do not have permission to manage professions!',
});
addTranslation('prof.no_nation', {
  fi_fi: 'Et kuulu valtioon!',
  en_us: 'You are not a member of any nation!',
});
addTranslation('prof.nation_no_prof', {
  fi_fi: 'Ammattia %s ei ole olemassa valtiossasi!',
  en_us: 'Your nation does not have a profession named %s!',
});
