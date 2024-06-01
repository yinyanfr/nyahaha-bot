import {
  calculateGakumasPoints,
  ERROR_CODE,
  logger,
  type MessageHandler,
} from '../lib';

interface GakumasCalcProps {
  status: number[];
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
    await bot.sendMessage(
      chatId,
      `${nickname}的三维合计为${stageTotal}，要打到各个评价所需的分数分别为：\nS：${S}\nAPlus：${APlus}\nA：${A}\n`,
      {
        reply_to_message_id: message_id,
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
