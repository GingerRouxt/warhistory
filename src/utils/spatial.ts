/**
 * Grid-based spatial index for O(1) battle proximity lookup.
 * Partitions battles into 1 x 1 lat/lng cells.
 */
import type { Battle } from '../types/battle'

interface SpatialCell {
  battles: Battle[]
}

export class SpatialIndex {
  private cells = new Map<string, SpatialCell>()

  private key(lat: number, lng: number): string {
    return `${Math.floor(lat)},${Math.floor(lng)}`
  }

  build(battles: Battle[]): void {
    this.cells.clear()
    for (const b of battles) {
      const k = this.key(b.location.lat, b.location.lng)
      let cell = this.cells.get(k)
      if (!cell) {
        cell = { battles: [] }
        this.cells.set(k, cell)
      }
      cell.battles.push(b)
    }
  }

  /** Query battles in the cell containing (lat, lng) plus 8 surrounding cells */
  queryNearby(lat: number, lng: number): Battle[] {
    const result: Battle[] = []
    const baseLat = Math.floor(lat)
    const baseLng = Math.floor(lng)
    for (let dlat = -1; dlat <= 1; dlat++) {
      for (let dlng = -1; dlng <= 1; dlng++) {
        const cell = this.cells.get(`${baseLat + dlat},${baseLng + dlng}`)
        if (cell) result.push(...cell.battles)
      }
    }
    return result
  }

  /** Get all unique cell keys for clustering */
  getCells(): Map<string, Battle[]> {
    const result = new Map<string, Battle[]>()
    for (const [key, cell] of this.cells) {
      result.set(key, cell.battles)
    }
    return result
  }

  get totalBattles(): number {
    let count = 0
    for (const cell of this.cells.values()) {
      count += cell.battles.length
    }
    return count
  }
}
