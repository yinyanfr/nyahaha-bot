import { formatSimpleBudget, logger, type MessageHandler } from '../lib';
import { findExpense, removeExpense, updateExpense } from '../services';

interface UpdateExpenseProps {
  amount: number;
  category?: string;
}

export const handleUpdateExpense: MessageHandler<UpdateExpenseProps> = async (
  bot,
  info,
  props,
) => {
  const { userdata, chatId, message_id, nickname, uid, first_name, last_name } =
    info;
  const { amount = 0, category = '默认' } = props ?? {};
  const existingExpenses = await findExpense(
    userdata.id,
    chatId,
    message_id,
    userdata.timezone,
  );

  if (existingExpenses) {
    const { expenses, expenseToChangeIndex } = existingExpenses;
    const expense = expenses[expenseToChangeIndex];
    try {
      if (amount === 0) {
        const updatedExpenses = await removeExpense(
          userdata.id,
          expenses,
          expenseToChangeIndex,
        );
        const formattedMsg = formatSimpleBudget(
          nickname,
          updatedExpenses,
          userdata.budget,
          userdata.timezone,
        );
        await bot.sendMessage(
          chatId,
          `已将${nickname}于${expense.localTime}记录的支出删除。\n${formattedMsg}`,
          {
            reply_to_message_id: message_id,
          },
        );
        return logger.info(
          `${uid} - ${first_name} ${
            last_name ?? ''
          } has deleted an expense of ${expense.localTime}.`,
        );
      } else {
        const updatedExpenses = await updateExpense(
          userdata.id,
          expenses,
          expenseToChangeIndex,
          amount,
          category,
        );
        const formattedMsg = formatSimpleBudget(
          nickname,
          updatedExpenses,
          userdata.budget,
          userdata.timezone,
        );
        await bot.sendMessage(
          chatId,
          `已将${nickname}于${expense.localTime}记录的支出修改为用于${category}的${amount}。\n${formattedMsg}`,
          {
            reply_to_message_id: message_id,
          },
        );
        return logger.info(
          `${uid} - ${first_name} ${
            last_name ?? ''
          } has modified an expense for ${category} of ${amount}.`,
        );
      }
    } catch (error) {
      await bot.sendMessage(chatId, (error as Error)?.message ?? '未知错误');
      return logger.error((error as Error)?.message ?? error);
    }
  }
};
