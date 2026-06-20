import React from 'react';
import { Badge } from '../core/Badge.jsx';
import { Tag } from '../core/Tag.jsx';
import { Rating } from '../core/Rating.jsx';

const VENUE_ICON = {
  Restaurant: 'ph-fork-knife',
  Cafe: 'ph-coffee',
  'Food truck': 'ph-truck',
  Stall: 'ph-storefront',
};

/**
 * PlaceCard — the signature NepaliEats listing card.
 * A venue's photo, name, cuisines, rating and quick facts.
 */
export function PlaceCard({
  name = 'Untitled spot',
  image = null,
  venueType = 'Restaurant',
  cuisines = [],
  rating = null,
  reviewCount = null,
  suburb = '',
  distance = '',
  priceLevel = 2,
  isOpen = true,
  hoursLine = null,
  favourite = false,
  onClick = null,
  style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const price = '$'.repeat(Math.max(1, Math.min(4, priceLevel)));

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* image */}
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: 'linear-gradient(135deg, var(--marigold-300), var(--chili-300))', overflow: 'hidden' }}>
        {image ? (
          <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: hover ? 'scale(1.05)' : 'scale(1)', transition: 'transform var(--dur-slow) var(--ease-out)' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
            <i className={`ph-fill ${VENUE_ICON[venueType] || 'ph-fork-knife'}`} style={{ color: 'rgba(255,255,255,.7)' }} />
          </div>
        )}
        {/* top row */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Badge tone={isOpen ? 'open' : 'closed'} solid>{isOpen ? 'Open now' : 'Closed'}</Badge>
          <span
            style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', color: favourite ? 'var(--chili-500)' : 'var(--ink-500)', fontSize: '1.15rem' }}
          >
            <i className={favourite ? 'ph-fill ph-heart' : 'ph ph-heart'} />
          </span>
        </div>
        {/* venue type chip bottom-left */}
        <span style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(43,26,18,.78)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}>
          <i className={`ph-fill ${VENUE_ICON[venueType] || 'ph-fork-knife'}`} />
          {venueType}
        </span>
      </div>

      {/* body */}
      <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-5)', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--ink-900)', lineHeight: 1.1 }}>{name}</h3>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{price}</span>
        </div>

        {rating != null && <Rating value={rating} count={reviewCount} size={16} />}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          <i className="ph ph-map-pin" style={{ color: 'var(--chili-500)' }} />
          <span>{suburb}{distance ? ` · ${distance}` : ''}</span>
        </div>

        {hoursLine && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 600, color: isOpen ? 'var(--coriander-700)' : 'var(--text-muted)' }}>
            <i className="ph ph-clock" style={{ color: isOpen ? 'var(--coriander-500)' : 'var(--text-muted)' }} />
            <span>{hoursLine}</span>
          </div>
        )}

        {cuisines.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
            {cuisines.slice(0, 3).map((c) => (
              <Tag key={c} style={{ fontSize: '0.8rem', padding: '4px 11px' }}>{c}</Tag>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
