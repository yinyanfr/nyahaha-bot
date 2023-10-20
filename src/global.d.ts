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
  hash?: string;
  first_name?: string;
}

interface UserData {
  id: string;
  nickname?: string;
  balance: number;
  lastBonusDate?: string;
  lastGachaDate?: string;
  timezone?: string;
  sleepDate?: string;
}

interface CGSSGachaResult {
  id: number;
  title: string;
  name_only: string;
  card_image_ref: string | null;
  icon_image_ref: string | null;
  rarity: string;
}
