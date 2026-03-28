#!/usr/bin/env python3
"""
Generate narrator audio files from text scripts using ElevenLabs API.
Reads narration scripts from src/data/narrations/ and outputs MP3 to public/audio/

Usage:
  ELEVENLABS_API_KEY=xxx python3 scripts/generate-audio.py [--limit 50] [--voice "Daniel"]
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path

try:
    from elevenlabs import ElevenLabs
except ImportError:
    print("Install elevenlabs SDK: pip install elevenlabs")
    sys.exit(1)


# Good documentary narrator voices on ElevenLabs
# "Daniel" - deep British male, authoritative
# "Adam" - deep American male
# "Antoni" - warm, measured
# Check your ElevenLabs account for available voices
DEFAULT_VOICE = "Daniel"

# Voice settings for documentary narration
VOICE_SETTINGS = {
    "stability": 0.65,          # Slightly varied for natural feel
    "similarity_boost": 0.80,   # Stay close to voice character
    "style": 0.20,              # Subtle expressiveness
    "use_speaker_boost": True,
}


def main():
    parser = argparse.ArgumentParser(description="Generate audio from narration scripts")
    parser.add_argument("--limit", type=int, default=500, help="Max files to process")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help="ElevenLabs voice name or ID")
    parser.add_argument("--model", default="eleven_turbo_v2_5", help="ElevenLabs model")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated")
    args = parser.parse_args()

    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key and not args.dry_run:
        print("Set ELEVENLABS_API_KEY environment variable")
        sys.exit(1)

    narrations_dir = Path("src/data/narrations")
    audio_dir = Path("public/audio")
    audio_dir.mkdir(parents=True, exist_ok=True)

    if not narrations_dir.exists():
        print(f"No narrations directory found at {narrations_dir}")
        print("Run generate-narrations.py first")
        sys.exit(1)

    # Find all narration scripts
    scripts = sorted(narrations_dir.glob("*.txt"))
    print(f"Found {len(scripts)} narration scripts")

    # Filter out already-generated audio
    to_generate = []
    for script_path in scripts:
        audio_path = audio_dir / f"{script_path.stem}.mp3"
        if audio_path.exists():
            continue
        to_generate.append(script_path)

    to_generate = to_generate[:args.limit]
    print(f"Need to generate {len(to_generate)} audio files")

    if args.dry_run:
        for p in to_generate:
            text = p.read_text()
            chars = len(text)
            est_seconds = len(text.split()) / 2.5  # rough WPM estimate
            print(f"  - {p.stem}: {chars} chars, ~{est_seconds:.0f}s audio")

        total_chars = sum(len(p.read_text()) for p in to_generate)
        print(f"\nTotal characters: {total_chars:,}")
        print(f"Estimated cost at Scale pricing ($0.18/1K chars): ${total_chars * 0.18 / 1000:.2f}")
        return

    client = ElevenLabs(api_key=api_key)

    generated = 0
    errors = 0

    for i, script_path in enumerate(to_generate):
        text = script_path.read_text().strip()
        if not text:
            continue

        audio_path = audio_dir / f"{script_path.stem}.mp3"
        print(f"  [{i+1}/{len(to_generate)}] {script_path.stem}...", end=" ", flush=True)

        try:
            audio = client.text_to_speech.convert(
                voice_id=args.voice,
                model_id=args.model,
                text=text,
                voice_settings=VOICE_SETTINGS,
            )

            # Write audio to file
            with open(audio_path, "wb") as f:
                for chunk in audio:
                    f.write(chunk)

            size_kb = audio_path.stat().st_size / 1024
            print(f"OK ({size_kb:.0f}KB)")
            generated += 1

            # Rate limiting
            time.sleep(0.3)

        except Exception as e:
            print(f"ERROR: {e}")
            errors += 1
            time.sleep(2)

    print(f"\nDone! Generated: {generated}, Errors: {errors}")
    print(f"Audio files saved to {audio_dir}/")

    # Generate a manifest for the frontend
    manifest = {}
    for audio_file in sorted(audio_dir.glob("*.mp3")):
        battle_id = audio_file.stem
        size = audio_file.stat().st_size
        manifest[battle_id] = {
            "file": f"/audio/{audio_file.name}",
            "size": size,
        }

    manifest_path = Path("src/data/audio-manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Audio manifest written to {manifest_path}")


if __name__ == "__main__":
    main()
