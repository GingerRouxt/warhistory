import { useEffect } from 'react';
import type { Battle } from '../types/battle';

interface SEOHeadProps {
  battle?: Battle;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const DEFAULT_TITLE = 'WarHistory — Every Battle Ever Fought';
const DEFAULT_DESCRIPTION =
  'Explore 6,000 years of warfare on an interactive 3D globe. From biblical battles to modern conflicts, experience every battle ever fought with cinematic narration and stunning visuals.';

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  return `${year} AD`;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

export function SEOHead({ battle, title, description, image, url }: SEOHeadProps) {
  const resolvedTitle = battle
    ? `${battle.name} (${formatYear(battle.year)}) — WarHistory`
    : title ?? DEFAULT_TITLE;
  const resolvedDescription = battle?.description
    ? battle.description
    : description ?? DEFAULT_DESCRIPTION;

  useEffect(() => {
    document.title = resolvedTitle;

    // OpenGraph
    setMetaProperty('og:title', resolvedTitle);
    setMetaProperty('og:description', resolvedDescription);
    setMetaProperty('og:type', 'website');
    if (image) setMetaProperty('og:image', image);
    if (url) setMetaProperty('og:url', url);

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', resolvedTitle);
    setMeta('twitter:description', resolvedDescription);
    if (image) setMeta('twitter:image', image);

    // Canonical
    if (url) setCanonical(url);
  }, [resolvedTitle, resolvedDescription, image, url]);

  return null;
}
