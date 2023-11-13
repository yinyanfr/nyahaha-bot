import { type InputMedia } from 'node-telegram-bot-api';
import {
  drawComplex,
  productionSummary,
  pickTenCards,
  getDailyBonus,
} from '../features';
import { ERROR_CODE, logger, type MessageHandler } from '../lib';

export const theaterHandler: MessageHandler = async (bot, info) => {
  const { chatId, message_id, nickname, uid, first_name, last_name } = info;

  try {
    const production = await productionSummary(`${uid}`);
    const summary = (['ssr', 'sr', 'r'] as (keyof typeof production)[]).map(
      e =>
        `${e}: ${production[e]}次 (${(
          production[`${e}Percentage` as keyof typeof production] * 100
        ).toFixed(2)}%)`,
    );
    await bot.sendMessage(
      chatId,
      `${nickname}共抽了${production.total}次，其中${summary.join(
        '，',
      )}\n${nickname}有${production.pieces}个星星碎片。`,
      {
        reply_to_message_id: message_id,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '查看详细',
                url: 'https://bot.yinyan.fr/user',
              },
            ],
          ],
        },
      },
    );
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } checked their production summary.`,
    );
  } catch (error) {
    await bot.sendMessage(chatId, (error as Error)?.message ?? '未知错误');
    return logger.error((error as Error)?.message ?? error);
  }
};

export const gachaHandler: MessageHandler = async (bot, info) => {
  const { chatId, message_id, nickname, uid, first_name, last_name } = info;
  try {
    const result = await drawComplex(`${uid}`);
    const { results, cardImageUrls, freeGacha, newBalance } = result;
    const cardList = results.map(
      ({ rarity, title, name_only }) =>
        `${rarity.toLocaleUpperCase()} ${
          title ? `[${title}]` : ''
        } ${name_only}`,
    );
    if (cardImageUrls.length > 1) {
      const inputMedia: InputMedia[] = cardImageUrls.map((e, index) => ({
        type: 'photo',
        media: e,
        caption:
          index === 0
            ? `${nickname}抽到了：\n${cardList.join('\n')}\n\n${
                freeGacha
                  ? `这是${nickname}今天的首次免费抽卡`
                  : `${nickname}消耗了2500石头，还剩${newBalance}石头`
              }`
            : undefined,
      }));
      await bot.sendMediaGroup(chatId, inputMedia, {
        reply_to_message_id: message_id,
      });
    } else {
      await bot.sendPhoto(chatId, cardImageUrls[0], {
        reply_to_message_id: message_id,
        caption: `${nickname}抽到了：\n${cardList.join('\n')}\n\n${
          freeGacha
            ? `这是${nickname}今天的首次免费抽卡`
            : `${nickname}消耗了2500石头，还剩${newBalance}石头`
        }`,
      });
    }
    return logger.info(
      `${uid} - ${first_name} ${last_name ?? ''} drawed 10 cards.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.SLOWDOWN) {
      message = `抽卡请求有10秒冷却时间，请稍候。`;
    } else if (errorMessage === ERROR_CODE.NOT_ENOUGH_STONES) {
      message = `${nickname}没有足够的石头了。`;
    }
    await bot.sendMessage(chatId, message ?? '未知错误', {
      reply_to_message_id: message_id,
    });
    return logger.error(errorMessage);
  }
};

export const simulationHandler: MessageHandler = async (bot, info) => {
  const { chatId, message_id, nickname, uid, first_name, last_name } = info;

  try {
    const result = await pickTenCards(`${uid}`);
    const { results, cardImageUrls } = result;
    const cardList = results.map(
      ({ rarity, title, name_only }) =>
        `${rarity.toLocaleUpperCase()} ${
          title ? `[${title}]` : ''
        } ${name_only}`,
    );
    if (cardImageUrls.length > 1) {
      const inputMedia: InputMedia[] = cardImageUrls.map((e, index) => ({
        type: 'photo',
        media: e,
        caption:
          index === 0
            ? `${nickname}抽到了：\n${cardList.join('\n')}`
            : undefined,
      }));
      await bot.sendMediaGroup(chatId, inputMedia, {
        reply_to_message_id: message_id,
      });
    } else {
      await bot.sendPhoto(chatId, cardImageUrls[0], {
        reply_to_message_id: message_id,
        caption: `${nickname}抽到了：\n${cardList.join('\n')}`,
      });
    }
    return logger.info(
      `${uid} - ${first_name} ${last_name ?? ''} casually drawed 10 cards.`,
    );
  } catch (error) {
    if (error === ERROR_CODE.SLOWDOWN) {
      await bot.sendMessage(chatId, `抽卡请求有60秒冷却时间，请稍候。`, {
        reply_to_message_id: message_id,
      });
    } else {
      await bot.sendMessage(chatId, (error as Error)?.message ?? '未知错误');
    }
    return logger.error((error as Error)?.message ?? error);
  }
};

export const rewardHandler: MessageHandler = async (bot, info) => {
  const { chatId, message_id, nickname, uid, first_name, last_name } = info;

  try {
    const bonus = await getDailyBonus(`${uid}`);
    await bot.sendMessage(
      chatId,
      `签到成功！${nickname}今天获得了${bonus}块石头！`,
      {
        reply_to_message_id: message_id,
      },
    );
    return logger.info(
      `${uid} - ${first_name} ${last_name ?? ''} got daily bonus.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.USER_NOT_FOUND) {
      message = `${nickname}尚未注册，请点击一下链接注册：https://bot.yinyan.fr/login`;
    }
    if (errorMessage === ERROR_CODE.BONUS_ALREADY_GOT) {
      message = `${nickname}今天已经签过到了（签到时间以东九区计算日期）`;
    }

    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};

export const stoneHandler: MessageHandler = async (bot, info) => {
  const { userdata, chatId, message_id, nickname, uid, first_name, last_name } =
    info;

  try {
    const balance = userdata.balance ?? 0;
    await bot.sendMessage(chatId, `${nickname}有${balance}块石头！`, {
      reply_to_message_id: message_id,
    });
    return logger.info(
      `${uid} - ${first_name} ${last_name ?? ''} checked their balance.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.USER_NOT_FOUND) {
      message = `${nickname}尚未注册，请点击一下链接注册：https://bot.yinyan.fr/login`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};
