import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateKeyPair,
  encryptAsymmetric,
  decryptAsymmetric
} from '../src/index.js';

describe('Asymmetric Encryption (RSA-OAEP)', () => {
  it('should encrypt and decrypt a plain string', async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    const originalData = "Hello, Asymmetric World!";

    const encryptedData = await encryptAsymmetric(originalData, publicKey);
    assert.notStrictEqual(encryptedData, originalData);

    const decryptedData = await decryptAsymmetric(encryptedData, privateKey);
    assert.strictEqual(decryptedData, originalData);
  });

  it('should encrypt and decrypt a JSON object', async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    const originalData = { foo: "bar", baz: 123 };

    const encryptedData = await encryptAsymmetric(originalData, publicKey);
    const decryptedData = await decryptAsymmetric(encryptedData, privateKey);

    assert.deepStrictEqual(decryptedData, originalData);
  });

  it('should fail to decrypt with the wrong private key', async () => {
    const keys1 = await generateKeyPair();
    const keys2 = await generateKeyPair();

    const originalData = "Secret message";
    const encryptedData = await encryptAsymmetric(originalData, keys1.publicKey);

    await assert.rejects(
      () => decryptAsymmetric(encryptedData, keys2.privateKey),
      /OperationError|DataError/
    );
  });
});
