import type { Battle } from '../types/battle'

interface ExternalLinksProps {
  battle: Battle
}

/** Small external-link arrow icon */
function ExternalIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginLeft: 4, opacity: 0.6 }}
    >
      <path d="M3 1h6v6" />
      <path d="M9 1L1 9" />
    </svg>
  )
}

/** Small play icon for YouTube thumbnails */
function PlayIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="rgba(255,255,255,0.9)"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
      }}
    >
      <polygon points="8,5 19,12 8,19" />
    </svg>
  )
}

export function ExternalLinks({ battle }: ExternalLinksProps) {
  const hasWikipedia = !!battle.wikipediaSlug
  const hasYoutube = battle.youtubeVideoIds && battle.youtubeVideoIds.length > 0
  const hasExternalLinks = battle.externalLinks && battle.externalLinks.length > 0
  const hasAnything = hasWikipedia || hasYoutube || hasExternalLinks

  const searchQuery = encodeURIComponent(`${battle.name} documentary`)

  if (!hasAnything && !battle.name) return null

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Wikipedia */}
      {hasWikipedia && (
        <div className="mb-3">
          <a
            href={`https://en.wikipedia.org/wiki/${battle.wikipediaSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs uppercase tracking-wider"
            style={{
              color: 'var(--color-war-gold)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(212, 160, 23, 0.3)',
              paddingBottom: 1,
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderBottomColor = 'var(--color-war-gold)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderBottomColor = 'rgba(212, 160, 23, 0.3)'
            }}
          >
            Read on Wikipedia
            <ExternalIcon />
          </a>
        </div>
      )}

      {/* YouTube thumbnails */}
      {hasYoutube && (
        <div className="mb-3">
          <div
            className="text-[10px] uppercase tracking-[0.2em] mb-2"
            style={{ color: 'rgba(212, 160, 23, 0.6)' }}
          >
            Watch
          </div>
          <div className="flex gap-2 flex-wrap">
            {battle.youtubeVideoIds!.slice(0, 3).map((id) => (
              <a
                key={id}
                href={`https://www.youtube.com/watch?v=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative overflow-hidden"
                style={{
                  width: 160,
                  height: 90,
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.5)'
                  e.currentTarget.style.transform = 'scale(1.03)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <img
                  src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
                  alt="Watch Documentary"
                  width={160}
                  height={90}
                  style={{
                    display: 'block',
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                  }}
                  loading="lazy"
                />
                <PlayIcon />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* YouTube search fallback */}
      <div className="mb-3">
        <a
          href={`https://www.youtube.com/results?search_query=${searchQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-xs"
          style={{
            color: 'rgba(200, 200, 210, 0.6)',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(200, 200, 210, 0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(200, 200, 210, 0.6)'
          }}
        >
          Search YouTube for documentaries
          <ExternalIcon />
        </a>
      </div>

      {/* Other external links */}
      {hasExternalLinks && (
        <div className="flex flex-col gap-1.5">
          {battle.externalLinks!.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs"
              style={{
                color: 'rgba(200, 200, 210, 0.6)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(200, 200, 210, 0.9)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(200, 200, 210, 0.6)'
              }}
            >
              {link.label}
              <ExternalIcon />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
