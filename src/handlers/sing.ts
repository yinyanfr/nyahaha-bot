import { Radio } from '../features';
import { ERROR_CODE, logger, type MessageHandler } from './../lib';

interface SongProps {
  query?: string;
}

const YoutubeUrlPrefix = 'https://www.youtube.com/watch?v=';

export const singHandler: MessageHandler<SongProps> = async (
  bot,
  info,
  props,
) => {
  const { uid, first_name, last_name, chatId, message_id } = info;
  const { query } = props ?? {};

  try {
    const WHY =
      'AgACAgQAAxkBAAID8WVBKdYqhAWohw9Wc8-Vo8JacRKUAAJtvzEbx4cIUrUNU3kxtOKPAQADAgADeAADMwQ';
    const thatSong = 'W8DCWI_Gc9c';
    const song = Radio.processRequest(`${uid}`, query);
    await bot.sendMessage(
      chatId,
      `${song.title}\n\n${YoutubeUrlPrefix}${song.youtubeId}`,
    );
    if (song.youtubeId === thatSong) {
      await bot.sendPhoto(chatId, WHY, {
        reply_to_message_id: message_id,
        caption: '为什么要演奏春日影!',
      });
    }
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
      await bot.sendMessage(chatId, (error as Error)?.message ?? '未知错误');
    }
    return logger.error((error as Error)?.message ?? error);
  }
};
