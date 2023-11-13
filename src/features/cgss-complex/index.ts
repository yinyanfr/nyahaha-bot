import dayjs from 'dayjs';
import {
  getGachaByUid,
  getUserDataByUid,
  setGacha,
  setUserData,
} from '../../services';
import { pickTenCards } from '../cgss-simple';
import { ERROR_CODE } from '../../lib';

function analyseGachaResults(results: CGSSGachaResult[]) {
  const ssr = results.filter(e => e.rarity === 'ssr').map(e => e.id);
  const sr = results.filter(e => e.rarity === 'sr').map(e => e.id);
  const r = results.filter(e => e.rarity === 'r').length;
  return {
    ssr,
    sr,
    r,
  };
}

async function saveGachaResult(uid: string, results: CGSSGachaResult[]) {
  const gacha = await getGachaByUid(uid);
  const { ssr, sr, r } = analyseGachaResults(results);
  await setGacha(gacha.id, {
    ssr: [...(gacha.ssr ?? []), ...ssr],
    sr: [...(gacha.sr ?? []), ...sr],
    r: (gacha.r ?? 0) + r,
    pieces: (gacha.pieces ?? 0) + r,
  });
}

export async function productionSummary(uid: string) {
  const { ssr = [], sr = [], r = 0 } = await getGachaByUid(uid);
  const total = ssr.length + sr.length + r;
  return {
    ssr: ssr.length,
    sr: sr.length,
    r,
    ssrPercentage: ssr.length / total || 0,
    srPercentage: sr.length / total || 0,
    rPercentage: r / total || 0,
    total,
  };
}

export async function drawComplex(uid: string) {
  const { balance, lastGachaDate, id } = await getUserDataByUid(`${uid}`);
  const now = dayjs().utcOffset(9);
  let newBalance = balance ?? 0;

  const freeGacha =
    !lastGachaDate ||
    (lastGachaDate && !now.isSame(dayjs(lastGachaDate).utcOffset(9), 'day'));
  if (!freeGacha && newBalance < 2500) {
    throw new Error(ERROR_CODE.NOT_ENOUGH_STONES);
  }
  const cards = await pickTenCards(id, 10 * 1000);
  await saveGachaResult(uid, await cards.results);
  if (freeGacha) {
    await setUserData(id, { lastGachaDate: now.toISOString() });
  } else {
    newBalance = balance - 2500;
    await setUserData(id, { balance: newBalance });
  }
  return {
    ...cards,
    freeGacha,
    newBalance,
  };
}
