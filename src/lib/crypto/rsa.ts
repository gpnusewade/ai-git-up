const ALGORITHM = { name: 'RSA-OAEP', hash: 'SHA-256' };

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as unknown as Crypto;
  }
  throw new Error('Crypto API not available');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  const spki = pemToArrayBuffer(pem);
  return getCrypto().subtle.importKey('spki', spki, ALGORITHM, false, ['encrypt']);
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pkcs8 = pemToArrayBuffer(pem);
  return getCrypto().subtle.importKey('pkcs8', pkcs8, ALGORITHM, false, ['decrypt']);
}

export async function encrypt(publicKeyPem: string, data: string): Promise<string> {
  const publicKey = await importPublicKey(publicKeyPem);
  const encoded = new TextEncoder().encode(data);
  const encrypted = await getCrypto().subtle.encrypt(ALGORITHM, publicKey, encoded);
  return arrayBufferToBase64(encrypted);
}

export async function decrypt(privateKeyPem: string, encryptedBase64: string): Promise<string> {
  const privateKey = await importPrivateKey(privateKeyPem);
  const encrypted = new Uint8Array(
    atob(encryptedBase64)
      .split('')
      .map((c) => c.charCodeAt(0))
  );
  const decrypted = await getCrypto().subtle.decrypt(ALGORITHM, privateKey, encrypted);
  return new TextDecoder().decode(decrypted);
}
