import serviceAccount from '../services/firebase-credentials.json';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();

async function writeYoutubeIds() {
  const songsSnapshot = await db.collection('songs').get();
  const songs: Partial<Song>[] = [];
  songsSnapshot.forEach(e => {
    songs.push({ id: e.id, ...e.data() } as Song);
  });
  // https://www.youtube.com/watch?v=fmvhvxG69Xk
  for (const song of songs) {
    const idMatch = song.link?.match(/watch\?v=(.+)$/);
    if (idMatch) {
      const youtubeId = idMatch[1];
      if (!youtubeId) {
        console.log(song);
      } else {
        await db
          .collection('songs')
          .doc(song.id as string)
          .set({ youtubeId }, { merge: true });
      }
    }
  }
}

writeYoutubeIds();
