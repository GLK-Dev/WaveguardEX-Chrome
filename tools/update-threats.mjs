// Refreshes malicious-domains.json from public feeds. Run: npm run update-threats
//  - malware:  abuse.ch URLhaus host file (CC0)            https://urlhaus.abuse.ch/api/
//  - phishing: OpenPhish community feed (non-commercial)   https://openphish.com/terms.html
// pup_domains has no reliable public feed, so it is left empty rather than filled with invented domains.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const URLHAUS_URL = 'https://urlhaus.abuse.ch/downloads/hostfile/';
const OPENPHISH_URL = 'https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt';
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

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Feed request failed (${url}): HTTP ${response.status}`);
  return response.text();
}

const usable = (host) => HOST_RE.test(host) && !isIPv4(host) && !NEVER_BLOCK_BARE.has(host);

const malware = new Set();
for (const line of (await download(URLHAUS_URL)).split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const host = line.trim().split(/\s+/)[1]?.toLowerCase();
  if (host && usable(host)) malware.add(host);
}

// Feed entries are URLs. Only dedicated phishing hosts (URL path is just "/") are blocked at domain level;
// a deep path usually means a hacked legitimate site, where blocking the whole domain would be wrong.
const phishing = new Set();
for (const line of (await download(OPENPHISH_URL)).split(/\r?\n/)) {
  let url;
  try {
    url = new URL(line.trim());
  } catch {
    continue;
  }
  const host = url.hostname.toLowerCase();
  if (url.pathname === '/' && !url.search && usable(host)) phishing.add(host);
}

if (malware.size === 0 || phishing.size === 0) {
  throw new Error('A feed contained no usable hosts; leaving the database untouched');
}

const db = JSON.parse(await readFile(DB_PATH, 'utf8'));
db.malware = [...malware].sort().slice(0, MAX_HOSTS);
db.phishing = [...phishing].sort().slice(0, MAX_HOSTS);
db.pup_domains = [];
const today = new Date().toISOString().slice(0, 10);
db._sources = {
  malware: 'abuse.ch URLhaus host file',
  phishing: 'OpenPhish community feed (non-commercial use)',
  updated: today
};
await writeFile(DB_PATH, JSON.stringify(db, null, 2) + '\n');

console.log(`malware: ${db.malware.length} hosts, phishing: ${db.phishing.length} hosts`);
