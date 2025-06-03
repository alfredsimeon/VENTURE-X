const nacl = require('tweetnacl');
const bs58 = require('bs58');

// Returns `true` if signature is valid for given wallet and nonce
exports.verifySolanaSignature = (publicKey, nonce, signature) => {
  try {
    const message = new TextEncoder().encode(nonce);
    const pubkeyUint = bs58.decode(publicKey);
    const sigUint = bs58.decode(signature);
    return nacl.sign.detached.verify(message, sigUint, pubkeyUint);
  } catch {
    return false;
  }
};