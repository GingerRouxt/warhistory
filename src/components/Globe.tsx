import { useRef, useCallback, type ReactNode } from 'react'
import { Viewer, Globe as CesiumGlobe, Scene, Fog, CameraFlyTo } from 'resium'
import {
  Viewer as CesiumViewer,
  Cartesian3,
  Math as CesiumMath,
  Color,
  createWorldTerrainAsync,
  IonImageryProvider,
  Cesium3DTileset,
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

// Google Photorealistic 3D Tiles key (optional — gracefully degrades without it)
const GOOGLE_TILES_KEY = import.meta.env.VITE_GOOGLE_TILES_KEY as string | undefined

export default function Globe({ children }: GlobeProps) {
  const viewerRef = useRef<CesiumViewer | null>(null)
  const { setViewer } = useGlobe()

  const handleViewerReady = useCallback(
    (cesiumViewer: CesiumViewer) => {
      viewerRef.current = cesiumViewer

      const scene = cesiumViewer.scene

      // --- Background & sky ---
      scene.backgroundColor = Color.fromCssColorString('#060609')

      // HDR for richer lighting range
      scene.highDynamicRange = true

      // Day/night cycle — sun position drives lighting
      scene.globe.enableLighting = true

      // Terrain exaggeration — makes mountains/valleys more dramatic
      scene.verticalExaggeration = 1.3

      // --- Atmosphere: cinematic darkness, subtle glow ---
      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.brightnessShift = -0.35
        scene.skyAtmosphere.hueShift = 0.0
        scene.skyAtmosphere.saturationShift = -0.1
      }

      if (scene.globe) {
        scene.globe.atmosphereBrightnessShift = -0.15
        scene.globe.atmosphereSaturationShift = -0.1
      }

      // Darken the sky box for deeper space
      if (scene.skyBox) {
        scene.skyBox.show = true
      }
      // Push sun away from blowing out the atmosphere
      scene.sun.show = true

      // --- Post-processing: subtle bloom + ambient occlusion ---
      const pp = scene.postProcessStages
      if (pp) {
        // Bloom — subtle glow on bright spots (city lights, markers)
        if (pp.bloom) {
          pp.bloom.enabled = true
          const bloom = pp.bloom as unknown as Record<string, unknown>
          bloom.contrast = 119
          bloom.brightness = 0.04
          bloom.delta = 1.0
          bloom.sigma = 3.78
          bloom.stepSize = 0.5
          bloom.glowOnly = false
        }

        // Ambient occlusion — soft shadowing in terrain crevices
        if (pp.ambientOcclusion) {
          pp.ambientOcclusion.enabled = true
          const ao = pp.ambientOcclusion as unknown as Record<string, unknown>
          ao.intensity = 2.5
          ao.bias = 0.1
          ao.lengthCap = 0.03
          ao.stepSize = 1.0
          ao.blurStepSize = 0.86
          ao.ambientOcclusionOnly = false
        }

        // FXAA anti-aliasing
        if (pp.fxaa) {
          pp.fxaa.enabled = true
        }
      }

      // --- Dark imagery layer ---
      DARK_IMAGERY_PROVIDER.then((provider) => {
        cesiumViewer.imageryLayers.addImageryProvider(provider)
      }).catch(() => {
        // Fallback: default imagery is acceptable
      })

      // --- Google Photorealistic 3D Tiles (optional) ---
      if (GOOGLE_TILES_KEY) {
        Cesium3DTileset.fromUrl(
          `https://tile.googleapis.com/v1/3dtiles/root.json?key=${GOOGLE_TILES_KEY}`,
        )
          .then((tileset) => {
            cesiumViewer.scene.primitives.add(tileset)
          })
          .catch(() => {
            // No 3D tiles — globe still works fine without them
          })
      }

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
      requestRenderMode={false}
      sceneMode={undefined}
    >
      <Scene />{/* Post-processing configured imperatively in handleViewerReady */}
      <CesiumGlobe
        enableLighting
        depthTestAgainstTerrain
        baseColor={Color.fromCssColorString('#060609')}
        showGroundAtmosphere
        atmosphereLightIntensity={6.0}
        atmosphereRayleighScatteringScale={0.5}
        atmosphereMieScatteringScale={0.2}
      />
      <Fog enabled density={0.0003} minimumBrightness={0.008} />
      <CameraFlyTo
        destination={INITIAL_POSITION}
        orientation={INITIAL_ORIENTATION}
        duration={0}
      />
      {children}
    </Viewer>
  )
}
