import { test, describe, it, before } from 'node:test';
import assert from 'node:assert';
import {
  generateKeyPair,
  createSymmetricKey,
  wrapKey,
  unwrapKey,
  encryptWithSymmetricKey,
  decryptWithSymmetricKey
} from '../src/index.js';

describe('New Hybrid Flow (Session Based)', () => {
  let backendPublicKey;
  let backendPrivateKey;

  before(async () => {
    // 1. Backend setup: Generate RSA Key Pair
    const keys = await generateKeyPair();
    backendPublicKey = keys.publicKey;
    backendPrivateKey = keys.privateKey;
  });

  it('should successfully complete the full session flow', async () => {
    const clientPayload = "Request: Give me the secret";
    const serverResponsePayload = "Response: Here is the secret [12345]";

    // --- FRONTEND SIDE (Request) ---

    // 2. Client generates AES key
    const clientAesKey = await createSymmetricKey();

    // 3. Client wraps AES key with Backend Public Key
    const wrappedKey = await wrapKey(clientAesKey, backendPublicKey);

    // 4. Client encrypts payload with AES key
    const clientEncryptedPackage = await encryptWithSymmetricKey(clientPayload, clientAesKey);

    // Client sends { wrappedKey, encryptedPayload: ... } to backend

    // --- BACKEND SIDE ---

    // 5. Backend receives package. Unwraps AES key.
    const serverAesKey = await unwrapKey(wrappedKey, backendPrivateKey);

    // 6. Backend decrypts payload
    const decryptedRequest = await decryptWithSymmetricKey(clientEncryptedPackage, serverAesKey);
    assert.strictEqual(decryptedRequest, clientPayload, "Backend failed to decrypt client request");

    // 7. Backend encrypts response with SAME AES key
    const serverEncryptedPackage = await encryptWithSymmetricKey(serverResponsePayload, serverAesKey);

    // Backend sends { encryptedResponse: ... } to client

    // --- FRONTEND SIDE (Response) ---

    // 8. Client receives encrypted response. Decrypts with original AES key.
    const decryptedResponse = await decryptWithSymmetricKey(serverEncryptedPackage, clientAesKey);
    assert.strictEqual(decryptedResponse, serverResponsePayload, "Client failed to decrypt server response");
  });
});
