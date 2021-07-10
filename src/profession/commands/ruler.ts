import { clickEvent, color, component, style, text } from 'craftjs-plugin/chat';
import { Audience } from 'net.kyori.adventure.audience';
import { Action } from 'net.kyori.adventure.text.event.ClickEvent';
import { CommandSender } from 'org.bukkit.command';
import { errorMessage, sendMessages, successMessage } from '../../chat/system';
import {
  addTranslation,
  getTranslator,
} from '../../common/localization/localization';
import {
  professionById,
  professionInNation,
  removeProfession,
  updateProfession,
} from '../data/profession';
import { Nation } from '../nation';
import {
  formatProfession,
  PlayerProfession,
  professionId,
} from '../profession';

export function createProfession(
  sender: CommandSender,
  nation: Nation | undefined,
  name: string,
) {
  if (!sender.hasPermission('vk.profession.ruler')) {
    return errorMessage(sender, 'Sinulla ei ole oikeutta luoda ammatteja.');
  } else if (!nation) {
    return errorMessage(sender, 'Et kuulu valtioon.');
  } else if (professionInNation(nation, name)) {
    return errorMessage(sender, `Ammatti ${name} on jo olemassa valtiossasi.`);
  }
  const profession: PlayerProfession = {
    type: 'player',
    name: name.toLowerCase(),
    description: '', // No description yet
    nation: nation.id,
    creator: sender.name,
    roles: [],
    subordinates: [],
  };
  updateProfession(profession); // Save new profession

  successMessage(sender, `Ammatti ${name} luotu.`);
  //viewOrUpdate(sender, nation, profession.name, []); // Show ruler overview
}

export function deleteProfession(
  sender: CommandSender,
  nation: Nation | undefined,
  name: string,
) {
  if (!sender.hasPermission('vk.profession.ruler')) {
    return errorMessage(sender, 'Sinulla ei ole oikeutta luoda ammatteja.');
  } else if (!nation) {
    return errorMessage(sender, 'Et kuulu valtioon.');
  }
  const profession = professionInNation(nation, name.toLowerCase());
  if (!profession) {
    return errorMessage(
      sender,
      `Ammattia ${name} ei ole olemassa valtiossasi.`,
    );
  }
  removeProfession(profession);
  successMessage(sender, `Ammatti ${name} poistettu.`);
}

export function manageProfession(
  sender: CommandSender,
  profession: PlayerProfession,
  opts: string[],
) {
  switch (opts[0]) {
    case 'alaiset':
      updateSubordinates(sender, profession, opts.slice(1));
      break;
    case 'kuvaile':
      profession.description = opts.slice(1).join(' ');
      updateProfession(profession);
      break;
  }
}

export function updateSubordinates(
  sender: CommandSender,
  profession: PlayerProfession,
  opts: string[],
) {
  const profId = professionId(profession);
  switch (opts[0]) {
    case 'lisää':
      if (!opts[1]) {
        return errorMessage(sender, 'Alaiseksi lisättävä ammatti puuttuu.');
      }
      // Remove profession from list to prevent duplicates
      profession.subordinates = profession.subordinates.filter(
        (id) => id != profId,
      );
      profession.subordinates.push(profession.name); // Add it to end
      profession.subordinates.sort(); // Sort alphabetically
      break;
    case 'poista':
      if (!opts[1]) {
        errorMessage(sender, 'Alaisista poistettava ammatti puuttuu.');
        return;
      }
      // Remove profession from list
      profession.subordinates = profession.subordinates.filter(
        (id) => id != profId,
      );
      break;
    case 'nollaa':
      profession.subordinates = []; // Clear subordinates
      break;
  }
  updateProfession(profession); // Save changes
}

const RULER_TABS = ['profession', 'players'];

export function showRulerOverview(
  ruler: Audience,
  profession: PlayerProfession,
  tab: string,
) {
  const tr = getTranslator(ruler);
  const tabs = RULER_TABS.map((name) => {
    const translated = tr('prof.ruler.tab_' + name);
    if (name == tab) {
      return style('bold', translated);
    } else {
      return clickEvent(
        Action.RUN_COMMAND,
        `/ammatti ${profession.name} --tab ${name}`,
        translated,
      );
    }
  });
  const baseCommand = `/ammatti ${profession.name} --tag ${tab} `;
  sendMessages(
    ruler,
    style('bold', tr('prof.ruler.header'), formatProfession(profession)),
    '\n',
    ...tabs,
  );
  if (tab == 'profession') {
    const subordinates = profession.subordinates.map((id) => {
      const prof = professionById(id);
      if (!prof) return text(`${id} (error)`);
      return component(
        formatProfession(prof),
        text(' '),
        clickEvent(
          Action.RUN_COMMAND,
          `/${baseCommand} alaiset poista ${prof.name}`,
          color('#AA0000', '✘'),
        ),
      );
    });
    sendMessages(
      ruler,
      tr('prof.ruler.desc', profession.description),
      ' ',
      clickEvent(
        Action.SUGGEST_COMMAND,
        `/ammatti ${profession.name} kuvaile `,
        tr('prof.ruler.edit_button'),
      ),
      '\n',
      tr('prof.ruler.subordinates'),
      ...subordinates,
      clickEvent(
        Action.SUGGEST_COMMAND,
        `/ammatti ${profession.name} alaiset lisää `,
        tr('prof.ruler.add_button'),
      ),
    );
  } else if (tab == 'players') {
    // TODO
  }
}

addTranslation('prof.ruler.header', {
  fi_fi: 'Ammatti: ',
  en_us: 'Profession: ',
});
addTranslation('prof.ruler.tab_profession', {
  fi_fi: 'Ammatti ',
  en_us: 'Profession ',
});
addTranslation('prof.ruler.tab_players', {
  fi_fi: 'Harjoittajat ',
  en_us: 'Players ',
});
addTranslation('prof.ruler.desc', {
  fi_fi: 'Kuvaus: %s',
  en_us: 'Description: %s',
});
addTranslation('prof.ruler.edit_button', {
  fi_fi: '(muokkaa)',
  en_us: '(edit)',
});
addTranslation('prof.ruler.subordinates', {
  fi_fi: 'Alaiset: ',
  en_us: 'Subordinates: ',
});
addTranslation('prof.ruler.add_button', {
  fi_fi: '(lisää)',
  en_us: '(add)',
});
