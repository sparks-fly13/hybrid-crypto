import {
  str2ab,
  ab2str,
  arrayBufferToBase64,
  base64ToArrayBuffer
} from './utils.js';

function getCrypto() {
  if (typeof globalThis.crypto !== 'undefined') {
    return globalThis.crypto;
  }
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
 * @returns {Promise<{publicKey: string, privateKey: string}>} Base64 formatted keys (Raw).
 */
export async function generateKeyPair() {
  const crypto = getCrypto();
  const keyPair = await crypto.subtle.generateKey(
    RSA_ALGO,
    true, // extractable
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );

  const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKeyBuffer),
    privateKey: arrayBufferToBase64(privateKeyBuffer)
  };
}

/**
 * Generates a symmetric AES-GCM key.
 * @returns {Promise<CryptoKey>} The generated AES key.
 */
export async function createSymmetricKey() {
  const crypto = getCrypto();
  return await crypto.subtle.generateKey(
    AES_ALGO,
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data using a specific symmetric key.
 * @param {string|object} data - The payload to encrypt.
 * @param {CryptoKey} key - The AES key to use.
 * @returns {Promise<{encryptedData: string, iv: string}>}
 */
export async function encryptWithSymmetricKey(data, key) {
  const crypto = getCrypto();
  const payloadStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const payloadBuffer = str2ab(payloadStr);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedPayload = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    payloadBuffer
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedPayload),
    iv: arrayBufferToBase64(iv)
  };
}

/**
 * Decrypts data using a specific symmetric key.
 * @param {object} encryptedPackage - { encryptedData, iv }
 * @param {CryptoKey} key - The AES key to use.
 * @returns {Promise<string|object>} The decrypted payload.
 */
export async function decryptWithSymmetricKey(encryptedPackage, key) {
  const crypto = getCrypto();
  const { encryptedData, iv } = encryptedPackage;

  const decryptedPayloadBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToArrayBuffer(iv)
    },
    key,
    base64ToArrayBuffer(encryptedData)
  );

  const payloadStr = ab2str(decryptedPayloadBuffer);

  try {
    return JSON.parse(payloadStr);
  } catch (e) {
    return payloadStr;
  }
}

/**
 * Wraps (encrypts) a symmetric key with an RSA public key.
 * @param {CryptoKey} key - The symmetric key to wrap.
 * @param {string} publicKey - The RSA public key (Base64).
 * @returns {Promise<string>} The wrapped key as Base64 string.
 */
export async function wrapKey(key, publicKey) {
  const crypto = getCrypto();
  const rsaKeyBuffer = base64ToArrayBuffer(publicKey);
  const rsaPublicKey = await crypto.subtle.importKey(
    "spki",
    rsaKeyBuffer,
    RSA_ALGO,
    false,
    ["wrapKey", "encrypt"]
  );

  // Note: RSA-OAEP wrapKey is effectively encrypting the exported key data.
  // Using wrapKey API:
  const wrappedKeyBuffer = await crypto.subtle.wrapKey(
    "raw",
    key,
    rsaPublicKey,
    {
      name: "RSA-OAEP"
    }
  );

  return arrayBufferToBase64(wrappedKeyBuffer);
}

/**
 * Unwraps (decrypts) a symmetric key with an RSA private key.
 * @param {string} wrappedKey - The wrapped key (Base64).
 * @param {string} privateKey - The RSA private key (Base64).
 * @returns {Promise<CryptoKey>} The unwrapped AES key.
 */
export async function unwrapKey(wrappedKey, privateKey) {
  const crypto = getCrypto();
  const rsaKeyBuffer = base64ToArrayBuffer(privateKey);
  const rsaPrivateKey = await crypto.subtle.importKey(
    "pkcs8",
    rsaKeyBuffer,
    RSA_ALGO,
    false,
    ["unwrapKey", "decrypt"]
  );

  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKey);

  const key = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBuffer,
    rsaPrivateKey,
    {
      name: "RSA-OAEP"
    },
    AES_ALGO,
    true,
    ["encrypt", "decrypt"]
  );

  return key;
}

/**
 * Encrypts data directly using an RSA public key (Asymmetric).
 * @param {string|object} data - The payload to encrypt.
 * @param {string} publicKey - The RSA public key (Base64).
 * @returns {Promise<string>} The encrypted data as Base64 string.
 */
export async function encryptAsymmetric(data, publicKey) {
  const crypto = getCrypto();
  const rsaKeyBuffer = base64ToArrayBuffer(publicKey);
  const rsaPublicKey = await crypto.subtle.importKey(
    "spki",
    rsaKeyBuffer,
    RSA_ALGO,
    false,
    ["encrypt"]
  );

  const payloadStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const payloadBuffer = str2ab(payloadStr);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    rsaPublicKey,
    payloadBuffer
  );

  return arrayBufferToBase64(encryptedBuffer);
}

/**
 * Decrypts data directly using an RSA private key (Asymmetric).
 * @param {string} encryptedData - The encrypted data (Base64).
 * @param {string} privateKey - The RSA private key (Base64).
 * @returns {Promise<string|object>} The decrypted payload.
 */
export async function decryptAsymmetric(encryptedData, privateKey) {
  const crypto = getCrypto();
  const rsaKeyBuffer = base64ToArrayBuffer(privateKey);
  const rsaPrivateKey = await crypto.subtle.importKey(
    "pkcs8",
    rsaKeyBuffer,
    RSA_ALGO,
    false,
    ["decrypt"]
  );

  const encryptedBuffer = base64ToArrayBuffer(encryptedData);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    rsaPrivateKey,
    encryptedBuffer
  );

  const payloadStr = ab2str(decryptedBuffer);

  try {
    return JSON.parse(payloadStr);
  } catch (e) {
    return payloadStr;
  }
}

/**
 * Provides a Crypto Key by taking a custom base string as the input
 * @param {string} inputKey - Base key string supposed to be used for encoding
 * @param {Object} [options] - Optional configuration.
 * @param {boolean} [options.extractable=false] - Whether the key can be exported.
 * @returns {Promise<CryptoKey>} The extractable AES encrypted Crypto Key
 */
export async function getCustomSymmetricKey(inputKey, options) {
  const {extractable = false} = options || {};
  const keyData = new TextEncoder().encode(inputKey.padEnd(32, '0').substring(0, 32));
  let symmetricKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    extractable,
    ['encrypt', 'decrypt']
  );
  return symmetricKey;
};