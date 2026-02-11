# @pulkitsinha007/hybrid-crypto-js

A robust hybrid encryption library for high-security applications, implementing industry-standard **RSA-OAEP** and **AES-GCM** algorithms. This package is designed to facilitate secure, two-way communication by combining the performance of symmetric encryption with the security of asymmetric key exchange, ensuring the symmetric key is never exposed in its unwrapped form during transit.

## Installation

```bash
npm install @pulkitsinha007/hybrid-crypto-js
```

## Overview

This package is ideal for scenarios requiring end-to-end encryption where:
- **High Security** is paramount (e.g., financial data, personal identifiable information).
- **Industry Standards** must be met (utilizing native Web Crypto API and Node.js Crypto).
- **Two-way Communication** is needed, allowing the server to respond securely using the same session key established by the client.

## API Documentation

### `generateKeyPair()`
Generates a new RSA-OAEP key pair (2048-bit).
- **Returns**: `Promise<{publicKey: string, privateKey: string}>` (Base64 encoded)

```javascript
import { generateKeyPair } from '@pulkitsinha007/hybrid-crypto-js';

const { publicKey, privateKey } = await generateKeyPair();
console.log('Public Key:', publicKey);
```

### `createSymmetricKey()`
Generates a random AES-GCM symmetric key (256-bit).
- **Returns**: `Promise<CryptoKey>`

```javascript
import { createSymmetricKey } from '@pulkitsinha007/hybrid-crypto-js';

const sessionKey = await createSymmetricKey();
```

### `wrapKey(key, publicKey)`
Encrypts (wraps) a symmetric key using an RSA public key.
- **Parameters**:
  - `key`: `CryptoKey` - The symmetric key to wrap.
  - `publicKey`: `string` - The RSA public key (Base64).
- **Returns**: `Promise<string>` (Base64 encoded wrapped key)

```javascript
import { wrapKey } from '@pulkitsinha007/hybrid-crypto-js';

const wrappedKey = await wrapKey(sessionKey, serverPublicKey);
```

### `unwrapKey(wrappedKey, privateKey)`
Decrypts (unwraps) a symmetric key using an RSA private key.
- **Parameters**:
  - `wrappedKey`: `string` - The wrapped key (Base64).
  - `privateKey`: `string` - The RSA private key (Base64).
- **Returns**: `Promise<CryptoKey>`

```javascript
import { unwrapKey } from '@pulkitsinha007/hybrid-crypto-js';

const sessionKey = await unwrapKey(wrappedKey, serverPrivateKey);
```

### `encryptWithSymmetricKey(data, key)`
Encrypts data using an AES symmetric key.
- **Parameters**:
  - `data`: `string | object` - The payload to encrypt.
  - `key`: `CryptoKey` - The AES key.
- **Returns**: `Promise<{encryptedData: string, iv: string}>`

```javascript
import { encryptWithSymmetricKey } from '@pulkitsinha007/hybrid-crypto-js';

const { encryptedData, iv } = await encryptWithSymmetricKey({ msg: "Hello" }, sessionKey);
```

### `decryptWithSymmetricKey(encryptedPackage, key)`
Decrypts data using an AES symmetric key.
- **Parameters**:
  - `encryptedPackage`: `{encryptedData: string, iv: string}`.
  - `key`: `CryptoKey`.
- **Returns**: `Promise<string | object>`

```javascript
import { decryptWithSymmetricKey } from '@pulkitsinha007/hybrid-crypto-js';

const data = await decryptWithSymmetricKey({ encryptedData, iv }, sessionKey);
```

### `encryptAsymmetric(data, publicKey)`
Encrypts data directly using an RSA public key.
- **Parameters**:
  - `data`: `string | object` - The payload to encrypt.
  - `publicKey`: `string` - The RSA public key (Base64).
- **Returns**: `Promise<string>` (Base64 encoded)

```javascript
import { encryptAsymmetric } from '@pulkitsinha007/hybrid-crypto-js';

const encryptedData = await encryptAsymmetric({ secret: "data" }, publicKey);
```

