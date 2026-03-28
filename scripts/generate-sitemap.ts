import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface BattleEntry {
  id: string;
  tier: 1 | 2 | 3;
}

const SITE = 'https://warhistory.app';
const TODAY = new Date().toISOString().split('T')[0];

const dataPath = resolve(__dirname, '../src/data/wikidata-battles.json');
const outPath = resolve(__dirname, '../public/sitemap.xml');

const battles: BattleEntry[] = JSON.parse(readFileSync(dataPath, 'utf-8'));

function priorityForTier(tier: number): string {
  if (tier === 1) return '1.0';
  if (tier === 2) return '0.8';
  return '0.5';
}

const urls: string[] = [
  `  <url>
    <loc>${SITE}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
];

for (const battle of battles) {
  urls.push(`  <url>
    <loc>${SITE}/battle/${battle.id}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priorityForTier(battle.tier)}</priority>
  </url>`);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

writeFileSync(outPath, sitemap, 'utf-8');
console.log(`Sitemap generated: ${urls.length} URLs written to ${outPath}`);
