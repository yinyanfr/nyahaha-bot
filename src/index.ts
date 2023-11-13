import {
  simulationHandler,
  rewardHandler,
  stoneHandler,
  handleUpdateExpense,
  addExpenseHandler,
  bookHandler,
  timezoneHandler,
  budgetHandler,
  loveHandler,
  nightyHandler,
  gachaHandler,
  singHandler,
  theaterHandler,
  callmeHandler,
  helpHandler,
  morningHander,
} from './handlers';
import {
  logger,
  parseArgs,
  pickSticker,
  type MessageInfo,
  CALLBACK_CODE,
} from './lib';
import TelegramBot from 'node-telegram-bot-api';
import { getUserDataByUid, registerObservers } from './services';
import { Converter } from 'opencc-js';
import configs from './configs';

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(relativeTime);

const botToken = configs.token;

registerObservers();

const convertCC = Converter({ from: 'hk', to: 'cn' });

if (!botToken) {
  logger.error('No token.');
  throw 'Please add your bot token to the env.';
}

const bot = new TelegramBot(botToken, { polling: true });
logger.info('Bot running.');

bot.on('message', async msg => {
  // console.log(msg);
  const { id: uid, first_name, last_name } = msg.from ?? {};
  const { id: chatId, type } = msg.chat ?? {};
  const { text = '', message_id } = msg ?? {};
  if (!uid) {
    return 0;
  }
  const userdata = await getUserDataByUid(`${uid}`);
  const nickname = userdata.nickname ?? '大哥哥';

  const info: MessageInfo = {
    userdata,
    nickname,
    uid,
    first_name,
    last_name,
    chatId,
    message_id,
  };

  await morningHander(bot, info);

  if (type === 'private' || text.match(/@nyahaha_bot/) || text.match(/^\//)) {
    const args = parseArgs(text.replace(/ *@nyahaha_bot */, ''));
    // console.log(args);

    try {
      if (args?.length) {
        if (convertCC(args[0]).match(/(唱歌|sing)/)) {
          const query = args[1]?.length ? convertCC(args[1]) : undefined;
          return await singHandler(bot, info, { query });
        }

        if (convertCC(args[0]).match(/(喜欢|love)/)) {
          return await loveHandler(bot, info);
        }

        if (convertCC(args[0]).match(/(晚安|nighty)/)) {
          return await nightyHandler(bot, info);
        }

        if (convertCC(args[0]).match(/(事务所|theater|theatre)/)) {
          return await theaterHandler(bot, info);
        }

        if (convertCC(args[0]).match(/(抽卡|gacha)/)) {
          return await gachaHandler(bot, info);
        }

        if (convertCC(args[0]).match(/试水/)) {
          return await simulationHandler(bot, info);
        }

        if (convertCC(args[0]).match(/(签到|reward)/)) {
          return await rewardHandler(bot, info);
        }

        if (convertCC(args[0]).match(/(石头|stone)/)) {
          return await stoneHandler(bot, info);
        }

        if (convertCC(args[0]).match(/叫我/)) {
          const newNickname = args[1] ?? '大哥哥';
          return await callmeHandler(bot, info, { newNickname });
        }

        if (convertCC(args[0]).match(/(时区|utc|gmt)/i)) {
          const timezone = args[1];
          return await timezoneHandler(bot, info, { timezone });
        }

        if (convertCC(args[0]).match(/(预算|budget)/i)) {
          const budget = args[1];
          return await budgetHandler(bot, info, { budget });
        }

        // addExpense
        if (convertCC(args[0]).match(/^-?[0-9]+(\.[0-9][0-9]?)?$/)) {
          const amount = parseFloat(args[0]);
          const category = args[1] ?? '默认';
          return await addExpenseHandler(bot, info, { amount, category });
        }

        if (convertCC(args[0]).match(/(账本|账簿|多少钱|钱包|book|expense)/)) {
          return await bookHandler(bot, info);
        }

        if (convertCC(args[0]).match(/(帮助|help|start)/)) {
          return await helpHandler(bot, info);
        }
      }

      await bot.sendSticker(chatId, pickSticker());
    } catch (error) {
      return logger.error((error as Error)?.message ?? error);
    }
  }
});

bot.on('edited_message', async msg => {
  const { id: uid, first_name, last_name } = msg.from ?? {};
  const { id: chatId, type } = msg.chat ?? {};
  const { text = '', message_id } = msg ?? {};
  if (!uid) {
    return 0;
  }
  const userdata = await getUserDataByUid(`${uid}`);
  const nickname = userdata.nickname ?? '大哥哥';

  try {
    if (
      (userdata.id && type === 'private') ||
      text.match(/@nyahaha_bot/) ||
      text.match(/^\//)
    ) {
      const args = parseArgs(text.replace(/ *@nyahaha_bot */, ''));

      const info: MessageInfo = {
        userdata,
        nickname,
        uid,
        first_name,
        last_name,
        chatId,
        message_id,
      };

      if (args?.length) {
        const amount = parseFloat(args[0]);
        const category = args[1] ?? '默认';
        return await handleUpdateExpense(bot, info, { amount, category });
      }
    }
  } catch (error) {
    return logger.error((error as Error)?.message ?? error);
  }
});

bot.on('callback_query', async msg => {
  const { id: uid, first_name, last_name } = msg.from ?? {};
  const { id: chatId } = msg.message?.chat ?? {};
  const { message_id } = msg.message?.reply_to_message ?? {};
  const senderUid = msg.message?.reply_to_message?.from?.id;
  if (!uid || !chatId || !message_id) {
    return 0;
  }
  const userdata = await getUserDataByUid(`${uid}`);
  const nickname = userdata.nickname ?? '大哥哥';

  const info: MessageInfo = {
    userdata,
    nickname,
    uid,
    first_name,
    last_name,
    chatId,
    message_id,
  };

  try {
    if (msg.data === CALLBACK_CODE.REMOVE_EXPENSE) {
      if (uid === senderUid) {
        await handleUpdateExpense(bot, info, { amount: 0 });
      } else {
        await bot.sendMessage(chatId, `${nickname}只能删除自己记录的支出`);
      }
    }
  } catch (error) {
    return logger.error((error as Error)?.message ?? error);
  }
});
