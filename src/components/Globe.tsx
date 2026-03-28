import { useRef, useCallback, type ReactNode } from 'react'
import { Viewer, Globe as CesiumGlobe, Scene, Fog, CameraFlyTo } from 'resium'
import {
  Viewer as CesiumViewer,
  Cartesian3,
  Math as CesiumMath,
  Color,
  createWorldTerrainAsync,
  IonImageryProvider,
} from 'cesium'
import { useGlobe } from './GlobeContext'

interface GlobeProps {
  children?: ReactNode
}

// Cesium Ion dark imagery (Sentinel-2 or default Bing dark)
const DARK_IMAGERY_PROVIDER = IonImageryProvider.fromAssetId(3)

// Initial camera: high altitude centered on Israel/Middle East
const INITIAL_POSITION = Cartesian3.fromDegrees(35, 31, 20_000_000)
const INITIAL_ORIENTATION = {
  heading: CesiumMath.toRadians(0),
  pitch: CesiumMath.toRadians(-90),
  roll: 0,
}

export default function Globe({ children }: GlobeProps) {
  const viewerRef = useRef<CesiumViewer | null>(null)
  const { setViewer } = useGlobe()

  const handleViewerReady = useCallback(
    (cesiumViewer: CesiumViewer) => {
      viewerRef.current = cesiumViewer

      // Set scene background to near-black
      cesiumViewer.scene.backgroundColor = Color.fromCssColorString('#0a0a0f')

      // Add dark imagery layer
      DARK_IMAGERY_PROVIDER.then((provider) => {
        cesiumViewer.imageryLayers.addImageryProvider(provider)
      }).catch(() => {
        // Fallback: default Bing imagery is fine
      })

      // Expose viewer to context
      setViewer(cesiumViewer)
    },
    [setViewer],
  )

  return (
    <Viewer
      full
      ref={(e) => {
        if (e?.cesiumElement && e.cesiumElement !== viewerRef.current) {
          handleViewerReady(e.cesiumElement)
        }
      }}
      terrainProvider={createWorldTerrainAsync()}
      // Disable all default widgets — we build our own UI
      timeline={false}
      animation={false}
      geocoder={false}
      fullscreenButton={false}
      homeButton={false}
      sceneModePicker={false}
      baseLayerPicker={false}
      navigationHelpButton={false}
      infoBox={false}
      selectionIndicator={false}
      creditContainer={document.createElement('div')}
      requestRenderMode
      maximumRenderTimeChange={Infinity}
      sceneMode={undefined}
    >
      <Scene />{/* fxaa and requestRenderMode set on Viewer */}
      <CesiumGlobe
        enableLighting
        depthTestAgainstTerrain
        baseColor={Color.fromCssColorString('#0a0a0f')}
        showGroundAtmosphere
      />
      <Fog enabled density={0.0003} minimumBrightness={0.02} />
      <CameraFlyTo
        destination={INITIAL_POSITION}
        orientation={INITIAL_ORIENTATION}
        duration={0}
      />
      {children}
    </Viewer>
  )
}
