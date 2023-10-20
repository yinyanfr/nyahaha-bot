import serviceAccount from './firebase-credentials.json';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();

async function removeRedundantData() {
  const userSnapshots = await db.collection('users').get();
  const users: User[] = [];
  userSnapshots.forEach(e => {
    users.push({ ...(e.data() as User), id: e.id });
  });
  const userdataSnapshots = await db.collection('userdata').get();
  const userdata: UserData[] = [];
  userdataSnapshots.forEach(e => {
    userdata.push({ ...(e.data() as UserData), id: e.id });
  });

  const redundantUsers = users.filter(e => !e.hash);
  const redundantUserData = userdata.filter(e => !e.balance);

  const deteteUsersWorker = redundantUsers.map(e =>
    db.collection('users').doc(e.id).delete(),
  );
  const deteteUserDataWorker = redundantUserData.map(e =>
    db.collection('userdata').doc(e.id).delete(),
  );

  await Promise.all(deteteUsersWorker);
  console.log('Redundant users deleted');
  await Promise.all(deteteUserDataWorker);
  console.log('Redundant userdata deleted');
}

removeRedundantData().catch(err => {
  console.error(err);
});
