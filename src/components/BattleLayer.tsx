import { useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Cartesian3,
  Color,
  PointPrimitiveCollection,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Cartesian2,
  Cartographic,
  Math as CesiumMath,
  NearFarScalar,
} from 'cesium'
import type { Battle, EraId } from '../types/battle'
import { useGlobe } from './GlobeContext'
import { SpatialIndex } from '../utils/spatial'

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
  onHoverBattle?: (battle: Battle | null, screenX: number, screenY: number) => void
}

/** Haversine distance in degrees (approximate, sufficient for proximity) */
function degDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dlat = lat1 - lat2
  const dlng = lng1 - lng2
  return Math.sqrt(dlat * dlat + dlng * dlng)
}

export default function BattleLayer({
  battles,
  startYear,
  endYear,
  onSelectBattle,
  onHoverBattle,
}: BattleLayerProps) {
  const { viewer } = useGlobe()
  const collectionRef = useRef<PointPrimitiveCollection | null>(null)
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null)
  const indexMapRef = useRef<Map<number, Battle>>(new Map())
  const spatialRef = useRef<SpatialIndex>(new SpatialIndex())

  // Filter battles by time window
  const visibleBattles = useMemo(() => {
    return battles.filter((b) => b.year >= startYear && b.year <= endYear)
  }, [battles, startYear, endYear])

  // Build spatial index whenever visible battles change
  useMemo(() => {
    const idx = new SpatialIndex()
    idx.build(visibleBattles)
    spatialRef.current = idx
    return idx
  }, [visibleBattles])

  // Pick battle by converting screen coords to globe coords, then spatial query
  const pickBattleByProximity = useCallback(
    (screenPos: Cartesian2): Battle | null => {
      if (!viewer || viewer.isDestroyed()) return null

      const ellipsoid = viewer.scene.globe.ellipsoid
      const cartesian = viewer.camera.pickEllipsoid(screenPos, ellipsoid)
      if (!cartesian) return null

      const carto = Cartographic.fromCartesian(cartesian, ellipsoid)
      const lat = CesiumMath.toDegrees(carto.latitude)
      const lng = CesiumMath.toDegrees(carto.longitude)

      const nearby = spatialRef.current.queryNearby(lat, lng)
      if (nearby.length === 0) return null

      // Find closest within the nearby set
      // Determine a reasonable threshold based on camera altitude
      const cameraHeight = viewer.camera.positionCartographic.height
      // Roughly: 1 degree ~ 111km, threshold scales with altitude
      const thresholdDeg = Math.max(0.5, cameraHeight / 111000 * 0.02)

      let closest: Battle | null = null
      let closestDist = thresholdDeg

      for (const b of nearby) {
        const dist = degDistance(lat, lng, b.location.lat, b.location.lng)
        if (dist < closestDist) {
          closestDist = dist
          closest = b
        }
      }

      return closest
    },
    [viewer],
  )

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
        scaleByDistance: new NearFarScalar(1e4, 1.5, 8e6, 0.3),
      })
      idxMap.set(i, battle)
    }

    scene.primitives.add(collection)
    collectionRef.current = collection
    indexMapRef.current = idxMap

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

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    handlerRef.current = handler

    // Find battle near a screen position using scene.pick first, then spatial fallback
    const pickBattle = (position: Cartesian2): Battle | null => {
      const collection = collectionRef.current
      if (!collection) return null

      const picked = viewer.scene.pick(position)
      if (defined(picked) && picked.primitive instanceof PointPrimitiveCollection) {
        const pointPrimitive = picked.id ?? picked.primitive
        for (const [idx, battle] of indexMapRef.current.entries()) {
          const point = collection.get(idx)
          if (point === picked.primitive || point === pointPrimitive) {
            return battle
          }
        }
      }
      // Spatial index fallback
      return pickBattleByProximity(position)
    }

    // Click handler
    handler.setInputAction((event: { position: Cartesian2 }) => {
      const battle = pickBattle(event.position)
      if (battle) {
        onSelectBattle(battle)
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    // Hover handler — emit via callback, parent renders tooltip as React
    handler.setInputAction((event: { endPosition: Cartesian2 }) => {
      if (!onHoverBattle) return
      const battle = pickBattleByProximity(event.endPosition)
      onHoverBattle(
        battle,
        event.endPosition.x,
        event.endPosition.y,
      )
    }, ScreenSpaceEventType.MOUSE_MOVE)

    return () => {
      if (!handler.isDestroyed()) {
        handler.destroy()
      }
      handlerRef.current = null
    }
  }, [viewer, onSelectBattle, onHoverBattle, pickBattleByProximity])

  // This component renders nothing to the React tree
  return null
}
