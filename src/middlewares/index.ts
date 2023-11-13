import { type RequestHandler } from 'express';
import { getUserByToken } from '../services';

export const authByHash: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.sendStatus(401);
  }
  const user = await getUserByToken(token);
  if (!user) {
    return res.sendStatus(403);
  }
  req.user = user;
  next();
};
