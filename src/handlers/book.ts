import {
  CALLBACK_CODE,
  ERROR_CODE,
  formatComplexBudget,
  formatSimpleBudget,
  getLocalTime,
  logger,
  type MessageHandler,
} from '../lib';
import {
  addExpense,
  findExpense,
  getDocumentId,
  getMonthlyExpenses,
  removeExpense,
  setUserData,
  setUserDataByUid,
  updateExpense,
} from '../services';

interface ExpenseProps {
  amount: number;
  category?: string;
}

export const handleUpdateExpense: MessageHandler<ExpenseProps> = async (
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
  } else {
    await bot.sendMessage(
      chatId,
      `未找到这笔支出，${nickname}可能已经将其删除。`,
      { reply_to_message_id: message_id },
    );
  }
};

export const addExpenseHandler: MessageHandler<ExpenseProps> = async (
  bot,
  info,
  props,
) => {
  const { userdata, chatId, message_id, nickname, uid, first_name, last_name } =
    info;
  const { amount, category = '默认' } = props ?? {};

  try {
    const { timezone, budget } = userdata;
    const localTime = getLocalTime(timezone ?? 8);

    if (!amount) {
      throw new Error(ERROR_CODE.INVALID_INPUT);
    }

    const expenses = await addExpense(userdata.id, {
      chatId,
      message_id,
      amount,
      category,
      localTime,
    });

    await bot.sendMessage(
      chatId,
      `${nickname}于${localTime.format()}计入了用于${category}的${amount}的花销。\n${formatSimpleBudget(
        nickname,
        expenses,
        budget,
        userdata.timezone,
      )}`,
      {
        reply_to_message_id: message_id,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '删除',
                callback_data: CALLBACK_CODE.REMOVE_EXPENSE,
              },
            ],
          ],
          selective: true,
          one_time_keyboard: true,
        },
      },
    );
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has added an expense for ${category} of ${amount}.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.INVALID_INPUT) {
      message = `0 仅用于删除已经记录的支出记录。`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};

export const bookHandler: MessageHandler = async (bot, info) => {
  const { userdata, chatId, message_id, nickname, uid, first_name, last_name } =
    info;

  try {
    const id = await getDocumentId(uid);
    const expenses = await getMonthlyExpenses(id);
    const simple = formatSimpleBudget(
      nickname,
      expenses,
      userdata?.budget,
      userdata.timezone,
    );
    const complex = formatComplexBudget(nickname, expenses);
    await bot.sendMessage(chatId, `${simple}\n其中各项花费如下：\n${complex}`, {
      reply_to_message_id: message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '查看详细',
              url: 'https://bot.yinyan.fr/book',
            },
          ],
        ],
      },
    });
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has consulted their monthly expenses.`,
    );
  } catch (error) {
    await bot.sendMessage(chatId, (error as Error)?.message ?? '未知错误');
    return logger.error((error as Error)?.message ?? error);
  }
};

interface TimezoneProps {
  timezone: string;
}

export const timezoneHandler: MessageHandler<TimezoneProps> = async (
  bot,
  info,
  props,
) => {
  const { userdata, chatId, message_id, nickname, uid, first_name, last_name } =
    info;
  const { timezone } = props ?? {};
  try {
    if (!timezone?.match(/^[+-]?[0-9][0-9]?$/)) {
      throw new Error(ERROR_CODE.INVALID_INPUT);
    }
    if (userdata.id) {
      await setUserData(userdata.id, { timezone: parseInt(timezone) });
    } else {
      await setUserDataByUid(`${uid}`, { timezone: parseInt(timezone) });
    }
    await bot.sendMessage(
      chatId,
      `已将${nickname}的时区设定为 UTC${timezone}。`,
      {
        reply_to_message_id: message_id,
      },
    );
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has changed their timezone to ${timezone}.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.INVALID_INPUT) {
      message = `请以 +-数字 的格式输入时区，如 +8，-6`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};

interface BudgetProps {
  budget: string;
}

export const budgetHandler: MessageHandler<BudgetProps> = async (
  bot,
  info,
  props,
) => {
  const { userdata, chatId, message_id, nickname, uid, first_name, last_name } =
    info;
  const { budget } = props ?? {};

  try {
    if (!budget?.match(/^[0-9]+$/)) {
      throw new Error(ERROR_CODE.INVALID_INPUT);
    }
    if (userdata.id) {
      await setUserData(userdata.id, { budget: parseFloat(budget) });
    } else {
      await setUserDataByUid(`${uid}`, { budget: parseFloat(budget) });
    }
    let formattedMsg = '';
    if (userdata.id) {
      const expenses = await getMonthlyExpenses(userdata.id);
      formattedMsg = formatSimpleBudget(
        nickname,
        expenses,
        parseFloat(budget),
        userdata.timezone,
      );
    }
    await bot.sendMessage(
      chatId,
      `已将${nickname}的每月预算设定为 ${budget}。\n${formattedMsg}`,
      {
        reply_to_message_id: message_id,
      },
    );
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has changed their monthly budget to ${budget}.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.INVALID_INPUT) {
      message = `请输入一个正整数作为预算的金额。`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};
