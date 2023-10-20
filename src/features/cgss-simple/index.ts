/// <reference path="./index.d.ts" />
import {
  ERROR_CODE,
  createFolder,
  randomElement,
  slowdownOver,
} from '../../lib';
import {
  deferredImageBuffers,
  getCachedCard,
  getImageUrl,
} from '../../services';
import allCards from './card_list.json';
import joinImages from 'join-images';
import shortUUID from 'short-uuid';
import { join } from 'node:path';

interface GroupedCards {
  r: CardInfo[];
  sr: CardInfo[];
  ssr: CardInfo[];
}

function groupCardByRarity(cards: CardInfo[]) {
  const r: CardInfo[] = [];
  const sr: CardInfo[] = [];
  const ssr: CardInfo[] = [];

  cards.forEach(e => {
    if (e.rarity_dep.rarity === 3) {
      r.push(e);
    } else if (e.rarity_dep.rarity === 5) {
      sr.push(e);
    } else if (e.rarity_dep.rarity === 7) {
      ssr.push(e);
    }
  });

  return { r, sr, ssr };
}

const grouped = groupCardByRarity(allCards.result as CardInfo[]);

const Reqlist: Record<string, Date> = {};

export async function pickCard(mustSr?: boolean): Promise<CGSSGachaResult> {
  const rand = Math.abs(Math.random());
  let rarity: keyof GroupedCards = mustSr ? 'sr' : 'r';
  if (rand < 0.03) {
    rarity = 'ssr';
  } else if (rand < 0.13) {
    rarity = 'sr';
  }
  const card = randomElement(grouped[rarity]);
  const cardDetail = (await getCachedCard(card.id)) as CardDetail;
  const { id, title, name_only, card_image_ref, icon_image_ref } = cardDetail;

  return {
    id,
    title,
    name_only,
    card_image_ref:
      rarity === 'r'
        ? null
        : await getImageUrl(card_image_ref, `cgss-cards/${id}/card.png`),
    icon_image_ref:
      rarity === 'r'
        ? null
        : await getImageUrl(icon_image_ref, `cgss-cards/${id}/icon.png`),
    rarity,
  };
}

export async function pickTenCards(id: string) {
  const now = new Date();
  if (!Reqlist[id] || slowdownOver(now, Reqlist[id], 60 * 1000)) {
    Reqlist[id] = now;
    const requests = new Array(10).fill(1).map((e, i) => pickCard(i === 9));
    const results = await Promise.all(requests);
    const cardImageUrls = results
      .filter(e => e.card_image_ref)
      .map(e => e.card_image_ref as string);
    const cardImageBuffers = await deferredImageBuffers(cardImageUrls);
    const joinedImage = await joinImages(cardImageBuffers, {
      direction: 'horizontal',
      align: 'center',
    });

    // Problem with the API, neither Buffer nor Stream would work, had to write to a file
    const tmpImageDir = join(__dirname, '../../..', 'tmp');
    await createFolder(tmpImageDir);
    const tmpImagePath = join(tmpImageDir, `${shortUUID.generate()}.jpg`);
    await joinedImage.jpeg().toFile(tmpImagePath);
    return {
      results,
      imageUrl: tmpImagePath,
    };
  } else {
    throw ERROR_CODE.SLOWDOWN;
  }
}
