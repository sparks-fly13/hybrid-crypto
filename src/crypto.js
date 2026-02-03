import {
  str2ab,
  ab2str,
  pemToArrayBuffer,
  arrayBufferToPem,
  arrayBufferToBase64,
  base64ToArrayBuffer
} from './utils.js';

function getCrypto() {
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto;
  }
  // Fallback for environments where crypto is not global (older Node)
  // This might not work with static imports in pure browser environments without bundlers/polyfills
  // but for modern Node and Browser, globalThis.crypto is standard.
  throw new Error('Web Crypto API is not available in this environment.');
}

const RSA_ALGO = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: "SHA-256"
};

const AES_ALGO = {
  name: "AES-GCM",
  length: 256
};

/**
 * Generates an RSA-OAEP key pair.
 * @returns {Promise<{publicKey: string, privateKey: string}>} PEM formatted keys.
 */
export async function generateKeyPair() {
  const crypto = getCrypto();
  const keyPair = await crypto.subtle.generateKey(
    RSA_ALGO,
    true, // extractable
    ["encrypt", "decrypt"]
  );

  const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: arrayBufferToPem(publicKeyBuffer, "PUBLIC KEY"),
    privateKey: arrayBufferToPem(privateKeyBuffer, "PRIVATE KEY")
  };
}

/**
 * Encrypts data using hybrid encryption.
 * @param {string|object} data - The payload to encrypt.
 * @param {string} publicKeyPEM - The backend's public RSA key (PEM).
 * @returns {Promise<{encryptedData: string, encryptedKey: string, iv: string}>}
 */
export async function encrypt(data, publicKeyPEM) {
  const crypto = getCrypto();
  
  // 1. Prepare data
  const payloadStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const payloadBuffer = str2ab(payloadStr);

  // 2. Import RSA Public Key
  const rsaKeyBuffer = pemToArrayBuffer(publicKeyPEM);
  const rsaPublicKey = await crypto.subtle.importKey(
    "spki",
    rsaKeyBuffer,
    RSA_ALGO,
    false,
    ["encrypt"]
  );

  // 3. Generate AES Symmetric Key
  const aesKey = await crypto.subtle.generateKey(
    AES_ALGO,
    true, // extractable so we can encrypt it
    ["encrypt"]
  );

  // 4. Encrypt Payload with AES Key
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedPayload = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    payloadBuffer
  );

  // 5. Export AES Key
  const aesKeyRaw = await crypto.subtle.exportKey("raw", aesKey);

  // 6. Encrypt AES Key with RSA Public Key
  const encryptedAesKey = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    rsaPublicKey,
    aesKeyRaw
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedPayload),
    encryptedKey: arrayBufferToBase64(encryptedAesKey),
    iv: arrayBufferToBase64(iv)
  };
}

/**
 * Decrypts data using hybrid encryption.
 * @param {object} encryptedPackage - The encrypted package { encryptedData, encryptedKey, iv }.
 * @param {string} privateKeyPEM - The backend's private RSA key (PEM).
 * @returns {Promise<string|object>} The decrypted payload.
 */
export async function decrypt(encryptedPackage, privateKeyPEM) {
  const crypto = getCrypto();
  const { encryptedData, encryptedKey, iv } = encryptedPackage;

  // 1. Import RSA Private Key
  const rsaKeyBuffer = pemToArrayBuffer(privateKeyPEM);
  const rsaPrivateKey = await crypto.subtle.importKey(
    "pkcs8",
    rsaKeyBuffer,
    RSA_ALGO,
    false,
    ["decrypt"]
  );

  // 2. Decrypt AES Key
  const aesKeyRaw = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    rsaPrivateKey,
    base64ToArrayBuffer(encryptedKey)
  );

  // 3. Import AES Key
  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesKeyRaw,
    AES_ALGO,
    false,
    ["decrypt"]
  );

  // 4. Decrypt Payload
  const decryptedPayloadBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToArrayBuffer(iv)
    },
    aesKey,
    base64ToArrayBuffer(encryptedData)
  );

  const payloadStr = ab2str(decryptedPayloadBuffer);

  try {
    return JSON.parse(payloadStr);
  } catch (e) {
    return payloadStr;
  }
}
