import { logger } from './lib/index';
import cors from 'cors';
import express from 'express';
import { authRouter } from './routers';
import { initializeData } from './services';
import configs from './configs';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

initializeData()
  .then(() => {
    app.listen(configs.serverPort, () => {
      logger.info(`Server running on ${configs.serverPort}.`);
    });
  })
  .catch(err => {
    logger.error(`Server starting failed.`);
    console.error(err);
  });
