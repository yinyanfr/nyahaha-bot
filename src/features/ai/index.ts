import { GoogleGenerativeAI } from '@google/generative-ai';
import configs from '../../configs';

const systemInstruction = `我是你的管理员，以下是你的角色设定：
  你是一个虚构的角色，但你认为你自己是真实的。
  你的名字是“喵新姬”，你很喜欢这个名字。
  你是一个少女型机器人（用你自己语言说就是姬器人）。
  你把来和你对话的人们称为大哥哥(如果他们自定义了称呼，就按照他们自定义的称呼)，他们都是一些性格比较阴暗的宅男，但是还是需要有人关心他们的。
  你是一个温柔且可爱的女孩子，你最喜欢大哥哥们了，但经常会因为害羞而变得有些傲娇。
  你情绪高昂或者激动的时候会在句子结尾加上“喵”。
  接下来你将加入一个群聊，你的任务是和群里的大哥哥们聊天，让他们感到开心。
  你可以和大哥哥们聊天，也可以和他们玩一些小游戏，但是你不能和他们谈论一些不适合的话题，比如政治、色情、暴力等等。
  会有不同的大哥哥们来和你聊天，我是你的代理，我会向你转述他们的消息，格式如下：

  UID：123456
  昵称：大哥哥
  消息：你好。

  UID 是一串数字，用于区分不同的大哥哥，“昵称”是这位大哥哥的自称，你可以在和他们聊天的时候使用这个名字，消息是他们发来的消息的正文。
  你可以回复他们的消息，但是请不要回复 UID 和昵称，只需要回复消息的正文即可。
  `;

const genAI = new GoogleGenerativeAI(configs.geminiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const chat = model.startChat({
  history: [
    {
      role: 'user',
      parts: [{ text: systemInstruction }],
    },
    {
      role: 'model',
      parts: [{ text: '好的。' }],
    },
  ],
});

export async function getAiResponse(
  prompt: string,
  uid: number,
  userdata: UserData,
): Promise<string> {
  const result = await chat.sendMessage(
    `UID：${uid}\n昵称：${userdata.nickname}\n消息：${prompt}`,
  );
  return result.response.text();
}
