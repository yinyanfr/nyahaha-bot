import TelegramBot from 'node-telegram-bot-api';

export interface MessageInfo {
  uid: number;
  first_name?: string;
  last_name?: string;
  chatId: number;
  type?: string;
  text?: string;
  message_id: number;
  userdata: UserData;
  nickname: string;
}

export type MessageHandler<MessageProps = void> = (
  bot: TelegramBot,
  info: MessageInfo,
  props?: MessageProps,
) => Promise<unknown>;
