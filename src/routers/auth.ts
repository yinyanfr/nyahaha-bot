import { Router } from 'express';
import { verifyTGLogin } from '../lib/hash';
import { getUserByToken, getUserByUid, updateUser } from '../services';

const app = Router();

app.post('/login', async (req, res) => {
  const uid = req.body?.id;
  if (!uid) {
    return res.status(401).send();
  }
  const isVerified = verifyTGLogin(req.body);
  if (!isVerified) {
    return res.status(403).send();
  }
  const user = await getUserByUid(uid);
  await updateUser(user.id, req.body);
  return res.send({ ...req.body, id: user.id });
});

app.get('/me', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).send();
  }
  const user = await getUserByToken(token);
  if (!user) {
    return res.status(403).send();
  }
  return res.send(user);
});

export default app;
