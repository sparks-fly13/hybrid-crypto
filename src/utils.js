// Utility functions for Hybrid Crypto Package

/**
 * Converts a string to an ArrayBuffer using TextEncoder.
 * @param {string} str - The string to convert.
 * @returns {ArrayBuffer} The resulting ArrayBuffer.
 */
export function str2ab(str) {
  return new TextEncoder().encode(str);
}

/**
 * Converts an ArrayBuffer to a string using TextDecoder.
 * @param {ArrayBuffer} buf - The buffer to convert.
 * @returns {string} The resulting string.
 */
export function ab2str(buf) {
  return new TextDecoder().decode(buf);
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 * @param {ArrayBuffer} buf - The buffer to convert.
 * @returns {string} Base64 string.
 */
export function arrayBufferToBase64(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 * @param {string} base64 - The Base64 string.
 * @returns {ArrayBuffer} The resulting ArrayBuffer.
 */
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converts a PEM formatted string to an ArrayBuffer.
 * @param {string} pem - The PEM string.
 * @returns {ArrayBuffer} The raw key data.
 */
export function pemToArrayBuffer(pem) {
  // Remove headers, footers, and newlines
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s/g, ''); // Removes all whitespace including newlines
  return base64ToArrayBuffer(b64);
}

/**
 * Converts an ArrayBuffer to a PEM formatted string.
 * @param {ArrayBuffer} buf - The raw key data.
 * @param {string} type - The key type (e.g., 'PUBLIC KEY', 'PRIVATE KEY').
 * @returns {string} The PEM string.
 */
export function arrayBufferToPem(buf, type) {
  const b64 = arrayBufferToBase64(buf);
  const pemString = `-----BEGIN ${type}-----\n` +
    b64.match(/.{1,64}/g).join('\n') +
    `\n-----END ${type}-----\n`;
  return pemString;
}
