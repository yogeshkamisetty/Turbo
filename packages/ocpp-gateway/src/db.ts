import { Pool } from 'pg';
import Redis from 'ioredis';

const pgHost = process.env.POSTGRES_HOST || 'localhost';
const pgPort = parseInt(process.env.POSTGRES_PORT || '5432', 10);
const pgUser = process.env.POSTGRES_USER || 'switchyard';
const pgPassword = process.env.POSTGRES_PASSWORD || 'switchyard_secret';
const pgDatabase = process.env.POSTGRES_DB || 'switchyard';

export const dbPool = new Pool({
  host: pgHost,
  port: pgPort,
  user: pgUser,
  password: pgPassword,
  database: pgDatabase,
  max: 20,
  idleTimeoutMillis: 30000,
});

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisPublisher = new Redis({
  host: redisHost,
  port: redisPort,
});

export const redisSubscriber = new Redis({
  host: redisHost,
  port: redisPort,
});

dbPool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});
