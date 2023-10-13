import dayjs from 'dayjs';
import { randint } from '../../lib';
import { getUserData, getUserByUid, setUserData } from '../../services';

export async function getDailyBonus(uid: string) {
  const user = await getUserByUid(uid);
  const { balance, lastBonusDate } = await getUserData(user.id);
  const now = dayjs();
  if (lastBonusDate) {
    if (now.isSame(dayjs(lastBonusDate), 'day')) {
      throw new Error('BONUS_ALREADY_GOT');
    }
  }
  const bonus = randint(5000, 10000);
  await setUserData(user.id, {
    balance: balance + bonus,
    lastBonusDate: now.toISOString(),
  });
  return bonus;
}
