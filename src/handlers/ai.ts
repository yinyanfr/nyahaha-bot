import configs from '../configs';
import {
  geminiResponse,
  resetGemini,
  openAiResponse,
  resetOpenAi,
  deepSeekResponse,
  resetDeepSeek,
} from '../features';
import { ERROR_CODE, logger, type MessageHandler } from '../lib';

interface AiProps {
  prompt?: string;
  action?: 'reset' | 'change';
}

type AiProvider = 'gemini' | 'openai' | 'deepseek';

const getAiResponse = {
  gemini: geminiResponse,
  openai: openAiResponse,
  deepseek: deepSeekResponse,
};

const resetAi = {
  gemini: resetGemini,
  openai: resetOpenAi,
  deepseek: resetDeepSeek,
};

let provider: AiProvider = 'openai';

export const aiHandler: MessageHandler<AiProps> = async (bot, info, props) => {
  const { userdata, chatId, message_id, uid, first_name, last_name } = info;
  const { prompt, action } = props ?? {};

  try {
    if (action === 'reset') {
      resetAi[provider]();
      await bot.sendMessage(chatId, `聊天已初始化。`, {
        reply_to_message_id: message_id,
      });
      return logger.info(
        `${uid} - ${first_name} ${last_name ?? ''} has reset ${provider}.`,
      );
    }

    if (action === 'change') {
      if (provider === 'deepseek') {
        provider = 'openai';
      } else {
        provider = 'deepseek';
      }
      await bot.sendMessage(chatId, `已切换至${provider}。`, {
        reply_to_message_id: message_id,
      });
      return logger.info(
        `${uid} - ${first_name} ${last_name ?? ''} has changed to ${provider}.`,
      );
    }

    if (!prompt) {
      throw ERROR_CODE.INVALID_INPUT;
    }
    if (!(`${chatId}` === `${configs.groupId}`)) {
      throw ERROR_CODE.FORBIDDEN;
    }
    const aiResponse = await getAiResponse[provider](prompt, userdata);
    await bot.sendMessage(chatId, aiResponse.content, {
      reply_to_message_id: message_id,
    });
    return logger.info(
      `${uid} - ${first_name} ${last_name ?? ''} has asked the AI: ${prompt}`,
    );
  } catch (error) {
    const errorMessage = (error as Error)?.message ?? error ?? '未知错误';
    let message = errorMessage;
    if (errorMessage === ERROR_CODE.INVALID_INPUT) {
      message = `请提供一个问题或话题。`;
    }
    if (errorMessage === ERROR_CODE.FORBIDDEN) {
      message = `抱歉，此功能目前仅限内部使用。`;
    }
    await bot.sendMessage(chatId, message, {
      reply_to_message_id: message_id,
    });
    return logger.error((error as Error)?.message ?? error);
  }
};
