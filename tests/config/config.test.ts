import { describe, it, expect, beforeEach } from 'vitest';
import { resolveConfig, BlocklogConfig } from '../../src/config/config';
import * as dotenv from 'dotenv';

describe('Config', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.BLOCKLOG_API_KEY;
    delete process.env.BLOCKLOG_ENDPOINT;
    delete process.env.BLOCKLOG_BATCH_SIZE;
    delete process.env.BLOCKLOG_FLUSH_INTERVAL;
    delete process.env.BLOCKLOG_TIMEOUT;
    delete process.env.BLOCKLOG_RETRY_COUNT;
    delete process.env.BLOCKLOG_ENABLE_SIGNING;
    delete process.env.BLOCKLOG_ENABLE_COMPRESSION;
    delete process.env.BLOCKLOG_DEBUG;
    delete process.env.BLOCKLOG_SIGNING_KEY;
    delete process.env.BLOCKLOG_SIGNING_ALG;
  });

  describe('Defaults', () => {
    it('should produce valid defaults with minimal config', () => {
      const config = resolveConfig({ apiKey: 'test-key' });
      
      expect(config.apiKey).toBe('test-key');
      expect(config.endpoint).toBeDefined();
      expect(config.batchSize).toBeGreaterThan(0);
      expect(config.flushInterval).toBeGreaterThan(0);
      expect(config.timeout).toBeGreaterThan(0);
      expect(config.retryCount).toBeGreaterThanOrEqual(0);
      expect(typeof config.enableSigning).toBe('boolean');
      expect(typeof config.enableCompression).toBe('boolean');
      expect(typeof config.debug).toBe('boolean');
    });

    it('should use default endpoint when not specified', () => {
      const config = resolveConfig({ apiKey: 'test-key' });
      expect(config.endpoint).toBe('https://api.blocklog.ai');
    });

    it('should use default batch size when not specified', () => {
      const config = resolveConfig({ apiKey: 'test-key' });
      expect(config.batchSize).toBe(100);
    });

    it('should use default flush interval when not specified', () => {
      const config = resolveConfig({ apiKey: 'test-key' });
      expect(config.flushInterval).toBe(5000);
    });
  });

  describe('Overrides', () => {
    it('should allow constructor value overrides', () => {
      const config = resolveConfig({
        apiKey: 'test-key',
        endpoint: 'https://custom.endpoint.com',
        batchSize: 50,
        flushInterval: 10000,
      });
      
      expect(config.apiKey).toBe('test-key');
      expect(config.endpoint).toBe('https://custom.endpoint.com');
      expect(config.batchSize).toBe(50);
      expect(config.flushInterval).toBe(10000);
    });

    it('should allow environment variable overrides', () => {
      process.env.BLOCKLOG_API_KEY = 'env-key';
      process.env.BLOCKLOG_ENDPOINT = 'https://env.endpoint.com';
      process.env.BLOCKLOG_BATCH_SIZE = '75';
      
      const config = resolveConfig({});
      
      expect(config.apiKey).toBe('env-key');
      expect(config.endpoint).toBe('https://env.endpoint.com');
      expect(config.batchSize).toBe(75);
    });

    it('should prioritize constructor values over environment variables', () => {
      process.env.BLOCKLOG_API_KEY = 'env-key';
      process.env.BLOCKLOG_BATCH_SIZE = '75';
      
      const config = resolveConfig({
        apiKey: 'constructor-key',
        batchSize: 50,
      });
      
      expect(config.apiKey).toBe('constructor-key');
      expect(config.batchSize).toBe(50);
    });

    it('should handle boolean environment variables correctly', () => {
      process.env.BLOCKLOG_ENABLE_SIGNING = 'true';
      process.env.BLOCKLOG_DEBUG = 'false';
      
      const config = resolveConfig({ apiKey: 'test-key' });
      
      expect(config.enableSigning).toBe(true);
      expect(config.debug).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should fail when API key is missing', () => {
      expect(() => {
        resolveConfig({} as any);
      }).toThrow();
    });

    it('should fail when API key is empty string', () => {
      expect(() => {
        resolveConfig({ apiKey: '' } as any);
      }).toThrow();
    });

    it('should fail when endpoint is invalid URL', () => {
      expect(() => {
        resolveConfig({ apiKey: 'test-key', endpoint: 'not-a-url' } as any);
      }).toThrow();
    });

    it('should fail when batch size is negative', () => {
      expect(() => {
        resolveConfig({ apiKey: 'test-key', batchSize: -10 } as any);
      }).toThrow();
    });

    it('should fail when batch size is zero', () => {
      expect(() => {
        resolveConfig({ apiKey: 'test-key', batchSize: 0 } as any);
      }).toThrow();
    });

    it('should fail when flush interval is negative', () => {
      expect(() => {
        resolveConfig({ apiKey: 'test-key', flushInterval: -100 } as any);
      }).toThrow();
    });

    it('should fail when timeout is negative', () => {
      expect(() => {
        resolveConfig({ apiKey: 'test-key', timeout: -5000 } as any);
      }).toThrow();
    });

    it('should fail when retry count is negative', () => {
      expect(() => {
        resolveConfig({ apiKey: 'test-key', retryCount: -1 } as any);
      }).toThrow();
    });

    it('should accept valid signing algorithms', () => {
      const config1 = resolveConfig({ apiKey: 'test-key', signingAlg: 'ed25519' });
      expect(config1.signingAlg).toBe('ed25519');
      
      const config2 = resolveConfig({ apiKey: 'test-key', signingAlg: 'hmac-sha256' });
      expect(config2.signingAlg).toBe('hmac-sha256');
    });

    it('should fail with invalid signing algorithm', () => {
      expect(() => {
        resolveConfig({ apiKey: 'test-key', signingAlg: 'invalid-alg' } as any);
      }).toThrow();
    });
  });
});
