import { createHmac, sign } from 'crypto';
import { canonicalize } from './canonical';

export function hashSignHmac(payload: Record<string, any>, privateKey: string): string {
  const canonicalPayload = canonicalize(payload);
  const hmac = createHmac('sha256', privateKey);
  hmac.update(canonicalPayload);
  return hmac.digest('hex');
}

export function hashSignEd25519(payload: Record<string, any>, privateKey: string): string {
  const canonicalPayload = canonicalize(payload);
  // privateKey is expected to be a PEM encoded Ed25519 private key
  const signature = sign(null, Buffer.from(canonicalPayload), privateKey);
  return signature.toString('hex');
}
