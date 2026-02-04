import {
    createSymmetricKey,
    wrapKey,
    encryptWithSymmetricKey,
    decryptWithSymmetricKey
} from '/src/index.js';

let serverPublicKey;

const statusMain = document.getElementById('status-main');

async function init() {
    try {
        // 1. Fetch Server Public Key (Client doesn't need its own RSA key pair anymore)
        const res = await fetch('/api/public-key');
        const data = await res.json();
        serverPublicKey = data.publicKey;
        console.log('Server public key fetched.');

        statusMain.textContent = 'Ready. Server Public Key initialized.';
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
        resultDiv.innerHTML = 'Generating Session Key & Encrypting...';

        // 1. Generate a fresh AES Session Key
        const sessionKey = await createSymmetricKey();

        // 2. Wrap the session key with Server's Public Key
        const wrappedKey = await wrapKey(sessionKey, serverPublicKey);

        // 3. Encrypt the payload with the Session Key
        const encryptedPackage = await encryptWithSymmetricKey(input, sessionKey);

        resultDiv.innerHTML += '<br>Sending wrapped key & encrypted package...';

        const res = await fetch('/api/submit', {
            method: 'POST',
            body: JSON.stringify({
                wrappedKey,
                encryptedPackage
            })
        });

        const data = await res.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const { encryptedResponse } = data;

        resultDiv.innerHTML += '<br>Received encrypted response. Decrypting with Session Key...';

        // 4. Decrypt the response with the SAME Session Key
        const decryptedResponse = await decryptWithSymmetricKey(encryptedResponse, sessionKey);

        resultDiv.innerHTML = `
            <strong>Status:</strong> Success<br>
            <strong>Server Response Decrypted:</strong> <pre>${JSON.stringify(decryptedResponse, null, 2)}</pre>
        `;
    } catch (err) {
        console.error(err);
        resultDiv.textContent = 'Error during session: ' + err.message;
    }
});

// Disable the old "Get Secret" button as it's not part of the new flow
const btnGet = document.getElementById('btn-get');
if (btnGet) {
    btnGet.disabled = true;
    btnGet.textContent = "Deprecated (See Session Flow above)";
    const resultGet = document.getElementById('result-get');
    if (resultGet) resultGet.textContent = "This feature is replaced by the bidirectional session flow above.";
}

init();
