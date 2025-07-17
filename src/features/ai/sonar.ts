import { createPerplexity } from '@ai-sdk/perplexity';
import configs from '../../configs';
import { CoreMessage, generateText } from 'ai';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ERROR_CODE } from '../../lib';

const msgHistory: CoreMessage[] = [];

function registerMsg(msg: CoreMessage) {
  if (msgHistory.length > 30) {
    msgHistory.shift();
  }
  msgHistory.push(msg);
}

const systemPrompt = readFileSync(join(__dirname, 'prompt.txt')).toString(
  'utf-8',
);

const perplexity = createPerplexity({
  apiKey: configs.perplexityKey,
});

export async function getAiResponse(
  prompt: string,
  userdata: UserData,
): Promise<AiResponse> {
  const Sonar = perplexity('sonar');
  try {
    if (prompt?.length) {
      registerMsg({
        role: 'user',
        content: `UID：${userdata.id}\n昵称：${
          userdata?.nickname?.length ? userdata.nickname : '大哥哥'
        }\n内容：${prompt}`,
      });

      const { text } = await generateText({
        model: Sonar,
        system: systemPrompt,
        messages: msgHistory,
      });
      registerMsg({
        content: text,
        role: 'assistant',
      });

      return {
        content: text,
        flagged: false,
      };
    }
    throw ERROR_CODE.NOT_FOUND;
  } catch (error) {
    return {
      content: `姬器人又被${
        userdata.nickname ?? '大哥哥'
      }玩坏了啦，消息已被跳过。\n错误信息：${
        (error as Error)?.message ?? error ?? '未知错误'
      }`,
    };
  }
}

export function resetAi() {
  msgHistory.length = 0;
}
