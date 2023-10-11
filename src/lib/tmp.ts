import miaohaha from './miaohaha.json';

const projection = miaohaha.stickers.map(e => ({
  file_id: e.file_id,
  emoji: e.emoji,
}));

const o: any = {};
projection.forEach(e => {
  o[e.emoji] = e.file_id;
});

console.log(o);

`
{
  message_id: 14200,
  from: { id: 777000, is_bot: false, first_name: 'Telegram' },
  sender_chat: { id: -1001869306056, title: '喵新FM', type: 'channel' },
  chat: { id: -1001820310894, title: '小姐姐小妹妹', type: 'supergroup' },
  date: 1697033279,
  forward_from_chat: { id: -1001869306056, title: '喵新FM', type: 'channel' },
  forward_from_message_id: 5,
  forward_signature: '连雨遥',
  is_automatic_forward: true,
  forward_date: 1697033276,
  text: '发条测试消息，给机器人获得 channel id'
}
`;
