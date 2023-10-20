import {
  logger,
  parseArgs,
  pickLoveConfession,
  pickSticker,
} from './lib/index';
import TelegramBot from 'node-telegram-bot-api';
import {
  getUserDataByUid,
  initializeData,
  registerObservers,
  setUserData,
  setUserDataByUid,
} from './services';
import { Converter } from 'opencc-js';
import { Radio, getDailyBonus, goToBed, hasUserSleptEnough } from './features';
import { pickTenCards } from './features/cgss-simple';
import configs from './configs';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';

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

// bot.onText(/@nyahaha_bot /g, msg => {
//   console.log(msg);
// });

initializeData().then(() => {
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
    // console.log(msg);

    if (type === 'private' || text.match(/@nyahaha_bot/) || getUp) {
      const args = parseArgs(text.replace(/ *@nyahaha_bot */, ''));
      // console.log(args);

      if (getUp) {
        await bot.sendMessage(chatId, '早安安', {
          reply_to_message_id: message_id,
        });
        return logger.info(`${uid} - ${first_name} ${last_name} has woken up.`);
      }

      if (args?.length) {
        if (convertCC(args[0]) === '唱歌') {
          try {
            const song = Radio.processRequest(`${uid}`, args[1]);
            await bot.sendMessage(chatId, `${song.title}\n\n${song.link}`);
            return logger.info(
              `Picked ${song.title} for ${uid} - ${first_name} ${last_name}`,
            );
          } catch (error) {
            if (error === 'Slowdown') {
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

        if (convertCC(args[0]).match(/喜欢/)) {
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

        if (convertCC(args[0]).match(/晚安/)) {
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

        if (convertCC(args[0]).match(/抽卡/)) {
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
              `${uid} - ${first_name} ${last_name ?? ''} drawed 10 cards.`,
            );
          } catch (error) {
            console.error(error);
            if (error === 'Slowdown') {
              await bot.sendMessage(chatId, `抽卡请求有60秒冷却时间，请稍候。`);
            } else {
              await bot.sendMessage(
                chatId,
                (error as Error)?.message ?? '未知错误',
              );
            }
            return logger.error((error as Error)?.message ?? error);
          }
        }

        if (convertCC(args[0]).match(/签到/)) {
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
            const errorMessage =
              (error as Error)?.message ?? error ?? '未知错误';
            let message = errorMessage;
            if (errorMessage === 'USER_NOT_FOUND') {
              message = `${nickname}尚未注册，请点击一下链接注册：https://bot.yinyan.fr/login`;
            }
            if (errorMessage === 'BONUS_ALREADY_GOT') {
              message = `${nickname}今天已经签过到了（签到时间以东九区计算日期）`;
            }

            await bot.sendMessage(chatId, message, {
              reply_to_message_id: message_id,
            });
            return logger.error((error as Error)?.message ?? error);
          }
        }

        if (convertCC(args[0]).match(/石头/)) {
          try {
            const balance = userdata.balance ?? 0;
            await bot.sendMessage(chatId, `${nickname}有${balance}块石头！`, {
              reply_to_message_id: message_id,
            });
            return logger.info(
              `${uid} - ${first_name} ${
                last_name ?? ''
              } checked their balance.`,
            );
          } catch (error) {
            const errorMessage =
              (error as Error)?.message ?? error ?? '未知错误';
            let message = errorMessage;
            if (errorMessage === 'USER_NOT_FOUND') {
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
            return logger.error((error as Error)?.message ?? error);
          }
        }
      }

      await bot.sendSticker(chatId, pickSticker());
    }
  });
});
