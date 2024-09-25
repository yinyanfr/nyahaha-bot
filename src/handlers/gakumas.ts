import {
  calculateGakumasPoints,
  calculateGakumasPointsMaster,
  ERROR_CODE,
  isMaster,
  logger,
  type MessageHandler,
} from '../lib';

interface GakumasCalcProps {
  status: number[];
  master?: boolean;
}

function overflow(status: number, cap = 1470) {
  return status > cap ? `${status}(${cap})` : status;
}

function overflowTotal(vo: number, da: number, vi: number, cap = 1470) {
  if (vo > cap || da > cap || vi > cap) {
    const actualVo = vo > cap ? cap : vo;
    const actualDa = da > cap ? cap : da;
    const actualVi = vi > cap ? cap : vi;
    return `${vo + da + vi}(${actualVo + actualDa + actualVi})`;
  }
  return vo + da + vi;
}

function formatBorders(borders: Record<string, number | undefined>) {
  return Object.entries(borders)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key.replace('Plus', '+')}: ${value}`)
    .map((e, i) => (i % 2 === 0 ? e : `<b>${e}</b>`))
    .join(' ');
}

export const gakumasCalcHandler: MessageHandler<GakumasCalcProps> = async (
  bot,
  info,
  props,
) => {
  const { chatId, message_id, nickname, uid, first_name, last_name } = info;
  const { status } = props ?? {};

  try {
    if (!status?.length) {
      throw ERROR_CODE.INVALID_INPUT;
    }
    const master = props?.master || isMaster(status);
    const { stageTotal, SPlus, S, APlus, A } = master
      ? calculateGakumasPointsMaster(status)
      : calculateGakumasPoints(status);
    const borders = master ? { SPlus, S, APlus } : { S, APlus, A };
    const cap = master ? 1770 : 1470;

    const [vo, da, vi] = status;
    await bot.sendMessage(
      chatId,
      `${nickname}的三维为 vo. ${overflow(vo, cap)}, da. ${overflow(
        da,
        cap,
      )}, vi. ${overflow(vi, cap)}，\n合计为<b>${overflowTotal(
        vo,
        da,
        vi,
        cap,
      )}</b> （${stageTotal}），要打到各个评价所需的分数分别为：\n${formatBorders(
        borders,
      )}`,
      {
        reply_to_message_id: message_id,
        parse_mode: 'HTML',
      },
    );
    return logger.info(
      `${uid} - ${first_name} ${
        last_name ?? ''
      } has calculated their Gakumas Points.`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.INVALID_INPUT) {
      message = `请以输入三维数值，用空格隔开`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};
