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
  commanders?: [string, string]
  casualties?: { side1?: number; side2?: number; total?: number }
  troopStrength?: {
    side1?: number
    side2?: number
  }
  warName?: string
  significance?: 1 | 2 | 3 // 1=changed history, 2=changed a war, 3=tactical
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
