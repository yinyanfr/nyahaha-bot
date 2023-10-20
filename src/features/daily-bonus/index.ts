import dayjs from 'dayjs';
import { ERROR_CODE, randint } from '../../lib';
import { getUserDataByUid, setUserDataByUid } from '../../services';

export async function getDailyBonus(uid: string) {
  const { balance, lastBonusDate } = await getUserDataByUid(uid);
  const now = dayjs().utcOffset(9);
  if (lastBonusDate) {
    if (now.isSame(dayjs(lastBonusDate).utcOffset(9), 'day')) {
      throw new Error(ERROR_CODE.BONUS_ALREADY_GOT);
    }
  }
  const bonus = randint(5000, 10000);
  await setUserDataByUid(uid, {
    balance: (balance ?? 0) + bonus,
    lastBonusDate: now.toISOString(),
  });
  return bonus;
}
