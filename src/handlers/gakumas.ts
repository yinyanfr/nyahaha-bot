import {
  calculateGakumasPoints,
  ERROR_CODE,
  logger,
  type MessageHandler,
} from '../lib';

interface GakumasCalcProps {
  status: number[];
}

function overflow(status: number) {
  return status > 1470 ? `${status}(1470)` : status;
}

function overflowTotal(vo: number, da: number, vi: number) {
  if (vo > 1470 || da > 1470 || vi > 1470) {
    const actualVo = vo > 1470 ? 1470 : vo;
    const actualDa = da > 1470 ? 1470 : da;
    const actualVi = vi > 1470 ? 1470 : vi;
    return `${vo + da + vi}(${actualVo + actualDa + actualVi})`;
  }
  return vo + da + vi;
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
    const { stageTotal, S, APlus, A } = calculateGakumasPoints(status);
    const [vo, da, vi] = status;
    await bot.sendMessage(
      chatId,
      `${nickname}的三维为 vo. ${overflow(vo)}, da. ${overflow(
        da,
      )}, vi. ${overflow(vi)}，\n合计为<b>${overflowTotal(
        vo,
        da,
        vi,
      )} （${stageTotal}）</b>，要打到各个评价所需的分数分别为：\nS：${S}  <b>A+：${APlus}</b>  A：${A}`,
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
