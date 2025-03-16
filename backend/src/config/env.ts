import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file
config();

// Define schema for environment variables
const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  HOST: z.string().default('localhost'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Directories
  DOWNLOAD_TEMP_DIR: z.string().default('./data'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIMEWINDOW: z.coerce.number().default(60000), // 1 minute

  // Swagger
  SWAGGER_HOST: z.string().default('localhost:3000'),
  SWAGGER_SCHEME: z.enum(['http', 'https']).default('http'),

  // Max concurrent downloads
  MAX_CONCURRENT_DOWNLOADS: z.coerce.number().default(3),

  // Cache settings
  CACHE_TTL: z.coerce.number().default(1800), // 30 minutes in seconds
  CACHE_MAX_ITEMS: z.coerce.number().default(100),
});

// Parse environment variables
const env = envSchema.parse(process.env);

// Resolve absolute paths
env.DOWNLOAD_TEMP_DIR = path.resolve(process.cwd(), env.DOWNLOAD_TEMP_DIR);

// Export environment variables
export { env };
