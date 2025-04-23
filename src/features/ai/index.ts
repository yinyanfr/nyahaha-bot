/// <reference path="./index.d.ts" />

export {
  getAiResponse as geminiResponse,
  resetAi as resetGemini,
} from './gemini';

export {
  getAiResponse as openAiResponse,
  resetAi as resetOpenAi,
} from './openai';

export {
  getAiResponse as deepSeekResponse,
  resetAi as resetDeepSeek,
} from './deepseek';
