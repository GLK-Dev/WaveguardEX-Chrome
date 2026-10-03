// Refreshes the "malware" category of malicious-domains.json from the abuse.ch URLhaus host file
// (https://urlhaus.abuse.ch/api/, CC0). Run: npm run update-threats
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const FEED_URL = 'https://urlhaus.abuse.ch/downloads/hostfile/';
const DB_PATH = fileURLToPath(new URL('../malicious-domains.json', import.meta.url));
const MAX_HOSTS = 5000;

// Bare shared platforms: blocking one would block every site hosted on it (requestDomains matches subdomains).
const NEVER_BLOCK_BARE = new Set([
  'github.io', 'githubusercontent.com', 'github.com', 'google.com', 'googleusercontent.com', 'dropbox.com',
  'onedrive.live.com', 'amazonaws.com', 'cloudfront.net', 'blogspot.com', 'wordpress.com', 'weebly.com',
  'wixsite.com', 'herokuapp.com', 'netlify.app', 'vercel.app', 'pages.dev', 'workers.dev', 'discord.com',
  'discordapp.com', 'telegram.org', 't.me', 'mediafire.com', 'mega.nz', 'archive.org'
]);

const HOST_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const isIPv4 = (h) => /^\d+(\.\d+){3}$/.test(h);

const response = await fetch(FEED_URL);
if (!response.ok) throw new Error(`Feed request failed: HTTP ${response.status}`);
const text = await response.text();

const hosts = new Set();
for (const line of text.split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const host = line.trim().split(/\s+/)[1]?.toLowerCase();
  if (host && HOST_RE.test(host) && !isIPv4(host) && !NEVER_BLOCK_BARE.has(host)) hosts.add(host);
}
if (hosts.size === 0) throw new Error('Feed contained no usable hosts; leaving the database untouched');

const db = JSON.parse(await readFile(DB_PATH, 'utf8'));
db.malware = [...hosts].sort().slice(0, MAX_HOSTS);
db._sources = { malware: 'abuse.ch URLhaus host file', updated: new Date().toISOString().slice(0, 10) };
await writeFile(DB_PATH, JSON.stringify(db, null, 2) + '\n');

console.log(`malware: ${db.malware.length} hosts written (${hosts.size} in feed)`);
