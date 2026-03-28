#!/usr/bin/env python3
"""
Generate narrator scripts for WarHistory battles using Claude API.
Reads battles from src/data/ and outputs narration scripts to each battle's data.

Usage:
  ANTHROPIC_API_KEY=sk-xxx python3 scripts/generate-narrations.py [--tier 1] [--limit 50]
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("Install anthropic SDK: pip install anthropic")
    sys.exit(1)


NARRATION_PROMPT = """You are a documentary narrator for WarHistory, an interactive historical warfare exhibit on a 3D globe. Write a narration script for the following battle.

STYLE: Authoritative, vivid, concise — like a History Channel documentary meets a museum audio guide. Think Morgan Freeman narrating a war documentary. Use present tense for dramatic effect where appropriate.

LENGTH: 100-180 words (30-60 seconds when spoken).

STRUCTURE:
1. Open with WHEN and WHERE (set the scene)
2. WHO was fighting and WHY
3. WHAT happened (the key moment or turning point)
4. SIGNIFICANCE (why it matters, what changed)

FOR BIBLICAL BATTLES: Weave in the scripture reference naturally. Frame God's involvement as the text describes it — this is told from the perspective of scripture, not secular academia. End with the spiritual significance.

BATTLE DATA:
Name: {name}
Date: {date}
Location: {location}
Belligerents: {side1} vs {side2}
Result: {result}
Description: {description}
{biblical_section}

Write ONLY the narration script. No stage directions, no formatting, no quotes around it. Just the words the narrator speaks."""


def generate_narration(client: anthropic.Anthropic, battle: dict) -> str:
    """Generate a narration script for a single battle."""
    biblical_section = ""
    if battle.get("biblical") and battle.get("scriptureRef"):
        biblical_section = f"Scripture: {battle['scriptureRef']}\nThis is a biblical battle — narrate from the scriptural perspective."

    belligerents = battle.get("belligerents", ["Unknown", "Unknown"])
    side1 = belligerents[0] if len(belligerents) > 0 else "Unknown"
    side2 = belligerents[1] if len(belligerents) > 1 else "Unknown"

    year = battle.get("year", 0)
    if year < 0:
        date_str = f"c. {abs(year)} BCE"
    else:
        date_str = f"{year} CE"

    prompt = NARRATION_PROMPT.format(
        name=battle["name"],
        date=date_str,
        location=battle.get("location", {}).get("name", "Unknown") if isinstance(battle.get("location"), dict) else "Unknown",
        side1=side1,
        side2=side2,
        result=battle.get("result", "Unknown outcome"),
        description=battle.get("description", "No description available."),
        biblical_section=biblical_section,
    )

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()


def main():
    parser = argparse.ArgumentParser(description="Generate narration scripts for battles")
    parser.add_argument("--tier", type=int, default=1, help="Max tier to generate for (1=major only, 2=notable, 3=all)")
    parser.add_argument("--limit", type=int, default=500, help="Max battles to process")
    parser.add_argument("--biblical-only", action="store_true", help="Only generate for biblical battles")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without calling API")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key and not args.dry_run:
        print("Set ANTHROPIC_API_KEY environment variable")
        sys.exit(1)

    # Load all battle data
    data_dir = Path("src/data")
    all_battles = []

    # Biblical battles
    biblical_path = data_dir / "biblical-battles.json"
    if biblical_path.exists():
        with open(biblical_path) as f:
            all_battles.extend(json.load(f))

    # Wikidata battles
    wikidata_path = data_dir / "wikidata-battles.json"
    if wikidata_path.exists():
        with open(wikidata_path) as f:
            all_battles.extend(json.load(f))

    # Filter by tier and flags
    candidates = [b for b in all_battles if b.get("tier", 3) <= args.tier]
    if args.biblical_only:
        candidates = [b for b in candidates if b.get("biblical")]
    candidates = candidates[:args.limit]

    print(f"Generating narrations for {len(candidates)} battles (tier <= {args.tier})")

    if args.dry_run:
        for b in candidates:
            bib = " [BIBLICAL]" if b.get("biblical") else ""
            print(f"  - {b['name']} (tier {b.get('tier', 3)}){bib}")
        return

    client = anthropic.Anthropic(api_key=api_key)
    output_dir = data_dir / "narrations"
    output_dir.mkdir(exist_ok=True)

    generated = 0
    errors = 0

    for i, battle in enumerate(candidates):
        battle_id = battle["id"]
        output_file = output_dir / f"{battle_id}.txt"

        # Skip if already generated
        if output_file.exists():
            print(f"  [{i+1}/{len(candidates)}] {battle['name']} — already exists, skipping")
            continue

        print(f"  [{i+1}/{len(candidates)}] {battle['name']}...", end=" ", flush=True)

        try:
            narration = generate_narration(client, battle)
            output_file.write_text(narration)
            print(f"OK ({len(narration.split())} words)")
            generated += 1

            # Rate limiting
            time.sleep(0.5)
        except Exception as e:
            print(f"ERROR: {e}")
            errors += 1
            time.sleep(2)

    print(f"\nDone! Generated: {generated}, Errors: {errors}, Skipped: {len(candidates) - generated - errors}")
    print(f"Narrations saved to {output_dir}/")


if __name__ == "__main__":
    main()
