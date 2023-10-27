#!/usr/bin/env node

import prompts from 'prompts';
import { addSong } from '../services';

(async () => {
  const response = await prompts([
    {
      type: 'text',
      name: 'title',
      message: 'Song name: ',
    },
    {
      type: 'text',
      name: 'youtubeId',
      message: 'Youtube ID: ',
    },
    {
      type: 'text',
      name: 'tags',
      message: 'Tags (seprate with comma): ',
    },
  ]);

  const { title, youtubeId, tags } = response;

  try {
    const songId = await addSong({
      title,
      youtubeId,
      tags: tags.split(/[,，、] */),
    });
    console.log(`Successfully added ${title} - ${songId}`);
  } catch (error) {
    console.error(error);
  }
})();
