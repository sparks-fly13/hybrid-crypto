# Hybrid Crypto Full Stack Example

This example demonstrates how to use the `hybrid-crypto-js` library in a full-stack Node.js application.

## Structure

- **Backend**: A Node.js HTTP server that manages its own RSA key pair, exposes its Public Key, and handles decryption of client messages and encryption of secret messages for clients.
- **Frontend**: A simple HTML/JS page that generates a client-side RSA key pair, fetches the server's Public Key, and demonstrates secure 2-way communication.

## Running the Example

1. Ensure you are in the root of the repository.
2. Run the server:
   ```bash
   node examples/full-stack/backend/server.js
   ```
3. Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

## How it works

1. **Client -> Server Encryption**:
   - The Client fetches the Server's Public Key.
   - The Client encrypts a message using `encrypt(message, serverPublicKey)`.
   - The Client sends the encrypted package to the Server.
   - The Server decrypts it using its Private Key.

2. **Server -> Client Encryption**:
   - The Client sends its Public Key to the Server.
   - The Server encrypts a message using `encrypt(message, clientPublicKey)`.
   - The Server sends the encrypted package to the Client.
   - The Client decrypts it using its Private Key.
