import { getImageUrl, list } from '../services';

interface CGSSCard {
  id: number;
  spread_image_ref?: string;
}

function sleep(time = 500) {
  return new Promise(resolve => {
    setTimeout(() => resolve(undefined), time);
  });
}

async function downloadSpreads() {
  const allCards = await list<CGSSCard>('cgss-cards');
  let index = 1;
  const total = allCards.filter(e => e.spread_image_ref).length;
  for (const card of allCards) {
    if (card.spread_image_ref) {
      await getImageUrl(
        card.spread_image_ref,
        `cgss-cards/${card.id}/spread.png`,
      );
      await sleep(100);
      console.log(`[${index++}/${total}] Saved ${card.id}`);
    }
  }
}

downloadSpreads();
