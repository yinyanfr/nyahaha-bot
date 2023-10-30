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
  id?: string;
  title: string;
  youtubeId: string;
  link?: string;
  tags: string[];
}

interface User {
  id: string;
  uid: string;
  hash?: string;
  first_name?: string;
}

interface UserData {
  id: string;
  nickname?: string;
  balance: number;
  lastBonusDate?: string;
  lastGachaDate?: string;
  timezone?: number;
  sleepDate?: string;
  budget?: number;
}

interface CGSSGachaResult {
  id: number;
  title: string;
  name_only: string;
  card_image_ref: string | null;
  icon_image_ref: string | null;
  rarity: string;
}

interface LoginQuery {
  id: string;
  first_name: string;
  photo_url: string;
  auth_date: string;
  hash: string;
}

interface Expense {
  chatId: number;
  amount: number;
  category: string;
  localTime: any;
}

interface BookKeeping {
  expenses: Expense[];
}
