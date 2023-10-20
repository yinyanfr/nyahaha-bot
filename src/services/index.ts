import { ERROR_CODE, logger, toShuffled } from './../lib/index';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import axios from 'axios';

import serviceAccount from './firebase-credentials.json';
import { Radio } from '../features';
// import configs from '../configs';

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  storageBucket: 'gs://nyahaha-bot.appspot.com',
});

const db = getFirestore();
const bucket = getStorage().bucket();

export class Data {
  static users: User[] = [];
  static userdata: UserData[] = [];
}

async function retriveUsers() {
  const userSnapshots = await db.collection('users').get();
  const users: User[] = [];
  userSnapshots.forEach(e => {
    users.push({ ...(e.data() as User), id: e.id });
  });
  Data.users = users;
}

async function retriveUserData() {
  const userdataSnapshots = await db.collection('userdata').get();
  const userdata: UserData[] = [];
  userdataSnapshots.forEach(e => {
    userdata.push({ ...(e.data() as UserData), id: e.id });
  });
  Data.userdata = userdata;
}

export async function initializeData() {
  await retriveUsers();
  await retriveUserData();
}

export function registerObservers() {
  // Songlist Observer
  db.collection('songs').onSnapshot(
    snapshots => {
      const songlist: Song[] = [];
      snapshots.forEach(e => {
        songlist.push(e.data() as Song);
      });
      Radio.Songlist = toShuffled(songlist) as Song[];
      logger.info(`Song list updated, new length: ${Radio.Songlist.length}`);
    },
    error => {
      logger.error(error);
    },
  );

  db.collection('userdata').onSnapshot(snapshots => {
    const userdata: UserData[] = [];
    snapshots.forEach(e => {
      userdata.push({ ...(e.data() as UserData), id: e.id });
    });
    Data.userdata = userdata;
    logger.info(`Loaded ${Data.userdata.length} userdata`);
  });

  db.collection('users').onSnapshot(snapshots => {
    const users: User[] = [];
    snapshots.forEach(e => {
      users.push({ ...(e.data() as User), id: e.id });
    });
    Data.users = users;
    logger.info(`Loaded ${Data.users.length} users`);
  });
}

export async function addSong(song: Song) {
  const doc = await db.collection('songs').add(song);
  return doc.id;
}

export async function getCachedCard(id: number | string) {
  if (!id) {
    throw 'No Card ID';
  }

  const docRef = db.collection('cgss-cards').doc(`${id}`);
  const doc = await docRef.get();
  if (doc.exists) {
    return doc.data();
  }
  const res = await axios.get(`http://starlight.kirara.ca/api/v1/card_t/${id}`);
  const card = res.data?.result?.[0];
  if (card) {
    await docRef.set(card);
    return card;
  }
  throw 'Card Not Found';
}

export async function getImageUrl(link: string, ref: string) {
  const imageRef = bucket.file(ref);
  const exist = await imageRef.exists();
  if (!exist?.[0]) {
    const imageBuffer = await axios.get(link, { responseType: 'arraybuffer' });
    await imageRef.save(Buffer.from(imageBuffer.data, 'binary'));
  }
  return await getDownloadURL(imageRef);
}

export async function deferredImageBuffers(imageUrls: string[]) {
  const req = imageUrls.map(url =>
    axios.get(url, { responseType: 'arraybuffer' }),
  );
  const results = await Promise.all(req);
  return results.map(e => Buffer.from(e.data, 'binary'));
}

export async function getUserByUid(uid: string) {
  const user = Data.users.find(e => e.uid === uid);
  if (!user) {
    const id = await addUser(uid);
    return { id, uid };
  }
  return user;
}

async function addUser(uid: string) {
  const res = await db.collection('users').add({ uid });
  return res.id;
}

export async function getUserDataByUid(uid?: string) {
  if (!uid) {
    throw new Error(ERROR_CODE.INVALID_USER_ID);
  }
  const { id } = await getUserByUid(uid);
  const userdata = Data.userdata.find(e => e.id === id);
  if (!userdata) {
    const data = {
      balance: 0,
    };
    setUserData(id, data);
    return data as UserData;
  }
  return userdata;
}

export async function setUserData(id: string, payload: Partial<UserData>) {
  await db.collection('userdata').doc(id).set(payload, { merge: true });
}

export async function setUserDataByUid(
  uid: string,
  payload: Partial<UserData>,
) {
  const { id } = await getUserByUid(uid);
  return setUserData(id, payload);
}

export async function getGachaByUid(uid?: string) {
  if (!uid) {
    throw new Error(ERROR_CODE.INVALID_USER_ID);
  }
  const { id } = await getUserByUid(uid);
  const gacha = await db.collection('gacha').doc(id).get();
  if (gacha.exists) {
    return { ...(gacha.data() as GachaPayload), id: gacha.id };
  }
  const newGacha = {
    ssr: [],
    sr: [],
    r: 0,
    pieces: 0,
  };
  await setGacha(id, newGacha);
  return { ...newGacha, id };
}

interface GachaPayload {
  ssr: number[];
  sr: number[];
  r: number;
  pieces: number;
}

export async function setGacha(id: string, payload: Partial<GachaPayload>) {
  await db.collection('gacha').doc(id).set(payload, { merge: true });
}
