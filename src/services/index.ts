import { logger, toShuffled } from './../lib/index';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import axios from 'axios';

import serviceAccount from './firebase-credentials.json';
import { Radio } from '../features';

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
  storageBucket: 'gs://nyahaha-bot.appspot.com',
});

const db = getFirestore();
const bucket = getStorage().bucket();

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
