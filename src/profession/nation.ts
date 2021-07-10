import { Table } from 'craftjs-plugin';
import { getTable } from '../common/datas/database';
import { errorMessage, successMessage } from '../chat/system';
import { promptYesNo } from '../chat/prompt';
import { CommandSender } from 'org.bukkit.command';

const nationsDb: Table<string, string> = getTable('nations');
const nations: Map<string, Nation> = new Map();

export interface Nation {
  /**
   * Id of the nation. Currently the name in lower case.
   */
  id: string;

  /**
   * Nation name. In future, this might be mutable.
   */
  name: string;
}

export function nationById(id: string): Nation | undefined {
  return nations.get(id);
}

function addNation(name: string) {
  const nation: Nation = {
    id: name.toLowerCase(),
    name: name,
  };
  nations.set(nation.id, nation); // In memory
  nationsDb.set(nation.id, JSON.stringify(nation)); // Persistent
}

function removeNation(nation: Nation) {
  nations.delete(nation.id);
  nationsDb.delete(nation.id);
}

registerCommand(
  'valtio',
  (sender, alias, args) => {
    const action = args[0];
    const name = args[1];
    if (!action) {
      return false;
    }
    if (action == 'luo') {
      if (!name) {
        return false;
      }
      handleCreate(sender, name);
    } else if (action == 'poista') {
      if (!name) {
        return false;
      }
      handleDelete(sender, name);
    } else if (action == 'lista') {
      sender.sendMessage('Lista valtioista:');
      for (const nation of nations.values()) {
        sender.sendMessage(`${nation.name} (${nation.id})`);
      }
    } else {
      return false;
    }
  },
  {
    usage:
      '/valtio <luo|poista> <nimi> - luo/poista valtioita\n/valtio lista - listaa valtiot',
    permission: 'vk.nation.admin',
    permissionMessage:
      'Sinulla ei ole oikeutta hallita valtioita. Ota tarvittaessa yhteys ylläpitoon.',
  },
);

async function handleCreate(sender: CommandSender, name: string) {
  if (nationById(name.toLowerCase())) {
    errorMessage(sender, `Valtio ${name} on jo olemassa!`);
    return;
  }
  switch (
    await promptYesNo(sender, 10, `Haluatko varmasti luoda valtion ${name}?`)
  ) {
    case 'yes':
      addNation(name);
      successMessage(sender, `Luotu valtio ${name}.`);
      break;
    case 'no':
    case 'timeout':
      errorMessage(sender, `Valtion luominen peruttu.`);
      break;
  }
}

async function handleDelete(sender: CommandSender, name: string) {
  const nation = nationById(name.toLowerCase());
  if (!nation) {
    errorMessage(sender, `Valtiota ${name} ei ole olemassa!`);
    return;
  }
  switch (
    await promptYesNo(sender, 10, `Haluatko varmasti poistaa valtion ${name}?`)
  ) {
    case 'yes':
      removeNation(nation);
      successMessage(sender, `Poistettu valtio ${name}.`);
      break;
    case 'no':
    case 'timeout':
      errorMessage(sender, `Valtion poistaminen peruttu.`);
      break;
  }
}

// Load nations from database
for (const [id, json] of nationsDb) {
  nations.set(id, JSON.parse(json));
}
