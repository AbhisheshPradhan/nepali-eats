import React from 'react';

/**
 * Rating — chili-pepper or star score for a venue.
 * Renders a filled count out of `max` plus the numeric value.
 */
export function Rating({ value = 0, max = 5, count = null, size = 18, showValue = true, style = {} }) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', ...style }}>
      <span style={{ position: 'relative', display: 'inline-block', fontSize: `${size}px`, lineHeight: 1 }}>
        <span style={{ color: 'var(--paper-300)' }}>★★★★★</span>
        <span style={{ position: 'absolute', left: 0, top: 0, width: `${pct}%`, overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--marigold-500)' }}>★★★★★</span>
      </span>
      {showValue && (
        <span style={{ fontWeight: 700, fontSize: `${size * 0.85}px`, color: 'var(--ink-900)' }}>
          {value.toFixed(1)}
        </span>
      )}
      {count != null && (
        <span style={{ fontSize: `${size * 0.75}px`, color: 'var(--text-muted)' }}>({count})</span>
      )}
    </span>
  );
}
