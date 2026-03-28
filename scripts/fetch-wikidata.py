#!/usr/bin/env python3
"""
Fetch all battles from Wikidata with coordinates, dates, and metadata.
Outputs to src/data/wikidata-battles.json
"""

import json
import time
import sys
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from urllib.error import HTTPError

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"

# Split into multiple queries to avoid timeouts
# Query 1: Battles with coordinates and dates (best quality)
SPARQL_COORDINATED = """
SELECT ?battle ?battleLabel ?coord ?date ?warLabel ?locationLabel
       ?side1Label ?side2Label ?cmd1Label ?cmd2Label
       ?casualties1 ?casualties2 ?strength1 ?strength2
WHERE {
  ?battle wdt:P31/wdt:P279* wd:Q178561 .  # instance of battle or subclass
  ?battle wdt:P625 ?coord .                 # has coordinates

  OPTIONAL { ?battle wdt:P585 ?date . }     # point in time
  OPTIONAL { ?battle wdt:P580 ?date . }     # start time (fallback)
  OPTIONAL { ?battle wdt:P361 ?war . }      # part of (war)
  OPTIONAL { ?battle wdt:P276 ?location . } # location

  # Participants (belligerents)
  OPTIONAL {
    ?battle p:P710 ?part1stmt .
    ?part1stmt ps:P710 ?side1 .
    ?part1stmt pq:P828 wd:Q4176199 .  # cause: aggressor / side
  }
  OPTIONAL {
    ?battle p:P710 ?part2stmt .
    ?part2stmt ps:P710 ?side2 .
    ?part2stmt pq:P828 wd:Q211790 .
  }

  # Commanders
  OPTIONAL { ?battle wdt:P710 ?cmd1 . }

  # Casualties
  OPTIONAL { ?battle wdt:P1120 ?casualties1 . }
  OPTIONAL { ?battle wdt:P1339 ?strength1 . }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT 5000
"""

# Query 2: Battles with dates but maybe no coordinates
SPARQL_DATED = """
SELECT ?battle ?battleLabel ?coord ?date ?warLabel ?locationLabel
WHERE {
  ?battle wdt:P31/wdt:P279* wd:Q178561 .
  ?battle wdt:P585 ?date .
  OPTIONAL { ?battle wdt:P625 ?coord . }
  OPTIONAL { ?battle wdt:P361 ?war . }
  OPTIONAL { ?battle wdt:P276 ?location . }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT 10000
OFFSET %d
"""

# Query 3: All remaining battles (name only)
SPARQL_ALL = """
SELECT ?battle ?battleLabel ?coord ?date ?warLabel ?locationLabel
WHERE {
  ?battle wdt:P31/wdt:P279* wd:Q178561 .
  OPTIONAL { ?battle wdt:P625 ?coord . }
  OPTIONAL { ?battle wdt:P585 ?date . }
  OPTIONAL { ?battle wdt:P580 ?date . }
  OPTIONAL { ?battle wdt:P361 ?war . }
  OPTIONAL { ?battle wdt:P276 ?location . }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT 5000
OFFSET %d
"""


