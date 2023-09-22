import { logger, toShuffled } from './../lib/index';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import serviceAccount from './firebase-credentials.json';
import { Radio } from '../features';

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();

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
