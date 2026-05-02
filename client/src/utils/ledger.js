// src/utils/ledger.js
// Pure blockchain hash utilities — no network calls, no Firebase.
// Block creation and persistence are now handled server-side via POST /api/ledger.
// These functions are kept here for client-side verification in the Admin Dashboard.

/**
 * Polynomial rolling hash over the concatenated block fields.
 * MUST stay in sync with server/utils/chainHash.js.
 */
export function computeHash(block) {
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

// Backward-compatible alias used by AdminDashboard
export const computeHashForBlock = computeHash;

/**
 * Validates an ordered chain of block objects.
 * Returns true only if every prevHash/hash link is intact.
 */
export function verifyChain(chain) {
  if (!Array.isArray(chain) || chain.length === 0) return true;
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1];
    const curr = chain[i];
    if (curr.prevHash !== prev.hash)      return false;
    if (curr.hash !== computeHash(curr))  return false;
  }
  return true;
}

/**
 * Returns the hash of the last block in an in-memory chain array.
 */
export function getLastBlockHash(chain = []) {
  if (!Array.isArray(chain) || chain.length === 0) return '0';
  const last = chain[chain.length - 1];
  return last.hash || computeHash(last);
}
