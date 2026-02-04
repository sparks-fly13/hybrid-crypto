/**
 * Converts a string to an ArrayBuffer using TextEncoder.
 * @param str - The string to convert.
 * @returns The resulting ArrayBuffer.
 */
export function str2ab(str: string): ArrayBuffer;

/**
 * Converts an ArrayBuffer to a string using TextDecoder.
 * @param buf - The buffer to convert.
 * @returns The resulting string.
 */
export function ab2str(buf: ArrayBuffer): string;

/**
 * Converts an ArrayBuffer to a Base64 string.
 * @param buf - The buffer to convert.
 * @returns Base64 string.
 */
export function arrayBufferToBase64(buf: ArrayBuffer): string;

/**
 * Converts a Base64 string to an ArrayBuffer.
 * @param base64 - The Base64 string.
 * @returns The resulting ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer;

/**
 * Converts a PEM formatted string to an ArrayBuffer.
 * @param pem - The PEM string.
 * @returns The raw key data.
 */
export function pemToArrayBuffer(pem: string): ArrayBuffer;

/**
 * Converts an ArrayBuffer to a PEM formatted string.
 * @param buf - The raw key data.
 * @param type - The key type (e.g., 'PUBLIC KEY', 'PRIVATE KEY').
 * @returns The PEM string.
 */
export function arrayBufferToPem(buf: ArrayBuffer, type: string): string;

/**
 * Generates an RSA-OAEP key pair.
 * @returns Base64 formatted keys (Raw).
 */
export function generateKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
}>;

/**
 * Generates a symmetric AES-GCM key.
 * @returns The generated AES key.
 */
export function createSymmetricKey(): Promise<CryptoKey>;

/**
 * Encrypts data using a specific symmetric key.
 * @param data - The payload to encrypt.
 * @param key - The AES key to use.
 */
export function encryptWithSymmetricKey(data: string | object, key: CryptoKey): Promise<{
    encryptedData: string;
    iv: string;
}>;

/**
 * Decrypts data using a specific symmetric key.
 * @param encryptedPackage - { encryptedData, iv }
 * @param key - The AES key to use.
 * @returns The decrypted payload.
 */
export function decryptWithSymmetricKey<T = any>(encryptedPackage: {
    encryptedData: string;
    iv: string;
}, key: CryptoKey): Promise<T>;

/**
 * Wraps (encrypts) a symmetric key with an RSA public key.
 * @param key - The symmetric key to wrap.
 * @param publicKey - The RSA public key (Base64).
 * @returns The wrapped key as Base64 string.
 */
export function wrapKey(key: CryptoKey, publicKey: string): Promise<string>;

/**
 * Unwraps (decrypts) a symmetric key with an RSA private key.
 * @param wrappedKey - The wrapped key (Base64).
 * @param privateKey - The RSA private key (Base64).
 * @returns The unwrapped AES key.
 */
export function unwrapKey(wrappedKey: string, privateKey: string): Promise<CryptoKey>;

/**
 * Encrypts data using hybrid encryption (Generates new AES key).
 * @param data - The payload to encrypt.
 * @param publicKey - The backend's public RSA key (Base64).
 */
export function encrypt(data: string | object, publicKey: string): Promise<{
    encryptedData: string;
    encryptedKey: string;
    iv: string;
}>;

/**
 * Decrypts data using hybrid encryption.
 * @param encryptedPackage - The encrypted package { encryptedData, encryptedKey, iv }.
 * @param privateKey - The backend's private RSA key (Base64).
 * @returns The decrypted payload.
 */
export function decrypt<T = any>(encryptedPackage: {
    encryptedData: string;
    encryptedKey: string;
    iv: string;
}, privateKey: string): Promise<T>;
