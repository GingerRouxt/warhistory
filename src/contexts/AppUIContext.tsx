import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { Battle } from '../types/battle'

interface AppUIState {
  heatmapActive: boolean
  filterOpen: boolean
  tourSelectorOpen: boolean
  tourActive: boolean
  activeCampaignId: string | null
  compareOpen: boolean
  compareBattle: Battle | null
  selectedCommander: string | null
  hoveredBattle: Battle | null
  hoverPos: { x: number; y: number }
}

type AppUIAction =
  | { type: 'TOGGLE_HEATMAP' }
  | { type: 'SET_FILTER_OPEN'; open: boolean }
  | { type: 'SET_TOUR_SELECTOR_OPEN'; open: boolean }
  | { type: 'SET_TOUR_ACTIVE'; active: boolean }
  | { type: 'SET_CAMPAIGN'; id: string | null }
  | { type: 'SET_COMPARE'; open: boolean; battle?: Battle | null }
  | { type: 'SET_COMMANDER'; name: string | null }
  | { type: 'SET_HOVERED_BATTLE'; battle: Battle | null; x: number; y: number }

const initialState: AppUIState = {
  heatmapActive: false,
  filterOpen: false,
  tourSelectorOpen: false,
  tourActive: false,
  activeCampaignId: null,
  compareOpen: false,
  compareBattle: null,
  selectedCommander: null,
  hoveredBattle: null,
  hoverPos: { x: 0, y: 0 },
}

function reducer(state: AppUIState, action: AppUIAction): AppUIState {
  switch (action.type) {
    case 'TOGGLE_HEATMAP': return { ...state, heatmapActive: !state.heatmapActive }
    case 'SET_FILTER_OPEN': return { ...state, filterOpen: action.open }
    case 'SET_TOUR_SELECTOR_OPEN': return { ...state, tourSelectorOpen: action.open }
    case 'SET_TOUR_ACTIVE': return { ...state, tourActive: action.active }
    case 'SET_CAMPAIGN': return { ...state, activeCampaignId: action.id }
    case 'SET_COMPARE': return { ...state, compareOpen: action.open, compareBattle: action.battle ?? null }
    case 'SET_COMMANDER': return { ...state, selectedCommander: action.name }
    case 'SET_HOVERED_BATTLE': return { ...state, hoveredBattle: action.battle, hoverPos: { x: action.x, y: action.y } }
    default: return state
  }
}

const AppUIContext = createContext<AppUIState>(initialState)
const AppUIDispatchContext = createContext<Dispatch<AppUIAction>>(() => {})

export function AppUIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <AppUIContext.Provider value={state}>
      <AppUIDispatchContext.Provider value={dispatch}>
        {children}
      </AppUIDispatchContext.Provider>
    </AppUIContext.Provider>
  )
}

export function useAppUI() { return useContext(AppUIContext) }
export function useAppUIDispatch() { return useContext(AppUIDispatchContext) }
