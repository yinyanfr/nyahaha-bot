import { cs2 } from '../../configs';
import Rcon from 'rcon-srcds';
import { AcceptedAlias, getAlias, MapPool, parseAlias } from './lib';
import { ERROR_CODE, logger, slowdownOver } from '../../lib';

const { host, port, password } = cs2;

const options = {
  host, // Host
  port, // Port
  maximumPacketSize: 0, // Maximum packet bytes (0 = no limit)
  encoding: 'ascii' as const, // Packet encoding (ascii, utf8)
  timeout: 1000, // in ms
};

const cs2Server = new Rcon(options);

const status = {
  connected: false,
  gameAlias: 'deathmatch',
  map: 'de_mirage',
  lastModified: new Date(),
};

export async function connect() {
  await cs2Server.authenticate(password);
  status.connected = true;
  logger.info('CS2 Rcon Connected');
  return status;
}

export async function getStatus() {
  if (!cs2Server.isAuthenticated()) {
    try {
      await connect();
    } catch {
      status.connected = false;
      return status;
    }
  }

  try {
    const statusJson = await cs2Server.execute('status_json');
    if (statusJson) {
      const statusData = JSON.parse(statusJson as string);
      const map = statusData?.server?.map;
      if (map) {
        status.map = map;
      }
    } else throw ERROR_CODE.OUT_OF_SERVICE;
    const rawAlias = await cs2Server.execute('game_alias');
    if (rawAlias) {
      const { type, mode } = parseAlias(rawAlias as string);
      const alias = getAlias(type, mode);
      if (alias) {
        status.gameAlias = alias;
      }
    } else throw ERROR_CODE.OUT_OF_SERVICE;
  } catch (error) {
    status.connected = false;
  }
  return status;
}

const Cooldown = process.env.NODE_ENV === 'development' ? 3 * 1000 : 30 * 1000;

export async function changeAliasOrMap(name: string) {
  let baseCommand;
  if (AcceptedAlias.includes(name)) {
    baseCommand = 'game_alias';
  } else if (MapPool.includes(name)) {
    baseCommand = 'map';
  } else {
    throw ERROR_CODE.INVALID_INPUT;
  }

  if (!cs2Server.isAuthenticated()) {
    try {
      await connect();
    } catch {
      status.connected = false;
      throw ERROR_CODE.OUT_OF_SERVICE;
    }
  }
  const now = new Date();
  if (!slowdownOver(now, status.lastModified, Cooldown)) {
    throw ERROR_CODE.SLOWDOWN;
  }

  console.log(`${baseCommand} ${name}`);
  await cs2Server.execute(`${baseCommand} ${name}`);
}
