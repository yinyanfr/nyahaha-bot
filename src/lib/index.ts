import { join } from 'node:path';
import winston from 'winston';

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

export function randomElement<T>(arr: T[]) {
  return arr[randint(0, arr.length)];
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
