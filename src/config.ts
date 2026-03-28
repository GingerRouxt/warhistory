export const config = {
  cesiumIonToken: import.meta.env.VITE_CESIUM_ION_TOKEN || '',
  gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
  adsensePubId: import.meta.env.VITE_ADSENSE_PUB_ID || '',
  siteUrl: 'https://warhistory.app',
  siteName: 'WarHistory',
  siteDescription: 'Explore 6,000 years of warfare on an interactive 3D globe.',
} as const
