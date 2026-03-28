#!/usr/bin/env npx tsx
/**
 * enrich-wikipedia.ts
 *
 * Reads all battle JSON files from src/data/, derives Wikipedia slugs,
 * batch-checks the Wikipedia API, and writes back enriched data.
 *
 * Usage: npx tsx scripts/enrich-wikipedia.ts
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

interface BattleEntry {
  id: string
  name: string
  wikipediaSlug?: string
  [key: string]: unknown
}

const DATA_DIR = join(import.meta.dirname, '..', 'src', 'data')

function deriveSlug(name: string): string {
  return name.replace(/ /g, '_')
}

async function checkWikipediaPages(slugs: string[]): Promise<Set<string>> {
  const found = new Set<string>()

  // Wikipedia API allows up to 50 titles per request
  for (let i = 0; i < slugs.length; i += 50) {
    const batch = slugs.slice(i, i + 50)
    const titles = batch.join('|')
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=info&inprop=url&format=json`

    try {
      const res = await fetch(url)
      const data = await res.json() as {
        query?: {
          pages?: Record<string, { title: string; missing?: string }>
        }
      }

      if (data.query?.pages) {
        for (const page of Object.values(data.query.pages)) {
          if (!('missing' in page)) {
            found.add(page.title.replace(/ /g, '_'))
          }
        }
      }
    } catch (err) {
      console.error(`  Wikipedia API error for batch starting at ${i}:`, err)
    }

    // Small delay between batches to be polite
    if (i + 50 < slugs.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return found
}

async function main() {
  const files = readdirSync(DATA_DIR).filter(
    (f) => f.startsWith('battles-') && f.endsWith('.json')
  )

  console.log(`Found ${files.length} battle data files`)

  let totalBattles = 0
  let enriched = 0
  let notFound = 0
  let alreadyHadSlug = 0

  for (const file of files) {
    const filePath = join(DATA_DIR, file)
    const raw = readFileSync(filePath, 'utf-8')
    const battles: BattleEntry[] = JSON.parse(raw)

    // Collect slugs that need checking
    const needsCheck: Array<{ index: number; slug: string }> = []
    for (let i = 0; i < battles.length; i++) {
      totalBattles++
      if (battles[i].wikipediaSlug) {
        alreadyHadSlug++
        continue
      }
      needsCheck.push({ index: i, slug: deriveSlug(battles[i].name) })
    }

    if (needsCheck.length === 0) continue

    const slugs = needsCheck.map((n) => n.slug)
    const foundSlugs = await checkWikipediaPages(slugs)

    let fileModified = false
    for (const { index, slug } of needsCheck) {
      if (foundSlugs.has(slug)) {
        battles[index].wikipediaSlug = slug
        enriched++
        fileModified = true
      } else {
        notFound++
      }
    }

    if (fileModified) {
      writeFileSync(filePath, JSON.stringify(battles, null, 2) + '\n')
      console.log(`  Updated ${file}`)
    }
  }

  console.log(`\nResults:`)
  console.log(`  Total battles scanned: ${totalBattles}`)
  console.log(`  Already had slug:      ${alreadyHadSlug}`)
  console.log(`  Enriched (new):        ${enriched}`)
  console.log(`  Not found on Wikipedia: ${notFound}`)
}

main().catch(console.error)
