import { describe, it, expect } from 'vitest';
import { canonicalize } from '../src/signing/canonical';
import { hashSignHmac, hashSignEd25519 } from '../src/signing/crypto';
import { generateKeyPairSync } from 'crypto';

describe('Cryptography', () => {
  it('should canonicalize objects correctly', () => {
    const obj1 = { b: 2, a: 1 };
    const obj2 = { a: 1, b: 2 };
    expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    expect(canonicalize(obj1)).toBe('{"a":1,"b":2}');
  });

  it('should handle nested arrays and objects', () => {
    const obj = { b: [3, 2, { z: 1, y: 2 }], a: null };
    expect(canonicalize(obj)).toBe('{"a":null,"b":[3,2,{"y":2,"z":1}]}');
  });

  it('should sign using HMAC-SHA256', () => {
    const payload = { test: 'data' };
    const key = 'secret_key';
    const signature = hashSignHmac(payload, key);
    expect(typeof signature).toBe('string');
    expect(signature.length).toBe(64); // hex representation of 32 bytes
  });

  it('should sign using Ed25519', () => {
    const { privateKey } = generateKeyPairSync('ed25519');
    const privateKeyStr = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    
    const payload = { test: 'data' };
    const signature = hashSignEd25519(payload, privateKeyStr);
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  });
});
