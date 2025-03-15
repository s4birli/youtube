import 'dotenv/config';
import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Rate limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_TIMEWINDOW: z.string().transform(Number).default('60000'),

  // Database (if needed)
  DB_CLIENT: z.string().default('sqlite3'),
  DB_FILENAME: z.string().default('./data/youtube-dl.sqlite'),

  // YouTube Downloader Config
  DOWNLOAD_TEMP_DIR: z.string().default('./data/downloads'),
  DOWNLOAD_TIMEOUT: z.string().transform(Number).default('300000'),
  MAX_CONCURRENT_DOWNLOADS: z.string().transform(Number).default('3'),

  // API Documentation
  SWAGGER_HOST: z.string().default('localhost:3001'),
  SWAGGER_SCHEME: z.enum(['http', 'https']).default('http'),
});

// Parse and validate environment variables
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:', result.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = result.data;
