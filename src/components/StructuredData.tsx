import type { Battle } from '../types/battle';

interface StructuredDataProps {
  battle?: Battle;
}

const DEFAULT_DESCRIPTION =
  'Explore 6,000 years of warfare on an interactive 3D globe. From biblical battles to modern conflicts, experience every battle ever fought with cinematic narration and stunning visuals.';

const webAppData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'WarHistory',
  description: DEFAULT_DESCRIPTION,
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web',
  url: 'https://warhistory.app',
  author: {
    '@type': 'Organization',
    name: 'WarHistory',
    url: 'https://warhistory.app',
  },
};

function formatISODate(year: number): string {
  const absYear = Math.abs(year);
  const pad = absYear < 10 ? '000' : absYear < 100 ? '00' : absYear < 1000 ? '0' : '';
  if (year < 0) return `-${pad}${absYear}-01-01`;
  return `${pad}${absYear}-01-01`;
}

function buildEventData(battle: Battle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: battle.name,
    startDate: formatISODate(battle.year),
    location: {
      '@type': 'Place',
      name: battle.name,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: battle.location.lat,
        longitude: battle.location.lng,
      },
    },
    description: battle.description,
  };
}

export function StructuredData({ battle }: StructuredDataProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppData) }}
      />
      {battle && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildEventData(battle)) }}
        />
      )}
    </>
  );
}
