import { CommandSender } from 'org.bukkit.command';
import { errorMessage, successMessage } from '../../chat/system';
import { Nation } from '../nation';
import {
  PlayerProfession,
  Profession,
  professionInNation,
  removeProfession,
  updateProfession,
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
    name: name,
    description: '', // No description yet
    nation: nation.id,
    creator: sender.name,
    features: [],
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
  const profession = professionInNation(nation, name);
  if (!profession) {
    return errorMessage(
      sender,
      `Ammattia ${name} ei ole olemassa valtiossasi.`,
    );
  }
  removeProfession(profession);
  //successMessage(sender, `Ammatti ${name} poistettu.`);
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
  // FIXME use profession ids, not names!
  switch (opts[0]) {
    case 'lisää':
      if (!opts[1]) {
        return errorMessage(sender, 'Alaiseksi lisättävä ammatti puuttuu.');
      }
      // Remove profession from list to prevent diplicates
      profession.subordinates = profession.subordinates.filter(
        (name) => name != profession.name,
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
        (name) => name != profession.name,
      );
      break;
    case 'nollaa':
      profession.subordinates = []; // Clear subordinates
      break;
  }
  updateProfession(profession); // Save changes
}
