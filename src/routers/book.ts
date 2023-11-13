import { Router } from 'express';
import { findExpense, removeExpense, updateExpense } from '../services';

const app = Router();

app.put<API.ExpensePayload>('/expense', async (req, res) => {
  const { id, chatId, message_id, utc = 8, amount, category } = req.query;
  if (!id || !chatId || !message_id || !amount || !category) {
    return res.sendStatus(400);
  }
  try {
    const { expenses, expenseToChangeIndex } =
      (await findExpense(
        `${id}`,
        parseInt(`${chatId}`),
        parseInt(`${message_id}`),
        parseInt(`${utc}`),
      )) || {};
    if (!expenses || expenseToChangeIndex === undefined) {
      return res.sendStatus(404);
    }
    await updateExpense(
      `${id}`,
      expenses,
      expenseToChangeIndex,
      parseInt(`${amount}`),
      `${category}`,
    );
    return res.send();
  } catch (error) {
    return res.status(400).send(error);
  }
});

app.delete<API.ExpensePayload>('/expense', async (req, res) => {
  const { id, chatId, message_id, utc = 8 } = req.query;
  if (!id || !chatId || !message_id) {
    return res.sendStatus(400);
  }
  try {
    const { expenses, expenseToChangeIndex } =
      (await findExpense(
        `${id}`,
        parseInt(`${chatId}`),
        parseInt(`${message_id}`),
        parseInt(`${utc}`),
      )) || {};
    if (!expenses || expenseToChangeIndex === undefined) {
      return res.sendStatus(404);
    }
    await removeExpense(`${id}`, expenses, expenseToChangeIndex);
    return res.send();
  } catch (error) {
    return res.status(400).send(error);
  }
});

export default app;
