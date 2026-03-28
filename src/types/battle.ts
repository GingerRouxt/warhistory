export type EraId =
  | 'biblical'
  | 'classical'
  | 'medieval'
  | 'early-modern'
  | 'modern'
  | 'contemporary'

export interface BattleLocation {
  lat: number
  lng: number
}

export interface Battle {
  id: string
  name: string
  year: number
  era: EraId
  location: BattleLocation
  tier: 1 | 2 | 3
  description: string
  belligerents?: [string, string]
  result?: string
  biblical?: boolean
  scriptureRef?: string
}

export interface Era {
  id: EraId
  name: string
  startYear: number
  endYear: number
  color: string
  description: string
}

export interface TimeWindow {
  start: number
  end: number
}
