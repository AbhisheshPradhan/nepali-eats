import React from 'react';

/**
 * Input — text field with optional leading icon. Marigold focus ring.
 */
export function Input({ iconLeft = null, size = 'md', style = {}, wrapStyle = {}, ...rest }) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: '0.9375rem', height: '38px' },
    md: { padding: '11px 16px', fontSize: '1.0625rem', height: '46px' },
    lg: { padding: '14px 20px', fontSize: '1.15rem', height: '56px' },
  };
  const s = sizes[size] || sizes.md;
  const [focused, setFocused] = React.useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'var(--surface-card)',
        border: `2px solid ${focused ? 'var(--brand-secondary)' : 'var(--border-strong)'}`,
        boxShadow: focused ? '0 0 0 var(--ring-width) var(--ring-color)' : 'none',
        borderRadius: 'var(--radius-pill)',
        padding: `0 ${s.padding.split(' ')[1]}`,
        height: s.height,
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
        ...wrapStyle,
      }}
    >
      {iconLeft && <span style={{ color: 'var(--text-muted)', display: 'flex', fontSize: '1.2em' }}>{iconLeft}</span>}
      <input
        onFocus={(e) => { setFocused(true); rest.onFocus && rest.onFocus(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur && rest.onBlur(e); }}
        {...rest}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-body)',
          fontSize: s.fontSize,
          color: 'var(--ink-900)',
          minWidth: 0,
          ...style,
        }}
      />
    </div>
  );
}
