import { logger, parseArgs } from './lib/index';
import TelegramBot from 'node-telegram-bot-api';
import { registerObservers } from './services';
import { Converter } from 'opencc-js';
import { Radio } from './features';

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
  const text = msg?.text ?? '';
  // console.log(msg);

  if (type === 'private' || text.match(/@nyahaha_bot/)) {
    const args = parseArgs(text.replace(/ *@nyahaha_bot */, ''));
    // console.log(args);

    if (args?.length) {
      if (id && convertCC(args[0]) === '唱歌') {
        try {
          const song = Radio.processRequest(`${id}`, args[1]);
          await bot.sendMessage(chatId, `${song.title}\n\n${song.link}`);
          logger.info(
            `Picked ${song.title} for ${id} - ${first_name} ${last_name}`,
          );
        } catch (error) {
          console.error(error);
          logger.error((error as Error)?.message ?? error);
          await bot.sendMessage(
            chatId,
            `唱歌请求有${Math.floor(
              Radio.slowdownTime / 1000,
            )}秒冷却时间，请稍候。`,
          );
        }
      }
    }
  }
});
