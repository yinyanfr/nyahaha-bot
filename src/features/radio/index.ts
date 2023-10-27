import { ERROR_CODE, randomElement, slowdownOver } from '../../lib';

const YoutubeUrlPrefix = 'https://www.youtube.com/watch?v=';

export default class Radio {
  static slowdownEnabled = true;
  static slowdownTime = 1000 * 60;
  static Songlist: Song[] = [];

  static Reqlist: Record<string, Date> = {};

  static pickSong(tag?: string) {
    if (!tag) {
      return randomElement(Radio.Songlist);
    }

    // match tag
    const tagMatched = Radio.Songlist.filter(song =>
      song.tags.find(e => e.match(new RegExp(tag, 'gi'))),
    );
    if (tagMatched.length) {
      return randomElement(tagMatched);
    }

    // match title
    const titleMatched = Radio.Songlist.filter(song =>
      song.title.match(new RegExp(tag, 'gi')),
    );
    if (titleMatched.length) {
      const picked = randomElement(titleMatched);
      return { ...picked, link: `${YoutubeUrlPrefix}${picked.youtubeId}` };
    }

    const picked = randomElement(Radio.Songlist);
    return { ...picked, link: `${YoutubeUrlPrefix}${picked.youtubeId}` };
  }

  static processRequest(id: string, tag?: string) {
    const now = new Date();
    if (
      !Radio.Reqlist[id] ||
      !Radio.slowdownEnabled ||
      slowdownOver(now, Radio.Reqlist[id], Radio.slowdownTime)
    ) {
      Radio.Reqlist[id] = now;
      return Radio.pickSong(tag);
    } else {
      throw ERROR_CODE.SLOWDOWN;
    }
  }
}
