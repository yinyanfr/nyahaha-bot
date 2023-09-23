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
