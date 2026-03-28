const DEFAULT_DESCRIPTION =
  'Explore 6,000 years of warfare on an interactive 3D globe. From biblical battles to modern conflicts, experience every battle ever fought with cinematic narration and stunning visuals.';

const structuredData = {
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

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
