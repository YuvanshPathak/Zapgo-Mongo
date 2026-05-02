// server/utils/chainHash.js
// Pure hash utilities shared by the ledger controller.
// Must match the algorithm in client/src/utils/ledger.js exactly
// so that blocks created by the server can still be verified
// client-side in the Admin Dashboard.

/**
 * Polynomial rolling hash over the concatenated block fields.
 * Returns a lowercase hex string.
 */
function computeHash(block) {
  const str =
    String(block.index)     +
    String(block.timestamp) +
    String(block.uid)       +
    String(block.from)      +
    String(block.to)        +
    String(block.distance)  +
    String(block.duration)  +
    String(block.prevHash);

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

/**
 * Validates the entire chain:
 * - Each block's prevHash must equal the previous block's hash.
 * - Each block's hash must match the recomputed hash.
 */
function verifyChain(chain) {
  if (!Array.isArray(chain) || chain.length === 0) return true;
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1];
    const curr = chain[i];
    if (curr.prevHash !== prev.hash) return false;
    if (curr.hash !== computeHash(curr))  return false;
  }
  return true;
}

module.exports = { computeHash, verifyChain };
