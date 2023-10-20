import dayjs from 'dayjs';
import { setUserData, setUserDataByUid } from '../../services';
import { FieldValue } from 'firebase-admin/firestore';

export async function goToBed(uid: string) {
  const now = new Date().toISOString();
  await setUserDataByUid(uid, { sleepDate: now });
}

export async function hasUserSleptEnough(userdata: UserData) {
  const { sleepDate } = userdata;
  if (sleepDate && Math.abs(dayjs(dayjs()).diff(sleepDate, 'hour')) >= 6) {
    await setUserData(userdata.id, { sleepDate: FieldValue.delete() as any });
    return true;
  }
  return false;
}
