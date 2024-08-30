import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import configs from '../../configs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const systemInstruction = readFileSync(join(__dirname, 'prompt.txt')).toString(
  'utf-8',
);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

const genAI = new GoogleGenerativeAI(configs.geminiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  safetySettings,
  systemInstruction,
});

function createChat() {
  return model.startChat();
}

let chat = createChat();

export async function getAiResponse(
  prompt: string,
  userdata: UserData,
): Promise<AiResponse> {
  try {
    const result = await chat.sendMessage(
      `UID：${userdata.id}\n昵称：${
        userdata?.nickname?.length ? userdata.nickname : '大哥哥'
      }\n内容：${prompt}`,
    );
    return {
      content: result.response.text(),
    };
  } catch (error) {
    chat = createChat();

    return {
      content: `姬器人又被${
        userdata.nickname ?? '大哥哥'
      }玩坏了啦，聊天已被初始化。\n错误信息：${
        (error as Error)?.message ?? error ?? '未知错误'
      }`,
    };
  }
}
