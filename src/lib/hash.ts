import hmacSHA256 from 'crypto-js/hmac-sha256';
import sha256 from 'crypto-js/sha256';
import Hex from 'crypto-js/enc-hex';
import configs from '../configs';

function sortQueryAlphabetically(query: LoginQuery) {
  const keys = Object.keys(query).filter(e => e !== 'hash');
  keys.sort((a, b) => a[0].localeCompare(b[0]));
  const splitter = '\n';
  const sortedString = keys
    .map(e => `${e}=${query[e as keyof LoginQuery]}`)
    .join(splitter);
  return sortedString;
}

function calculateTGLoginHash(query: LoginQuery) {
  const sortedString = sortQueryAlphabetically(query);
  if (!configs.token) {
    throw new Error('NO_BOT_TOKEN');
  }
  const bytes = hmacSHA256(sortedString, sha256(configs.token));
  return bytes.toString(Hex);
}

export function verifyTGLogin(query?: LoginQuery) {
  if (!query) {
    throw new Error('INVALID_LOGIN_QUERY');
  }
  return query.hash === calculateTGLoginHash(query);
}
