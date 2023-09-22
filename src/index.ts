import { logger } from './lib/index';
import TelegramBot from 'node-telegram-bot-api';

const botToken = process.env.TG_BOT_TOKEN;

if (!botToken) {
  logger.error('No token.');
  throw 'Please add your bot token to the env.';
}

const bot = new TelegramBot(botToken, { polling: true });
logger.info('Bot running.');

bot.onText(/@nyahaha_bot /g, msg => {
  console.log(msg);
});
