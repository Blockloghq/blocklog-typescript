import { z } from 'zod';
import {
  DEFAULT_ENDPOINT,
  DEFAULT_BATCH_SIZE,
  DEFAULT_FLUSH_INTERVAL,
  DEFAULT_TIMEOUT,
  DEFAULT_RETRY_COUNT,
  DEFAULT_SIGNING_ALG,
  DEFAULT_ENABLE_SIGNING,
  DEFAULT_ENABLE_COMPRESSION,
  DEFAULT_DEBUG
} from '../constants/defaults';
import { validateSchema } from '../utils/validation';

export const BlocklogConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  endpoint: z.string().url().default(DEFAULT_ENDPOINT),
  batchSize: z.number().int().positive().default(DEFAULT_BATCH_SIZE),
  flushInterval: z.number().int().positive().default(DEFAULT_FLUSH_INTERVAL),
  timeout: z.number().int().positive().default(DEFAULT_TIMEOUT),
  retryCount: z.number().int().nonnegative().default(DEFAULT_RETRY_COUNT),
  enableSigning: z.boolean().default(DEFAULT_ENABLE_SIGNING),
  enableCompression: z.boolean().default(DEFAULT_ENABLE_COMPRESSION),
  debug: z.boolean().default(DEFAULT_DEBUG),
  signingKey: z.string().optional(),
  signingAlg: z.enum(['ed25519', 'hmac-sha256']).default(DEFAULT_SIGNING_ALG),
});

export type BlocklogConfig = z.input<typeof BlocklogConfigSchema>;
export type ResolvedConfig = z.output<typeof BlocklogConfigSchema>;

export function resolveConfig(runtimeConfig: Partial<BlocklogConfig>): ResolvedConfig {
  // Build config by prioritizing runtime overrides, then environment variables, then defaults.
  const envConfig: Partial<BlocklogConfig> = {
    apiKey: process.env.BLOCKLOG_API_KEY || runtimeConfig.apiKey,
    endpoint: process.env.BLOCKLOG_ENDPOINT || runtimeConfig.endpoint,
    batchSize: process.env.BLOCKLOG_BATCH_SIZE ? parseInt(process.env.BLOCKLOG_BATCH_SIZE, 10) : runtimeConfig.batchSize,
    flushInterval: process.env.BLOCKLOG_FLUSH_INTERVAL ? parseInt(process.env.BLOCKLOG_FLUSH_INTERVAL, 10) : runtimeConfig.flushInterval,
    timeout: process.env.BLOCKLOG_TIMEOUT ? parseInt(process.env.BLOCKLOG_TIMEOUT, 10) : runtimeConfig.timeout,
    retryCount: process.env.BLOCKLOG_RETRY_COUNT ? parseInt(process.env.BLOCKLOG_RETRY_COUNT, 10) : runtimeConfig.retryCount,
    enableSigning: process.env.BLOCKLOG_ENABLE_SIGNING === 'true' ? true : (process.env.BLOCKLOG_ENABLE_SIGNING === 'false' ? false : runtimeConfig.enableSigning),
    enableCompression: process.env.BLOCKLOG_ENABLE_COMPRESSION === 'true' ? true : (process.env.BLOCKLOG_ENABLE_COMPRESSION === 'false' ? false : runtimeConfig.enableCompression),
    debug: process.env.BLOCKLOG_DEBUG === 'true' ? true : (process.env.BLOCKLOG_DEBUG === 'false' ? false : runtimeConfig.debug),
    signingKey: process.env.BLOCKLOG_SIGNING_KEY || runtimeConfig.signingKey,
    signingAlg: (process.env.BLOCKLOG_SIGNING_ALG || runtimeConfig.signingAlg) as any,
  };

  // Filter out undefined keys to let Zod supply defaults
  const mergedConfig: Record<string, any> = {};
  for (const [key, val] of Object.entries(envConfig)) {
    if (val !== undefined) {
      mergedConfig[key] = val;
    }
  }

  return validateSchema(BlocklogConfigSchema, mergedConfig);
}
