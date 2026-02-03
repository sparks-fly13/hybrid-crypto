import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateKeyPair, decrypt, encrypt } from '../../../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Store keys in memory
let publicKey;
let privateKey;

// Initialize keys
(async () => {
    try {
        console.log('Generating server keys...');
        const keys = await generateKeyPair();
        publicKey = keys.publicKey;
        privateKey = keys.privateKey;
        console.log('Server keys generated.');
    } catch (err) {
        console.error('Failed to generate keys:', err);
        process.exit(1);
    }
})();

const server = http.createServer(async (req, res) => {
    // CORS headers for development convenience
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // API Endpoints
    if (url.pathname === '/api/public-key' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ publicKey }));
        return;
    }

    if (url.pathname === '/api/submit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { encryptedPackage } = JSON.parse(body);
                const decrypted = await decrypt(encryptedPackage, privateKey);
                console.log('Decrypted message from client:', decrypted);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', message: 'Message received and decrypted', decrypted }));
            } catch (err) {
                console.error('Decryption failed:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Decryption failed' }));
            }
        });
        return;
    }

    if (url.pathname === '/api/secret' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { clientPublicKey } = JSON.parse(body);
                const secretMessage = "This is a top secret message from the server! Timestamp: " + Date.now();
                const encryptedPackage = await encrypt(secretMessage, clientPublicKey);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ encryptedPackage }));
            } catch (err) {
                console.error('Encryption failed:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Encryption failed' }));
            }
        });
        return;
    }

    // Static File Serving
    let filePath;
    if (url.pathname === '/') {
        filePath = path.join(__dirname, '../frontend/index.html');
    } else if (url.pathname === '/client.js') {
        filePath = path.join(__dirname, '../frontend/client.js');
    } else if (url.pathname.startsWith('/src/')) {
        // Map /src/xxx to ../../../src/xxx
        const relativePath = url.pathname.replace('/src/', '');
        filePath = path.join(__dirname, '../../../src', relativePath);
    } else {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }

    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log('404 Not Found:', filePath);
                res.writeHead(404);
                res.end('Not Found');
            } else {
                console.error('500 Server Error:', err);
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
