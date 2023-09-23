import {
  logger,
  parseArgs,
  pickLoveConfession,
  pickSticker,
} from './lib/index';
import TelegramBot from 'node-telegram-bot-api';
import { getCachedCard, registerObservers } from './services';
import { Converter } from 'opencc-js';
import { Radio } from './features';
import { pickTenCards } from './features/cgss-simple';

registerObservers();

const convertCC = Converter({ from: 'hk', to: 'cn' });

const botToken = process.env.TG_BOT_TOKEN;

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
  const { id, first_name, last_name } = msg.from ?? {};
  const { id: chatId, type } = msg.chat ?? {};
  const { text = '', message_id } = msg ?? {};
  // console.log(msg);

  if (type === 'private' || text.match(/@nyahaha_bot/)) {
    const args = parseArgs(text.replace(/ *@nyahaha_bot */, ''));
    // console.log(args);

    if (args?.length) {
      if (id && convertCC(args[0]) === '唱歌') {
        try {
          const song = Radio.processRequest(`${id}`, args[1]);
          await bot.sendMessage(chatId, `${song.title}\n\n${song.link}`);
          return logger.info(
            `Picked ${song.title} for ${id} - ${first_name} ${last_name}`,
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

      if (id && convertCC(args[0]).match(/喜欢/)) {
        try {
          await bot.sendSticker(chatId, pickLoveConfession(id), {
            reply_to_message_id: message_id,
          });
          return logger.info(
            `Responded to ${id} - ${first_name} ${last_name}'s love confession.`,
          );
        } catch (error) {
          await bot.sendMessage(
            chatId,
            (error as Error)?.message ?? '未知错误',
          );
          return logger.error((error as Error)?.message ?? error);
        }
      }

      if (id && convertCC(args[0]).match(/晚安/)) {
        try {
          await bot.sendMessage(chatId, '晚安安', {
            reply_to_message_id: message_id,
          });
          return logger.info(
            `Responded to ${id} - ${first_name} ${last_name}'s good night.`,
          );
        } catch (error) {
          await bot.sendMessage(
            chatId,
            (error as Error)?.message ?? '未知错误',
          );
          return logger.error((error as Error)?.message ?? error);
        }
      }

      if (id && convertCC(args[0]) === '抽卡') {
        try {
          const card = await pickTenCards(`${id}`);
          const { id: cardId, title, name_only, card_image_ref, rarity } = card;
          await bot.sendPhoto(chatId, card_image_ref, {
            reply_to_message_id: message_id,
            caption: `大哥哥抽到了 ${rarity.toLocaleUpperCase()} ${
              title ? `[${title}]` : ''
            } ${name_only}`,
          });
          return logger.info(
            `${id} - ${first_name} ${last_name} drawed ${cardId}.`,
          );
        } catch (error) {
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
    }

    await bot.sendSticker(chatId, pickSticker());
  }
});

getCachedCard(100075);
