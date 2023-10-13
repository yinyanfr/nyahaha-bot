interface BotMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name: string;
    language_code: string;
  };
  chat: {
    id: number;
    title: string;
    type: string;
  };
  date: number;
  text: string;
}

interface Song {
  title: string;
  link: string;
  tags: string[];
}

interface User {
  id: string;
  uid: string;
}

interface UserData {
  balance: number;
  lastBonusDate?: string;
}
