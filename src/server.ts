import { logger } from './lib/index';
import cors from 'cors';
import express from 'express';
import { authRouter } from './routers';
import configs from './configs';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

app.listen(configs.serverPort, () => {
  logger.info(`Server running on ${configs.serverPort}.`);
});
