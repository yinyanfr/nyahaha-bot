import configs from '../configs';
import { getStatus } from '../features';
import { changeAliasOrMap, connect, restartCS2 } from '../features/rcon';
import { AcceptedAlias, MapPool } from '../features/rcon/lib';
import { ERROR_CODE, logger, MessageHandler, sleep } from '../lib';

interface RconProps {
  command?: string;
}

export const rconHandler: MessageHandler<RconProps> = async (
  bot,
  info,
  props,
) => {
  const { chatId, uid, first_name, last_name } = info;
  if (`${chatId}` !== `${configs.groupId}`) {
    throw ERROR_CODE.FORBIDDEN;
  }
  const { command } = props ?? {};
  if (!command) {
    const status = await getStatus();
    const { connected, gameAlias, map, players } = status;
    if (connected) {
      await bot.sendMessage(
        chatId,
        `服务器正在运行，模式：${gameAlias}，地图：${map}，服务器中当前有${players}位玩家。`,
      );
    } else {
      await bot.sendMessage(chatId, `服务器挂惹`);
    }

    return logger.info(
      `${uid} - ${first_name} ${last_name ?? ''} has checked the server data.`,
    );
  } else {
    if (command === '重启' || command === 'restart') {
      await bot.sendMessage(chatId, `开始尝试重启服务器，请稍等。`);
      try {
        const res = await restartCS2();
        if (res.status !== 200) {
          throw res.data;
        } else {
          await bot.sendMessage(
            chatId,
            `服务器已成功重启，可能需要等到3-5分钟（需要更新的情况时间更长），请耐心等待。`,
          );
          for (let retry = 0; retry < 5; retry++) {
            await sleep(2 * 60 * 1000);
            await connect().catch(err => {
              console.log(err);
            });
            const status = await getStatus();
            const { connected, gameAlias, map, players } = status;
            if (connected) {
              await bot.sendMessage(
                chatId,
                `服务器正在运行，模式：${gameAlias}，地图：${map}，服务器中当前有${players}位玩家。`,
              );
            } else {
              await bot.sendMessage(chatId, `服务器准备中，2分钟后重新查询。`);
            }
          }
        }
        return logger.info(
          `${uid} - ${first_name} ${last_name ?? ''} restarted cs2 server.`,
        );
      } catch (err) {
        await bot.sendMessage(chatId, `出错了：${err}`);
        return logger.info(
          `${uid} - ${first_name} ${last_name ?? ''} wanted to restart cs2 server, but has failed to ${err}.`,
        );
      }
    }

    try {
      await changeAliasOrMap(command);
      await bot.sendMessage(
        chatId,
        `服务器正在更换模式或地图至：${command}，请稍等。如需继续更改模式或地图，请等待30秒。`,
      );
      return logger.info(
        `${uid} - ${first_name} ${last_name ?? ''} has changed cs2 server to ${command}.`,
      );
    } catch (error) {
      if (error === ERROR_CODE.INVALID_INPUT) {
        await bot.sendMessage(
          chatId,
          `请输入正确的模式或地图代号：\n模式：${AcceptedAlias.join('  ')}\n地图：${MapPool.join('  ')}`,
        );
      } else if (error === ERROR_CODE.OUT_OF_SERVICE) {
        await bot.sendMessage(chatId, `服务器挂惹`);
      } else if (error === ERROR_CODE.SLOWDOWN) {
        await bot.sendMessage(chatId, `切换模式或地图需等待30秒。`);
      } else {
        console.log(error);
        await bot.sendMessage(chatId, `未知错误。`);
      }
      return logger.info(
        `${uid} - ${first_name} ${last_name ?? ''} wanted to change cs2 server to ${command}, but has failed to ${error}.`,
      );
    }
  }
};
