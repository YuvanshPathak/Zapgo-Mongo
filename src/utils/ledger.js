// src/utils/ledger.js
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";

export function computeHash(block) {
  const str =
    String(block.index) +
    String(block.timestamp) +
    String(block.uid) +
    String(block.from) +
    String(block.to) +
    String(block.distance) +
    String(block.duration) +
    String(block.prevHash);

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}


export function createBlock(prevBlock, booking) {
  const block = {
    index: prevBlock ? prevBlock.index + 1 : 0,
    timestamp: Date.now(),

    uid: booking.uid || "",
    from: booking.start || booking.from || "",
    to: booking.destination || booking.to || "",
    distance: String(booking.distance || booking.dist || ""),
    duration: String(booking.durationHours || booking.time || ""),

    prevHash: prevBlock ? prevBlock.hash : "0",
  };

  block.hash = computeHash(block);
  return block;
}


export function verifyChain(chain) {
  if (!Array.isArray(chain)) return false;
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1];
    const curr = chain[i];

    const checkHash = computeHash(curr);
    if (curr.prevHash !== prev.hash || curr.hash !== checkHash) {
      return false;
    }
  }
  return true;
}

// backward-compatible aliases expected by other files
export const computeHashForBlock = computeHash;

export function getLastBlockHash(chain = []) {
  if (!Array.isArray(chain) || chain.length === 0) return "0";
  const last = chain[chain.length - 1];
  return last.hash || computeHash(last);
}

export async function getLastBlock(db) {
  const q = query(collection(db, "ledger"), orderBy("index", "desc"), limit(1));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  return snap.docs[0].data();
}

