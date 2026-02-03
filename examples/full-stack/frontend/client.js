import { generateKeyPair, encrypt, decrypt } from '/src/index.js';

let clientPublicKey;
let clientPrivateKey;
let serverPublicKey;

const statusMain = document.getElementById('status-main');

async function init() {
    try {
        // 1. Generate Client Keys
        const keys = await generateKeyPair();
        clientPublicKey = keys.publicKey;
        clientPrivateKey = keys.privateKey;
        console.log('Client keys generated.');

        // 2. Fetch Server Public Key
        const res = await fetch('/api/public-key');
        const data = await res.json();
        serverPublicKey = data.publicKey;
        console.log('Server public key fetched.');

        statusMain.textContent = 'Ready. Keys initialized.';
        statusMain.style.color = 'green';
    } catch (err) {
        console.error(err);
        statusMain.textContent = 'Error initializing keys. Check console.';
        statusMain.style.color = 'red';
    }
}

document.getElementById('btn-send').addEventListener('click', async () => {
    const input = document.getElementById('input-message').value;
    const resultDiv = document.getElementById('result-send');

    if (!input) {
        alert('Please enter a message');
        return;
    }

    try {
        resultDiv.innerHTML = 'Encrypting...';

        // Encrypt with Server's Public Key
        const encryptedPackage = await encrypt(input, serverPublicKey);

        resultDiv.innerHTML += '<br>Sending encrypted package...';

        const res = await fetch('/api/submit', {
            method: 'POST',
            body: JSON.stringify({ encryptedPackage })
        });

        const data = await res.json();

        resultDiv.innerHTML = `
            <strong>Status:</strong> ${data.status}<br>
            <strong>Server Decrypted:</strong> <pre>${data.decrypted}</pre>
        `;
    } catch (err) {
        console.error(err);
        resultDiv.textContent = 'Error sending message.';
    }
});

document.getElementById('btn-get').addEventListener('click', async () => {
    const resultDiv = document.getElementById('result-get');

    try {
        resultDiv.innerHTML = 'Requesting secret...';

        const res = await fetch('/api/secret', {
            method: 'POST',
            body: JSON.stringify({ clientPublicKey })
        });

        const data = await res.json();
        const { encryptedPackage } = data;

        resultDiv.innerHTML += '<br>Received encrypted package. Decrypting...';

        // Decrypt with Client's Private Key
        const decrypted = await decrypt(encryptedPackage, clientPrivateKey);

        resultDiv.innerHTML = `
            <strong>Decrypted Secret:</strong> <pre>${decrypted}</pre>
        `;
    } catch (err) {
        console.error(err);
        resultDiv.textContent = 'Error getting secret.';
    }
});

init();
