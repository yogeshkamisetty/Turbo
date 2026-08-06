import dotenv from 'dotenv';
dotenv.config();

import { createOcppServer } from './server';

const port = parseInt(process.env.PORT || '9000', 10);
createOcppServer(port);