### `decryptAsymmetric(encryptedData, privateKey)`
Decrypts data directly using an RSA private key.
- **Parameters**:
  - `encryptedData`: `string` - The encrypted data (Base64).
  - `privateKey`: `string` - The RSA private key (Base64).
- **Returns**: `Promise<string | object>`

```javascript
import { decryptAsymmetric } from '@pulkitsinha007/hybrid-crypto-js';

const data = await decryptAsymmetric(encryptedData, privateKey);
```

### `getCustomSymmetricKey(inputKey)`
Provides a Crypto Key by taking custom a base string key as the input.
- **Parameter**:
  - `inputKey`: `string` - Base key string supposed to be used for encoding.
  - `options`: `Object` - Optional Configuration.
  - `options.extractable`: `Boolean`: `Default: false` - Whether the key can be exported.
- **Returns**: `Promise<CryptoKey>`

```javascript
import { getCustomSymmetricKey } from '@pulkitsinha007/hybrid-crypto-js';

const data = await getCustomSymmetricKey(inputKey);
```

---

## Backend Setup (Dummy Application)

This section demonstrates how to set up a simple backend (e.g., using Node.js/Express) that generates an RSA key pair on startup and handles secure requests.

```javascript
import http from 'http';
import {
    generateKeyPair,
    unwrapKey,
    decryptWithSymmetricKey,
    encryptWithSymmetricKey
} from '@pulkitsinha007/hybrid-crypto-js';

let publicKey, privateKey;

// 1. Generate RSA Keys on Startup
(async () => {
    const keys = await generateKeyPair();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    console.log('Server keys ready.');
})();

const server = http.createServer(async (req, res) => {
    // 2. Expose Public Key Endpoint
    if (req.url === '/api/public-key' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ publicKey }));
        return;
    }

    // 3. Handle Secure Submission
    if (req.url === '/api/submit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { wrappedKey, encryptedPackage } = JSON.parse(body);

                // A. Unwrap the session key using Server Private Key
                const sessionKey = await unwrapKey(wrappedKey, privateKey);

                // B. Decrypt the client's message
                const decryptedData = await decryptWithSymmetricKey(encryptedPackage, sessionKey);
                console.log('Received:', decryptedData);

                // C. Process data and prepare response
                const responseData = { status: 'received', timestamp: Date.now() };

                // D. Encrypt response using the SAME session key
                const encryptedResponse = await encryptWithSymmetricKey(responseData, sessionKey);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ encryptedResponse }));
            } catch (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    }
});

server.listen(3000, () => console.log('Server running on port 3000'));
```

## Frontend Setup

This section demonstrates the client-side logic to establish a secure session.

```javascript
import {
    createSymmetricKey,
    wrapKey,
    encryptWithSymmetricKey,
    decryptWithSymmetricKey
} from '@pulkitsinha007/hybrid-crypto-js';

async function sendSecureMessage(message) {
    // 1. Fetch Server Public Key
    const res = await fetch('http://localhost:3000/api/public-key');
    const { publicKey } = await res.json();

    // 2. Create a fresh Session Key (AES)
    const sessionKey = await createSymmetricKey();

    // 3. Wrap (Encrypt) the Session Key with Server's Public Key
    const wrappedKey = await wrapKey(sessionKey, publicKey);

    // 4. Encrypt the payload with the Session Key
    const encryptedPackage = await encryptWithSymmetricKey(message, sessionKey);

    // 5. Send both to the server
    const postRes = await fetch('http://localhost:3000/api/submit', {
        method: 'POST',
        body: JSON.stringify({
            wrappedKey,
            encryptedPackage
        })
    });

    // 6. Receive and Decrypt Response (using the same Session Key)
    const { encryptedResponse } = await postRes.json();
    const responseData = await decryptWithSymmetricKey(encryptedResponse, sessionKey);

    console.log('Server Response:', responseData);
}

sendSecureMessage({ hello: "world" });
```
