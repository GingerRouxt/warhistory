import { useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Cartesian3,
  Color,
  PointPrimitiveCollection,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  SceneTransforms,
  Cartesian2,
} from 'cesium'
import type { Battle, EraId } from '../types/battle'
import { useGlobe } from './GlobeContext'

// --- Era colors ---
const ERA_COLORS: Record<EraId, Color> = {
  biblical: Color.fromCssColorString('#f5e6c8'),
  classical: Color.fromCssColorString('#cd7f32'),
  medieval: Color.fromCssColorString('#708090'),
  'early-modern': Color.fromCssColorString('#1a3a5c'),
  modern: Color.fromCssColorString('#556b2f'),
  contemporary: Color.fromCssColorString('#8b0000'),
}

// --- Tier pixel sizes ---
const TIER_SIZE: Record<1 | 2 | 3, number> = {
  1: 12,
  2: 8,
  3: 5,
}

interface BattleLayerProps {
  battles: Battle[]
  startYear: number
  endYear: number
  onSelectBattle: (battle: Battle) => void
}

export default function BattleLayer({
  battles,
  startYear,
  endYear,
  onSelectBattle,
}: BattleLayerProps) {
  const { viewer } = useGlobe()
  const collectionRef = useRef<PointPrimitiveCollection | null>(null)
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  // Map from point index to battle for click/hover resolution
  const indexMapRef = useRef<Map<number, Battle>>(new Map())

  // Filter battles by time window
  const visibleBattles = useMemo(() => {
    return battles.filter((b) => b.year >= startYear && b.year <= endYear)
  }, [battles, startYear, endYear])

  // Create or get tooltip element
  const getTooltip = useCallback(() => {
    if (tooltipRef.current) return tooltipRef.current
    const el = document.createElement('div')
    el.style.cssText = `
      position: fixed;
      pointer-events: none;
      background: rgba(10, 10, 15, 0.9);
      color: #f5e6c8;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-family: system-ui, sans-serif;
      border: 1px solid rgba(245, 230, 200, 0.2);
      z-index: 10000;
      display: none;
      max-width: 260px;
      backdrop-filter: blur(4px);
    `
    document.body.appendChild(el)
    tooltipRef.current = el
    return el
  }, [])

  // Build point primitives when visible battles or viewer changes
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    const scene = viewer.scene

    // Remove old collection
    if (collectionRef.current) {
      scene.primitives.remove(collectionRef.current)
      collectionRef.current = null
    }

    const collection = new PointPrimitiveCollection()
    const idxMap = new Map<number, Battle>()

    for (let i = 0; i < visibleBattles.length; i++) {
      const battle = visibleBattles[i]
      collection.add({
        position: Cartesian3.fromDegrees(battle.location.lng, battle.location.lat, 0),
        color: ERA_COLORS[battle.era] ?? ERA_COLORS.biblical,
        pixelSize: TIER_SIZE[battle.tier] ?? 5,
        outlineColor: Color.BLACK.withAlpha(0.6),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      })
      idxMap.set(i, battle)
    }

    scene.primitives.add(collection)
    collectionRef.current = collection
    indexMapRef.current = idxMap

    // Request a render since we're in requestRenderMode
    scene.requestRender()

    return () => {
      if (!viewer.isDestroyed() && collectionRef.current) {
        scene.primitives.remove(collectionRef.current)
        collectionRef.current = null
      }
    }
  }, [viewer, visibleBattles])

  // Screen-space event handler for click and hover
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    const tooltip = getTooltip()
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    handlerRef.current = handler

    // Find battle near a screen position
    const pickBattle = (position: Cartesian2): Battle | null => {
      const collection = collectionRef.current
      if (!collection) return null

      // Use scene.pick for point primitives
      const picked = viewer.scene.pick(position)
      if (defined(picked) && picked.primitive instanceof PointPrimitiveCollection) {
        // Find the index of the picked point in our collection
        const pointPrimitive = picked.id ?? picked.primitive
        // Iterate to find which point was picked
        for (const [idx, battle] of indexMapRef.current.entries()) {
          const point = collection.get(idx)
          if (point === picked.primitive || point === pointPrimitive) {
            return battle
          }
        }
        // Fallback: proximity-based picking
        return pickBattleByProximity(position)
      }
      return pickBattleByProximity(position)
    }

    // Proximity-based picking fallback
    const pickBattleByProximity = (screenPos: Cartesian2): Battle | null => {
      const collection = collectionRef.current
      if (!collection) return null

      let closest: Battle | null = null
      let closestDist = 20 // max pixel distance threshold

      for (const [idx, battle] of indexMapRef.current.entries()) {
        const point = collection.get(idx)
        if (!point || !point.position) continue

        const pointScreen = SceneTransforms.worldToWindowCoordinates(
          viewer.scene,
          point.position,
        )
        if (!pointScreen) continue

        const dx = pointScreen.x - screenPos.x
        const dy = pointScreen.y - screenPos.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < closestDist) {
          closestDist = dist
          closest = battle
        }
      }
      return closest
    }

    // Click handler
    handler.setInputAction((event: { position: Cartesian2 }) => {
      const battle = pickBattle(event.position)
      if (battle) {
        onSelectBattle(battle)
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    // Hover handler
    handler.setInputAction((event: { endPosition: Cartesian2 }) => {
      const battle = pickBattleByProximity(event.endPosition)
      if (battle) {
        tooltip.style.display = 'block'
        tooltip.style.left = `${event.endPosition.x + 16}px`
        tooltip.style.top = `${event.endPosition.y - 12}px`

        const yearDisplay = battle.year < 0 ? `${Math.abs(battle.year)} BC` : `${battle.year} AD`
        tooltip.innerHTML = `<strong>${battle.name}</strong><br/><span style="opacity:0.7">${yearDisplay}</span>`
      } else {
        tooltip.style.display = 'none'
      }
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return () => {
      if (!handler.isDestroyed()) {
        handler.destroy()
      }
      handlerRef.current = null
      tooltip.style.display = 'none'
    }
  }, [viewer, onSelectBattle, getTooltip])

  // Cleanup tooltip on unmount
  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        document.body.removeChild(tooltipRef.current)
        tooltipRef.current = null
      }
    }
  }, [])

  // This component renders nothing to the React tree — it's fully imperative
  return null
}
