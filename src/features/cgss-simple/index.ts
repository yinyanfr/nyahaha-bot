/// <reference path="./index.d.ts" />

import { randomElement, slowdownOver } from '../../lib';
import { getCachedCard, getImageUrl } from '../../services';
import allCards from './card_list.json';

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

export async function pickCard(mustSr?: boolean) {
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
    card_image_ref: await getImageUrl(
      card_image_ref,
      `cgss-cards/${id}/card.png`,
    ),
    icon_image_ref: await getImageUrl(
      icon_image_ref,
      `cgss-cards/${id}/icon.png`,
    ),
    rarity,
  };
}

export async function pickTenCards(id: string) {
  // const requests = new Array(10).fill(1).map((e, i) => pickCard(i === 9))
  // const worker = await Promise.all(requests)
  const now = new Date();
  if (!Reqlist[id] || slowdownOver(now, Reqlist[id], 60 * 1000)) {
    Reqlist[id] = now;
    return await pickCard(true);
  } else {
    throw 'Slowdown';
  }
}