def query_wikidata(sparql: str) -> list[dict]:
    """Execute SPARQL query against Wikidata."""
    params = urlencode({"query": sparql, "format": "json"})
    url = f"{WIKIDATA_ENDPOINT}?{params}"

    req = Request(url)
    req.add_header("User-Agent", "WarHistory/1.0 (https://warhistory.com; battle-data-collection)")
    req.add_header("Accept", "application/sparql-results+json")

    for attempt in range(3):
        try:
            with urlopen(req, timeout=120) as response:
                data = json.loads(response.read().decode("utf-8"))
                return data.get("results", {}).get("bindings", [])
        except HTTPError as e:
            if e.code == 429:
                wait = 30 * (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  HTTP {e.code}: {e.reason}")
                if attempt < 2:
                    time.sleep(10)
        except Exception as e:
            print(f"  Error: {e}")
            if attempt < 2:
                time.sleep(10)

    return []


def parse_coordinate(coord_str: str) -> tuple[float, float] | None:
    """Parse 'Point(lng lat)' WKT format."""
    if not coord_str:
        return None
    try:
        # Format: Point(-3.5 51.5)
        coord_str = coord_str.replace("Point(", "").replace(")", "")
        parts = coord_str.split()
        lng, lat = float(parts[0]), float(parts[1])
        if -180 <= lng <= 180 and -90 <= lat <= 90:
            return (lat, lng)
    except (ValueError, IndexError):
        pass
    return None


def parse_date(date_str: str) -> dict | None:
    """Parse ISO date string to year dict."""
    if not date_str:
        return None
    try:
        # Handle dates like "2024-06-15T00:00:00Z" or "-0586-01-01T00:00:00Z"
        year_str = date_str.split("T")[0]
        parts = year_str.split("-")

        if year_str.startswith("-"):
            # BCE date
            year = -int(parts[1])
            month = int(parts[2]) if len(parts) > 2 else None
            day = int(parts[3]) if len(parts) > 3 else None
        else:
            year = int(parts[0])
            month = int(parts[1]) if len(parts) > 1 else None
            day = int(parts[2]) if len(parts) > 2 else None

        if month == 1 and day == 1:
            # Probably just a year, not a specific date
            month = None
            day = None

        display = format_year_display(year, month, day)

        return {
            "year": year,
            "month": month,
            "day": day,
            "approximate": month is None,
            "display": display,
        }
    except (ValueError, IndexError):
        return None


def format_year_display(year: int, month: int | None = None, day: int | None = None) -> str:
    """Format a year into display string."""
    months = ["", "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"]

    if year < 0:
        year_str = f"{abs(year)} BCE"
    else:
        year_str = f"{year} CE" if year < 500 else str(year)

    if month and day and month <= 12:
        return f"{months[month]} {day}, {year_str}"
    elif month and month <= 12:
        return f"{months[month]} {year_str}"
    else:
        return year_str


def get_era(year: int) -> str:
    """Determine era from year."""
    if year < -586:
        return "biblical"
    elif year < 476:
        return "classical"
    elif year < 1453:
        return "medieval"
    elif year < 1789:
        return "early-modern"
    elif year < 1945:
        return "modern"
    else:
        return "contemporary"


def wikidata_id(uri: str) -> str:
    """Extract Wikidata ID from URI."""
    return uri.split("/")[-1] if uri else ""


def process_results(results: list[dict]) -> dict[str, dict]:
    """Process SPARQL results into battle records."""
    battles = {}

    for row in results:
        battle_uri = row.get("battle", {}).get("value", "")
        battle_id = wikidata_id(battle_uri)

        if not battle_id or battle_id in battles:
            continue

        name = row.get("battleLabel", {}).get("value", "")
        if not name or name == battle_id:
            continue

        # Parse coordinate
        coord = None
        coord_str = row.get("coord", {}).get("value", "")
        if coord_str:
            coord = parse_coordinate(coord_str)

        # Parse date
        date = None
        date_str = row.get("date", {}).get("value", "")
        if date_str:
            date = parse_date(date_str)

        # Other fields
        war = row.get("warLabel", {}).get("value", "")
        location = row.get("locationLabel", {}).get("value", "")

        # Determine tier
        tier = 3  # default: marker only
        if coord and date:
            tier = 2  # has location and date: text narration

        battle = {
            "id": f"wd-{battle_id}",
            "name": name,
            "date": date or {"year": 0, "approximate": True, "display": "Unknown date"},
            "location": {
                "lat": coord[0] if coord else 0,
                "lng": coord[1] if coord else 0,
                "name": location or name,
            },
            "war": war if war and war != wikidata_id(row.get("war", {}).get("value", "")) else None,
            "belligerents": {"side1": [], "side2": []},
            "outcome": "unknown",
            "description": f"The {name}" + (f", part of the {war}" if war else "") + ".",
            "tier": tier,
            "sources": [f"wikidata:{battle_id}"],
        }

        # Add participants if available
        side1 = row.get("side1Label", {}).get("value", "")
        side2 = row.get("side2Label", {}).get("value", "")
        if side1:
            battle["belligerents"]["side1"].append(side1)
        if side2:
            battle["belligerents"]["side2"].append(side2)

        battles[battle_id] = battle

    return battles


def main():
    print("=== WarHistory Wikidata Battle Fetcher ===\n")

    all_battles: dict[str, dict] = {}

    # Query 1: Battles with coordinates (highest quality)
    print("Phase 1: Fetching battles with coordinates...")
    results = query_wikidata(SPARQL_COORDINATED)
    print(f"  Got {len(results)} results")
    battles = process_results(results)
    all_battles.update(battles)
    print(f"  Total unique battles: {len(all_battles)}")
    time.sleep(5)

    # Query 2: Battles with dates (multiple pages)
    for offset in range(0, 20000, 5000):
        print(f"Phase 2: Fetching dated battles (offset {offset})...")
        results = query_wikidata(SPARQL_DATED % offset)
        if not results:
            break
        print(f"  Got {len(results)} results")
        battles = process_results(results)
        new_count = sum(1 for k in battles if k not in all_battles)
        all_battles.update(battles)
        print(f"  New battles: {new_count}, Total: {len(all_battles)}")
        time.sleep(5)

    # Query 3: All remaining battles (multiple pages)
    for offset in range(0, 30000, 5000):
        print(f"Phase 3: Fetching all battles (offset {offset})...")
        results = query_wikidata(SPARQL_ALL % offset)
        if not results:
            break
        print(f"  Got {len(results)} results")
        battles = process_results(results)
        new_count = sum(1 for k in battles if k not in all_battles)
        all_battles.update(battles)
        print(f"  New battles: {new_count}, Total: {len(all_battles)}")
        if len(results) < 5000:
            break
        time.sleep(5)

    # Convert to list and sort by date
    battle_list = list(all_battles.values())
    battle_list.sort(key=lambda b: b["date"]["year"])

    # Stats
    with_coords = sum(1 for b in battle_list if b["location"]["lat"] != 0)
    with_dates = sum(1 for b in battle_list if b["date"]["year"] != 0)

    print(f"\n=== Results ===")
    print(f"Total battles: {len(battle_list)}")
    print(f"With coordinates: {with_coords}")
    print(f"With dates: {with_dates}")
    print(f"With both: {sum(1 for b in battle_list if b['location']['lat'] != 0 and b['date']['year'] != 0)}")

    # Era breakdown
    era_counts: dict[str, int] = {}
    for b in battle_list:
        if b["date"]["year"] != 0:
            era = get_era(b["date"]["year"])
            era_counts[era] = era_counts.get(era, 0) + 1

    print("\nBy era:")
    for era, count in sorted(era_counts.items()):
        print(f"  {era}: {count}")

    # Write output
    output_path = "src/data/wikidata-battles.json"
    with open(output_path, "w") as f:
        json.dump(battle_list, f, indent=None, ensure_ascii=False)

    print(f"\nWritten to {output_path}")
    print(f"File size: {len(json.dumps(battle_list)) / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
