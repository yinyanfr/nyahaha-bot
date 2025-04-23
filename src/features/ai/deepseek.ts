import OpenAI from 'openai';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ERROR_CODE } from '../../lib';
import configs from '../../configs';

interface OpenAIMsg {
  role: 'system' | 'user' | 'assistant';
  content: string | null;
}

const prompt = readFileSync(join(__dirname, 'prompt.txt')).toString('utf-8');

const msgHistory: OpenAIMsg[] = [];

function registerMsg(msg: OpenAIMsg) {
  if (msgHistory.length > 30) {
    msgHistory.shift();
  }
  msgHistory.push(msg);
}

function getMsgHistory(): OpenAIMsg[] {
  return [{ role: 'system', content: prompt }, ...msgHistory];
}

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: configs.deepSeekKey,
});

async function isContentFlagged(content: string) {
  const moderation = await openai.moderations.create({ input: content });
  return moderation.results?.[0]?.flagged;
}

export async function getAiResponse(
  prompt: string,
  userdata: UserData,
): Promise<AiResponse> {
  try {
    if (prompt?.length) {
      registerMsg({
        role: 'user',
        content: `UID：${userdata.id}\n昵称：${
          userdata?.nickname?.length ? userdata.nickname : '大哥哥'
        }\n内容：${prompt}`,
      });
    }
    const completion = await openai.chat.completions.create({
      messages:
        getMsgHistory() as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      model: 'deepseek-chat',
    });

    const msg = completion.choices?.[0]?.message;
    if (msg.role === 'assistant' && msg?.content) {
      const flagged = await isContentFlagged(msg.content);
      registerMsg(msg);
      return {
        content: flagged
          ? `此回复可能包含不安全内容：\n\n${msg.content}`
          : msg.content,
        flagged,
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
