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
      name: 'link',
      message: 'Youtube link: ',
    },
    {
      type: 'text',
      name: 'tags',
      message: 'Tags (seprate with comma): ',
    },
  ]);

  const { title, link, tags } = response;

  try {
    const songId = await addSong({
      title,
      link,
      tags: tags.split(/[,，、] */),
    });
    console.log(`Successfully added ${title} - ${songId}`);
  } catch (error) {
    console.error(error);
  }
})();
