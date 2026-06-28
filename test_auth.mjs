const stored = "3e4fb082-5157-47ab-9a09-bbb8042ae313:15baa361ccd0a0c33531864b14e7e64776210d00f3171571e8f7f45093ebc9df";
const password = "password"; // maybe this is the password?
const [salt, expectedHash] = stored.split(':');
const data = new TextEncoder().encode(salt + password);
const hash = await crypto.subtle.digest('SHA-256', data);
const hex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
console.log({ hex, expectedHash, match: hex === expectedHash });
