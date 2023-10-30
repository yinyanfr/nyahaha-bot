import { join } from 'node:path';
import winston from 'winston';
import { mkdir, stat } from 'node:fs/promises';
import stickers from './miaohaha.json';
import configs from '../configs';
import dayjs from 'dayjs';

export enum ERROR_CODE {
  BONUS_ALREADY_GOT = 'BONUS_ALREADY_GOT',
  NOT_ENOUGH_STONES = 'NOT_ENOUGH_STONES',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  SLOWDOWN = 'SLOWDOWN',
  INVALID_USER_ID = 'INVALID_USER_ID',
  INVALID_INPUT = 'INVALID_INPUT',
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'nyahaha-bot' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({
      filename: join(__dirname, '../..', 'logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: join(__dirname, '../..', 'logs', 'combined.log'),
    }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

export function toShuffled(arr: unknown[]) {
  const copy = [...arr];
  copy.sort(() => Math.random() - 1);
  return copy;
}

export function randint(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function slowdownOver(
  date1: Date,
  date2: Date,
  ms: number = 2 * 60 * 1000,
): boolean {
  // 计算两个日期之间的毫秒差值
  const timeDifference = Math.abs(date1.getTime() - date2.getTime());

  // 定义两分钟的毫秒数
  const twoMinutesInMilliseconds = ms;

  // 判断差值是否大于两分钟的毫秒数
  return timeDifference > twoMinutesInMilliseconds;
}

export function parseArgs(input: string) {
  const regex =
    /(?:「[^」]*」|『[^』]*』|《[^》]*》|“[^”]*”|"[^"]*"|'[^']*'|[^ ])+/g;

  // const symbols = [
  //   ['「', '」'],
  //   ['『', '』'],
  //   ['《', '》'],
  //   ['“', '”'],
  //   ['"', '"'],
  //   ["'", "'"],
  // ];
  // const regex = new RegExp(
  //   `(?:${symbols
  //     .map(([left, right]) => `${left}[^${right}]${right}`)
  //     .join('|')})+`,
  //   'g',
  // );
  return input
    .match(regex)
    ?.map(item => item.trim().replace(/^「|」|『|』|《|》|“|”|"|'$/g, ''));
}

export function pickSticker() {
  const sticker = randomElement(stickers.stickers);
  return sticker.file_id;
}

export function pickLoveConfession(chatId?: number) {
  const LOVE =
    'CAACAgQAAx0CXwxTYAACX7tlDwfcMeNvm8FZhx4AAcl3DRHGLH8AAowPAAJch4lSWdH01eDvTbQwBA';
  const NOT_LOVE = {
    '😟': 'CAACAgQAAxUAAWUO-BH9WRPSpGVeChebgyRLX0EGAAKEDgACcJOIUtXCApF9Fp3TMAQ',
    '❔': 'CAACAgQAAxUAAWUO-BE144NexikOgripIjFZjUaxAALmDAAC7peJUrEHq3uhAhZMMAQ',
    '🙃': 'CAACAgQAAxUAAWUO-BG1HzMaODWBaJ3Qy5ZN-VRaAAInEAACGv2JUtPsDLhNZLttMAQ',
    '👮': 'CAACAgQAAxUAAWUO-BHY9E-NtN4d_-HhNsl2pxpRAAI2DwACYxSJUvExPRQpskD0MAQ',
    '🫤': 'CAACAgQAAx0CXwxTYAACX7xlDwfqkyRV-aF9iBxWzz9juV-ESAAChA8AAoGOkVJSGy3WUp15mjAE',
    '😠': 'CAACAgQAAxUAAWUO-BHjZ80CYTtJ7YPImUI_j-zJAAJbDAACb8yRUiIM8E4h5q4QMAQ',
    '👊': 'CAACAgQAAxUAAWUO-BH6CGMcy4RcGmAP41qJWpFTAAIpDwACeBWRUlECPcGJGfrkMAQ',
    '😛': 'CAACAgQAAxUAAWUO-BHgtPRSn5vZnjfwxCHY7zxcAAJ0DwAC0_6IUj27Xt-R1-fZMAQ',
    '☕️': 'CAACAgQAAxUAAWUO-BEJ1eC272hSQAeiFnHoNW-AAAJJEgACUe2IUq1qnM1GoHzDMAQ',
    '😯': 'CAACAgQAAxUAAWUO-BGoLq765x-80ckTmVLlSOZKAALuDAACTXmQUsRCGjHpKjUQMAQ',
  };
  if (`${chatId}` === `${configs.adminId}`) {
    return LOVE;
  } else {
    if (Math.random() > 0.5) {
      return LOVE;
    } else return randomElement(Object.values(NOT_LOVE));
  }
}

export async function createFolder(folderPath: string) {
  const folderExists = await stat(folderPath)
    .then(stats => stats.isDirectory())
    .catch(() => false);
  if (!folderExists) {
    await mkdir(folderPath, { recursive: true });
  }
}

export function getLocalTime(utc: number, time?: string | Date) {
  return dayjs(time).utcOffset(utc);
}

function analyseExpensesSimple(expenses: Expense[], budget: number = 0) {
  const total = expenses.map(e => e.amount).reduce((a, b) => a + b);
  const remainingDays = dayjs().daysInMonth() - dayjs().date() + 1;
  const remainingBudget = budget - total;
  const remainingDaily =
    remainingBudget > 0 ? remainingBudget / remainingDays : 0;

  return {
    total: total.toFixed(2),
    remainingDays,
    remainingBudget: remainingBudget.toFixed(2),
    remainingDaily: remainingDaily.toFixed(2),
  };
}

export function formatSimpleBudget(
  nickname: string,
  expenses: Expense[],
  budget: number = 0,
) {
  const { total, remainingDays, remainingBudget, remainingDaily } =
    analyseExpensesSimple(expenses, budget);
  return `${nickname}本月已花${total}，本月剩余${remainingDays}天，${
    budget
      ? `${nickname}的预算还剩${remainingBudget}，日均${remainingDaily}`
      : `${nickname}尚未设置预算，可通过「预算」命令进行设置`
  }。`;
}

function analyseExpensesComplex(expenses: Expense[]) {
  const total = expenses.map(e => e.amount).reduce((a, b) => a + b);
  const categorized: Record<string, number> = {};
  expenses.forEach(({ category, amount }) => {
    if (categorized[category]) {
      categorized[category] += amount;
    } else {
      categorized[category] = amount;
    }
  });
  const sorted = Object.keys(categorized).map(key => ({
    category: key,
    amount: categorized[key],
    ratio: categorized[key] / total,
  }));
  sorted.sort((a, b) => a.amount - b.amount);
  return { sorted };
}

export function formatComplexBudget(nickname: string, expenses: Expense[]) {
  const { sorted } = analyseExpensesComplex(expenses);
  const formatted = sorted.map(
    ({ category, amount, ratio }) =>
      `${category}: ${amount.toFixed(2)} (${(ratio * 100).toFixed(0)}%)`,
  );
  return formatted.join('\n');
}
