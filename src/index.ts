import { helpText } from './features/help/index';
import {
  ERROR_CODE,
  logger,
  parseArgs,
  pickLoveConfession,
  pickSticker,
} from './lib/index';
import TelegramBot from 'node-telegram-bot-api';
import {
  getUserDataByUid,
  registerObservers,
  setUserData,
  setUserDataByUid,
} from './services';
import { Converter } from 'opencc-js';
import {
  Radio,
  drawComplex,
  getDailyBonus,
  goToBed,
  hasUserSleptEnough,
  productionSummary,
} from './features';
import { pickTenCards } from './features/cgss-simple';
import configs from './configs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(relativeTime);

const YoutubeUrlPrefix = 'https://www.youtube.com/watch?v=';

const botToken = configs.token;

registerObservers();

const convertCC = Converter({ from: 'hk', to: 'cn' });

if (!botToken) {
  logger.error('No token.');
  throw 'Please add your bot token to the env.';
}

const bot = new TelegramBot(botToken, { polling: true });
logger.info('Bot running.');

// bot.onText(/@nyahaha_bot /g, msg => {
//   console.log(msg);
// });

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
  const getUp = await hasUserSleptEnough(userdata);
  if (getUp) {
    await bot.sendMessage(chatId, '早安安', {
      reply_to_message_id: message_id,
    });
    logger.info(`${uid} - ${first_name} ${last_name} has woken up.`);
  }
  // console.log(msg);

  if (type === 'private' || text.match(/@nyahaha_bot/) || text.match(/^\//)) {
    const args = parseArgs(text.replace(/ *@nyahaha_bot */, ''));
    // console.log(args);

    if (args?.length) {
      if (convertCC(args[0]).match(/(唱歌|sing)/)) {
        try {
          const song = Radio.processRequest(`${uid}`, args[1]);
          await bot.sendMessage(
            chatId,
            `${song.title}\n\n${YoutubeUrlPrefix}${song.youtubeId}`,
          );
          return logger.info(
            `Picked ${song.title} for ${uid} - ${first_name} ${last_name}`,
          );
        } catch (error) {
          if (error === ERROR_CODE.SLOWDOWN) {
            await bot.sendMessage(
              chatId,
              `唱歌请求有${Math.floor(
                Radio.slowdownTime / 1000,
              )}秒冷却时间，请稍候。`,
            );
          } else {
            await bot.sendMessage(
              chatId,
              (error as Error)?.message ?? '未知错误',
            );
          }
          return logger.error((error as Error)?.message ?? error);
        }
      }

      if (convertCC(args[0]).match(/(喜欢|love)/)) {
        try {
          await bot.sendSticker(chatId, pickLoveConfession(uid), {
            reply_to_message_id: message_id,
          });
          return logger.info(
            `Responded to ${uid} - ${first_name} ${last_name}'s love confession.`,
          );
        } catch (error) {
          await bot.sendMessage(
            chatId,
            (error as Error)?.message ?? '未知错误',
          );
          return logger.error((error as Error)?.message ?? error);
        }
      }

      if (convertCC(args[0]).match(/(晚安|nighty)/)) {
        try {
          await goToBed(`${uid}`);
          await bot.sendMessage(chatId, '晚安安', {
            reply_to_message_id: message_id,
          });
          return logger.info(
            `Responded to ${uid} - ${first_name} ${last_name}'s good night.`,
          );
        } catch (error) {
          await bot.sendMessage(
            chatId,
            (error as Error)?.message ?? '未知错误',
          );
          return logger.error((error as Error)?.message ?? error);
        }
      }

      if (convertCC(args[0]).match(/(事务所|theater|theatre)/)) {
        try {
          const production = await productionSummary(`${uid}`);
          const summary = (
            ['ssr', 'sr', 'r'] as (keyof typeof production)[]
          ).map(
            e =>
              `${e}: ${production[e]}次 (${(
                production[`${e}Percentage` as keyof typeof production] * 100
              ).toFixed(2)}%)`,
          );
          await bot.sendMessage(
            chatId,
            `${nickname}共抽了${production.total}次，其中${summary.join('，')}`,
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
          await bot.sendMessage(
            chatId,
            (error as Error)?.message ?? '未知错误',
          );
          return logger.error((error as Error)?.message ?? error);
        }
      }

      if (convertCC(args[0]).match(/(抽卡|gacha)/)) {
        try {
          const result = await drawComplex(`${uid}`);
          const { results, imageUrl, freeGacha, newBalance } = result;
          const cardList = results.map(
            ({ rarity, title, name_only }) =>
              `${rarity.toLocaleUpperCase()} ${
                title ? `[${title}]` : ''
              } ${name_only}`,
          );
          await bot.sendPhoto(chatId, imageUrl, {
            reply_to_message_id: message_id,
            caption: `${nickname}抽到了：\n${cardList.join('\n')}\n${
              freeGacha
                ? `这是${nickname}今天的首次免费抽卡`
                : `${nickname}消耗了2500石头，还剩${newBalance}石头`
            }`,
          });
          return logger.info(
            `${uid} - ${first_name} ${last_name ?? ''} drawed 10 cards.`,
          );
        } catch (error) {
          const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
          let message = errorMessage;
          if (errorMessage === ERROR_CODE.SLOWDOWN) {
            message = `抽卡请求有15秒冷却时间，请稍候。`;
          } else if (errorMessage === ERROR_CODE.NOT_ENOUGH_STONES) {
            message = `${nickname}没有足够的石头了。`;
          }
          await bot.sendMessage(chatId, message ?? '未知错误', {
            reply_to_message_id: message_id,
          });
          return logger.error(errorMessage);
        }
      }

      if (convertCC(args[0]).match(/试水/)) {
        try {
          const result = await pickTenCards(`${uid}`);
          const { results, imageUrl } = result;
          const cardList = results.map(
            ({ rarity, title, name_only }) =>
              `${rarity.toLocaleUpperCase()} ${
                title ? `[${title}]` : ''
              } ${name_only}`,
          );
          await bot.sendPhoto(chatId, imageUrl, {
            reply_to_message_id: message_id,
            caption: `${nickname}抽到了：\n${cardList.join('\n')}`,
          });
          return logger.info(
            `${uid} - ${first_name} ${
              last_name ?? ''
            } casually drawed 10 cards.`,
          );
        } catch (error) {
          if (error === ERROR_CODE.SLOWDOWN) {
            await bot.sendMessage(chatId, `抽卡请求有60秒冷却时间，请稍候。`, {
              reply_to_message_id: message_id,
            });
          } else {
            await bot.sendMessage(
              chatId,
              (error as Error)?.message ?? '未知错误',
            );
          }
          return logger.error((error as Error)?.message ?? error);
        }
      }

      if (convertCC(args[0]).match(/(签到|reward)/)) {
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
      }

      if (convertCC(args[0]).match(/(石头|stone)/)) {
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
      }

      if (convertCC(args[0]).match(/叫我/)) {
        const newNickname = args[1] ?? '大哥哥';
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
          await bot.sendMessage(
            chatId,
            (error as Error)?.message ?? '未知错误',
          );
          return logger.error((error as Error)?.message ?? error);
        }
      }

      if (convertCC(args[0]).match(/(帮助|help|start)/)) {
        await bot.sendMessage(chatId, helpText);
        return logger.info(
          `${uid} - ${first_name} ${last_name ?? ''} consulted the help.`,
        );
      }
    }

    await bot.sendSticker(chatId, pickSticker());
  }
});
