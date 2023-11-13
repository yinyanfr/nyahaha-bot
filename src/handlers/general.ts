import { goToBed, hasUserSleptEnough, helpText } from '../features';
import { setUserData, setUserDataByUid } from '../services';
import { logger, pickLoveConfession, type MessageHandler } from './../lib';

export const loveHandler: MessageHandler = async (bot, info) => {
  const { chatId, message_id, uid, first_name, last_name } = info;

  try {
    await bot.sendSticker(chatId, pickLoveConfession(uid), {
      reply_to_message_id: message_id,
    });
    return logger.info(
      `Responded to ${uid} - ${first_name} ${last_name}'s love confession.`,
    );
  } catch (error) {
    await bot.sendMessage(chatId, (error as Error)?.message ?? '未知错误');
    return logger.error((error as Error)?.message ?? error);
  }
};

export const nightyHandler: MessageHandler = async (bot, info) => {
  const { chatId, message_id, uid, first_name, last_name } = info;

  try {
    await goToBed(`${uid}`);
    await bot.sendMessage(chatId, '晚安安', {
      reply_to_message_id: message_id,
    });
    return logger.info(
      `Responded to ${uid} - ${first_name} ${last_name}'s good night.`,
    );
  } catch (error) {
    await bot.sendMessage(chatId, (error as Error)?.message ?? '未知错误');
    return logger.error((error as Error)?.message ?? error);
  }
};

interface CallmeProps {
  newNickname: string;
}

export const callmeHandler: MessageHandler<CallmeProps> = async (
  bot,
  info,
  props,
) => {
  const { userdata, chatId, message_id, uid, first_name, last_name } = info;
  const { newNickname } = props ?? {};

  try {
    if (userdata.id) {
      await setUserData(userdata.id, { nickname: newNickname });
    } else {
      await setUserDataByUid(`${uid}`, { nickname: newNickname });
    }
    await bot.sendMessage(chatId, `好的，${newNickname}`, {
      reply_to_message_id: message_id,
    });
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has changed their nickname to ${newNickname}.`,
    );
  } catch (error) {
    await bot.sendMessage(chatId, (error as Error)?.message ?? '未知错误');
    return logger.error((error as Error)?.message ?? error);
  }
};

export const helpHandler: MessageHandler = async (bot, info) => {
  const { uid, first_name, last_name, chatId } = info;

  await bot.sendMessage(chatId, helpText);
  return logger.info(
    `${uid} - ${first_name} ${last_name ?? ''} consulted the help.`,
  );
};

export const morningHander: MessageHandler = async (bot, info) => {
  const { userdata, chatId, message_id, uid, first_name, last_name } = info;

  try {
    const getUp = await hasUserSleptEnough(userdata);
    if (getUp) {
      await bot.sendMessage(chatId, '早安安', {
        reply_to_message_id: message_id,
      });
      logger.info(`${uid} - ${first_name} ${last_name} has woken up.`);
    }
  } catch (error) {
    return logger.error((error as Error)?.message ?? error);
  }
};
