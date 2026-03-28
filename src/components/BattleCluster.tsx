import { useEffect, useRef, useMemo } from 'react'
import {
  Cartesian3,
  Color,
  PointPrimitiveCollection,
  LabelCollection,
  NearFarScalar,
  VerticalOrigin,
  HorizontalOrigin,
  Cartesian2,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  SceneTransforms,
} from 'cesium'
import type { Battle } from '../types/battle'
import { useGlobe } from './GlobeContext'

interface ClusterData {
  lat: number
  lng: number
  count: number
  tier1Count: number
  battles: Battle[]
  name: string
}

interface BattleClusterProps {
  battles: Battle[]
  isActive: boolean
  onZoomToCluster: (lat: number, lng: number) => void
}

const CLUSTER_CELL_SIZE = 5

function buildClusters(battles: Battle[], cellSize: number): ClusterData[] {
  const cells = new Map<string, Battle[]>()

  for (const b of battles) {
    const cellLat = Math.floor(b.location.lat / cellSize) * cellSize
    const cellLng = Math.floor(b.location.lng / cellSize) * cellSize
    const key = `${cellLat},${cellLng}`
    let arr = cells.get(key)
    if (!arr) {
      arr = []
      cells.set(key, arr)
    }
    arr.push(b)
  }

  const clusters: ClusterData[] = []
  for (const [, cellBattles] of cells) {
    let avgLat = 0
    let avgLng = 0
    let tier1Count = 0
    let bestBattle = cellBattles[0]

    for (const b of cellBattles) {
      avgLat += b.location.lat
      avgLng += b.location.lng
      if (b.tier === 1) tier1Count++
      if (b.tier < bestBattle.tier) bestBattle = b
    }
    avgLat /= cellBattles.length
    avgLng /= cellBattles.length

    clusters.push({
      lat: avgLat,
      lng: avgLng,
      count: cellBattles.length,
      tier1Count,
      battles: cellBattles,
      name: bestBattle.name,
    })
  }
  return clusters
}

export default function BattleCluster({
  battles,
  isActive,
  onZoomToCluster,
}: BattleClusterProps) {
  const { viewer } = useGlobe()
  const pointsRef = useRef<PointPrimitiveCollection | null>(null)
  const labelsRef = useRef<LabelCollection | null>(null)
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null)
  const clustersRef = useRef<ClusterData[]>([])

  const clusters = useMemo(() => {
    if (!isActive || battles.length === 0) return []
    return buildClusters(battles, CLUSTER_CELL_SIZE)
  }, [battles, isActive])

  // Render cluster primitives
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    const scene = viewer.scene

    // Remove old primitives
    if (pointsRef.current) {
      scene.primitives.remove(pointsRef.current)
      pointsRef.current = null
    }
    if (labelsRef.current) {
      scene.primitives.remove(labelsRef.current)
      labelsRef.current = null
    }

    if (!isActive || clusters.length === 0) {
      clustersRef.current = []
      scene.requestRender()
      return
    }

    const points = new PointPrimitiveCollection()
    const labels = new LabelCollection()
    clustersRef.current = clusters

    for (const cluster of clusters) {
      const tier1Ratio = cluster.tier1Count / cluster.count
      const alpha = 0.5 + tier1Ratio * 0.5
      const size = Math.log(cluster.count + 1) * 8

      points.add({
        position: Cartesian3.fromDegrees(cluster.lng, cluster.lat, 0),
        color: Color.fromCssColorString('#d4a017').withAlpha(alpha),
        pixelSize: size,
        outlineColor: Color.BLACK.withAlpha(0.5),
        outlineWidth: 1.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(5e5, 2.0, 2e7, 0.6),
      })

      labels.add({
        position: Cartesian3.fromDegrees(cluster.lng, cluster.lat, 0),
        text: String(cluster.count),
        font: 'bold 14px Inter, sans-serif',
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        style: 2, // FILL_AND_OUTLINE
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, -22),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(5e5, 1.5, 2e7, 0.6),
      })
    }

    scene.primitives.add(points)
    scene.primitives.add(labels)
    pointsRef.current = points
    labelsRef.current = labels
    scene.requestRender()

    return () => {
      if (!viewer.isDestroyed()) {
        if (pointsRef.current) {
          scene.primitives.remove(pointsRef.current)
          pointsRef.current = null
        }
        if (labelsRef.current) {
          scene.primitives.remove(labelsRef.current)
          labelsRef.current = null
        }
      }
    }
  }, [viewer, clusters, isActive])

  // Click handler
  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !isActive) return

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    handlerRef.current = handler

    handler.setInputAction((event: { position: Cartesian2 }) => {
      const currentClusters = clustersRef.current
      const points = pointsRef.current
      if (!points || currentClusters.length === 0) return

      let closestIdx = -1
      let closestDist = 30

      for (let i = 0; i < currentClusters.length; i++) {
        const point = points.get(i)
        if (!point?.position) continue

        const screenPos = SceneTransforms.worldToWindowCoordinates(
          viewer.scene,
          point.position,
        )
        if (!screenPos) continue

        const dx = screenPos.x - event.position.x
        const dy = screenPos.y - event.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < closestDist) {
          closestDist = dist
          closestIdx = i
        }
      }

      if (closestIdx >= 0) {
        const cluster = currentClusters[closestIdx]
        onZoomToCluster(cluster.lat, cluster.lng)
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      if (!handler.isDestroyed()) {
        handler.destroy()
      }
      handlerRef.current = null
    }
  }, [viewer, isActive, onZoomToCluster])

  return null
}
