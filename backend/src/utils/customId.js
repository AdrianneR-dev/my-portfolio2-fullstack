import { customAlphabet } from 'nanoid';

// Lowercase alphanumeric, no ambiguous characters (0/O, 1/l/I removed) — safe to
// put in URLs and easy to read aloud/copy without confusion.
const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';

const nanoid = customAlphabet(alphabet, 12);

/**
 * Generates a short, unique, URL-safe custom ID, prefixed by resource type
 * so IDs are self-describing in logs and URLs (e.g. "prj_4f8h2k9m1n3p").
 * @param {string} prefix - short resource prefix, e.g. "prj", "skl", "msg", "usr", "lik"
 */
export function generateId(prefix) {
  if (!prefix || typeof prefix !== 'string') {
    throw new Error('generateId requires a string prefix');
  }
  return `${prefix}_${nanoid()}`;
}
