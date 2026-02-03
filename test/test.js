import { test, describe, it, before } from 'node:test';
import assert from 'node:assert';
import { generateKeyPair, encrypt, decrypt } from '../src/index.js';

describe('Hybrid Crypto Package', () => {
  let publicKey;
  let privateKey;

  before(async () => {
    // Generate keys once for all tests
    const keys = await generateKeyPair();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    
    assert.ok(publicKey.includes('BEGIN PUBLIC KEY'));
    assert.ok(privateKey.includes('BEGIN PRIVATE KEY'));
  });

  it('should encrypt and decrypt a string payload', async () => {
    const payload = "Hello, World!";
    
    const encryptedPackage = await encrypt(payload, publicKey);
    
    assert.ok(encryptedPackage.encryptedData);
    assert.ok(encryptedPackage.encryptedKey);
    assert.ok(encryptedPackage.iv);
    
    const decrypted = await decrypt(encryptedPackage, privateKey);
    assert.strictEqual(decrypted, payload);
  });

  it('should encrypt and decrypt an object payload', async () => {
    const payload = {
      user: "Alice",
      id: 12345,
      roles: ["admin", "editor"]
    };
    
    const encryptedPackage = await encrypt(payload, publicKey);
    const decrypted = await decrypt(encryptedPackage, privateKey);
    
    assert.deepStrictEqual(decrypted, payload);
  });

  it('should fail to decrypt with wrong private key', async () => {
    const payload = "Secret Data";
    const encryptedPackage = await encrypt(payload, publicKey);
    
    // Generate a different key pair
    const otherKeys = await generateKeyPair();
    
    await assert.rejects(async () => {
      await decrypt(encryptedPackage, otherKeys.privateKey);
    });
  });

  it('should fail to decrypt tampered data', async () => {
    const payload = "Secret Data";
    const encryptedPackage = await encrypt(payload, publicKey);
    
    // Tamper with encrypted data (change first char of base64)
    const tamperedData = 'A' + encryptedPackage.encryptedData.slice(1);
    
    const tamperedPackage = {
      ...encryptedPackage,
      encryptedData: tamperedData
    };
    
    await assert.rejects(async () => {
      await decrypt(tamperedPackage, privateKey);
    });
  });
});
