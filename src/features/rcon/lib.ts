const GameAlias = [
  ['casual', 'competitive', 'wingman'],
  ['armsrace', 'demolition', 'deathmatch'],
];

export function parseAlias(raw: string) {
  const match = raw.match(/game_type=([0-9]) *game_mode=([0-9])/);
  if (match) {
    return {
      type: parseInt(match[1]),
      mode: parseInt(match[2]),
    };
  }
  throw new Error('wrong format');
}

export function getAlias(type: number, mode: number) {
  return GameAlias[type][mode];
}

export const AcceptedAlias = [
  'casual',
  'competitive',
  'wingman',
  'armsrace',
  'deathmatch',
];

export const MapPool = [
  'de_ancient',
  'de_anubis',
  'de_dust2',
  'de_inferno',
  'de_mirage',
  'de_nuke',
  'de_overpass',
  'de_vertigo',
  'cs_office',
  'cs_italy',
  'cs_agency',
  'de_train',
  'ar_baggage',
  'ar_shoots',
];
