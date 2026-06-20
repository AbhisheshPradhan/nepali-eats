/* @ds-bundle: {"format":3,"namespace":"DesignSystem_580998","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Rating","sourcePath":"components/core/Rating.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"PlaceCard","sourcePath":"components/listings/PlaceCard.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"ee869af23831","components/core/Badge.jsx":"6a04b9eb9f13","components/core/Button.jsx":"4ff20d61f0b1","components/core/Input.jsx":"5520deec34d3","components/core/Rating.jsx":"df6fb80cbdfd","components/core/Tag.jsx":"9c8aaf78227d","components/listings/PlaceCard.jsx":"eb2c3afc5d65","ui_kits/web/App.jsx":"53dbee09199b","ui_kits/web/Footer.jsx":"a4f91b564c54","ui_kits/web/Header.jsx":"9b1697128fff","ui_kits/web/Home.jsx":"ac26e7e06827","ui_kits/web/MapExplore.jsx":"e188ea7f0927","ui_kits/web/Stories.jsx":"2dec014ef5ec","ui_kits/web/VenueDetail.jsx":"f928545b25b1","ui_kits/web/data.js":"434fb1307cba"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_580998 = window.DesignSystem_580998 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
/**
 * Avatar — round profile/venue image with initials fallback.
 */
function Avatar({
  src = null,
  name = '',
  size = 44,
  ring = false,
  style = {}
}) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const dim = {
    width: `${size}px`,
    height: `${size}px`
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-pill)',
      overflow: 'hidden',
      flex: 'none',
      background: 'var(--marigold-300)',
      color: 'var(--ink-900)',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: `${size * 0.4}px`,
      boxShadow: ring ? '0 0 0 3px var(--paper-50), 0 0 0 5px var(--marigold-500)' : 'none',
      ...dim,
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials || '🙂');
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Status badge — small pill for venue state ("Open now", "New", "Local favourite").
 */
function Badge({
  children,
  tone = 'neutral',
  solid = false,
  style = {},
  ...rest
}) {
  const tones = {
    neutral: {
      fg: 'var(--ink-700)',
      bg: 'var(--paper-200)',
      solidBg: 'var(--ink-700)'
    },
    open: {
      fg: 'var(--coriander-700)',
      bg: 'var(--coriander-100)',
      solidBg: 'var(--coriander-500)'
    },
    closed: {
      fg: 'var(--chili-700)',
      bg: 'var(--chili-100)',
      solidBg: 'var(--chili-600)'
    },
    favourite: {
      fg: 'var(--marigold-700)',
      bg: 'var(--marigold-100)',
      solidBg: 'var(--marigold-500)'
    },
    info: {
      fg: 'var(--himalaya-700)',
      bg: 'var(--himalaya-100)',
      solidBg: 'var(--himalaya-500)'
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: '0.78rem',
      letterSpacing: '0.02em',
      padding: '4px 11px',
      borderRadius: 'var(--radius-pill)',
      color: solid ? '#fff' : t.fg,
      background: solid ? t.solidBg : t.bg,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * NepaliEats Button — chunky, friendly, pill-shaped by default.
 * Variants: primary (chili), secondary (marigold), outline, ghost.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = true,
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 16px',
      fontSize: '0.9375rem',
      gap: '6px'
    },
    md: {
      padding: '12px 22px',
      fontSize: '1.0625rem',
      gap: '8px'
    },
    lg: {
      padding: '16px 30px',
      fontSize: '1.2rem',
      gap: '10px'
    }
  };
  const variants = {
    primary: {
      background: 'var(--brand-primary)',
      color: 'var(--text-on-primary)',
      border: '2px solid transparent'
    },
    secondary: {
      background: 'var(--brand-secondary)',
      color: 'var(--ink-900)',
      border: '2px solid transparent'
    },
    outline: {
      background: 'transparent',
      color: 'var(--brand-primary)',
      border: '2px solid var(--brand-primary)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-700)',
      border: '2px solid transparent'
    }
  };
  const base = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '0.005em',
    borderRadius: pill ? 'var(--radius-pill)' : 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform var(--dur-fast) var(--ease-bounce), box-shadow var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
    ...sizes[size],
    ...variants[variant],
    ...style
  };
  const onDown = e => {
    if (!disabled) e.currentTarget.style.transform = 'scale(0.95)';
  };
  const onUp = e => {
    if (!disabled) e.currentTarget.style.transform = 'scale(1)';
  };
  const onEnter = e => {
    if (disabled) return;
    if (variant === 'primary') {
      e.currentTarget.style.background = 'var(--brand-primary-hover)';
      e.currentTarget.style.boxShadow = 'var(--shadow-pop)';
    } else if (variant === 'secondary') {
      e.currentTarget.style.background = 'var(--brand-secondary-hover)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    } else if (variant === 'outline') {
      e.currentTarget.style.background = 'var(--chili-100)';
    } else {
      e.currentTarget.style.background = 'var(--paper-200)';
    }
  };
  const onLeave = e => {
    if (disabled) return;
    e.currentTarget.style.background = variants[variant].background;
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'scale(1)';
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    style: base,
    disabled: disabled,
    onMouseDown: onDown,
    onMouseUp: onUp,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — text field with optional leading icon. Marigold focus ring.
 */
function Input({
  iconLeft = null,
  size = 'md',
  style = {},
  wrapStyle = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 14px',
      fontSize: '0.9375rem',
      height: '38px'
    },
    md: {
      padding: '11px 16px',
      fontSize: '1.0625rem',
      height: '46px'
    },
    lg: {
      padding: '14px 20px',
      fontSize: '1.15rem',
      height: '56px'
    }
  };
  const s = sizes[size] || sizes.md;
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
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
      ...wrapStyle
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      display: 'flex',
      fontSize: '1.2em'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    onFocus: e => {
      setFocused(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocused(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: s.fontSize,
      color: 'var(--ink-900)',
      minWidth: 0,
      ...style
    }
  })));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Rating.jsx
try { (() => {
/**
 * Rating — chili-pepper or star score for a venue.
 * Renders a filled count out of `max` plus the numeric value.
 */
function Rating({
  value = 0,
  max = 5,
  count = null,
  size = 18,
  showValue = true,
  style = {}
}) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'var(--font-body)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-block',
      fontSize: `${size}px`,
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--paper-300)'
    }
  }, "\u2605\u2605\u2605\u2605\u2605"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: `${pct}%`,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      color: 'var(--marigold-500)'
    }
  }, "\u2605\u2605\u2605\u2605\u2605")), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: `${size * 0.85}px`,
      color: 'var(--ink-900)'
    }
  }, value.toFixed(1)), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: `${size * 0.75}px`,
      color: 'var(--text-muted)'
    }
  }, "(", count, ")"));
}
Object.assign(__ds_scope, { Rating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Rating.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag — cuisine / attribute chip ("Momo", "Newari", "Veg-friendly").
 * Clickable filter chip when `active`/onClick supplied.
 */
function Tag({
  children,
  active = false,
  clickable = false,
  style = {},
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.9rem',
    padding: '6px 14px',
    borderRadius: 'var(--radius-pill)',
    border: '1.5px solid',
    cursor: clickable ? 'pointer' : 'default',
    transition: 'all var(--dur-fast) var(--ease-out)',
    color: active ? '#fff' : 'var(--ink-700)',
    background: active ? 'var(--brand-primary)' : 'var(--surface-card)',
    borderColor: active ? 'var(--brand-primary)' : 'var(--border-strong)',
    ...style
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: base,
    onMouseEnter: e => {
      if (clickable && !active) {
        e.currentTarget.style.borderColor = 'var(--brand-primary)';
        e.currentTarget.style.color = 'var(--brand-primary)';
      }
    },
    onMouseLeave: e => {
      if (clickable && !active) {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.color = 'var(--ink-700)';
      }
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/listings/PlaceCard.jsx
try { (() => {
const VENUE_ICON = {
  Restaurant: 'ph-fork-knife',
  Cafe: 'ph-coffee',
  'Food truck': 'ph-truck',
  Stall: 'ph-storefront'
};

/**
 * PlaceCard — the signature NepaliEats listing card.
 * A venue's photo, name, cuisines, rating and quick facts.
 */
function PlaceCard({
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
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  const price = '$'.repeat(Math.max(1, Math.min(4, priceLevel)));
  return /*#__PURE__*/React.createElement("article", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '4 / 3',
      background: 'linear-gradient(135deg, var(--marigold-300), var(--chili-300))',
      overflow: 'hidden'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      transform: hover ? 'scale(1.05)' : 'scale(1)',
      transition: 'transform var(--dur-slow) var(--ease-out)'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '3rem'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ph-fill ${VENUE_ICON[venueType] || 'ph-fork-knife'}`,
    style: {
      color: 'rgba(255,255,255,.7)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '12px',
      left: '12px',
      right: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: isOpen ? 'open' : 'closed',
    solid: true
  }, isOpen ? 'Open now' : 'Closed'), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '34px',
      height: '34px',
      borderRadius: 'var(--radius-pill)',
      background: 'rgba(255,255,255,.92)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'var(--shadow-sm)',
      color: favourite ? 'var(--chili-500)' : 'var(--ink-500)',
      fontSize: '1.15rem'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: favourite ? 'ph-fill ph-heart' : 'ph ph-heart'
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: '12px',
      left: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      background: 'rgba(43,26,18,.78)',
      color: '#fff',
      fontSize: '0.78rem',
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: 'var(--radius-pill)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ph-fill ${VENUE_ICON[venueType] || 'ph-fork-knife'}`
  }), venueType)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4) var(--space-5) var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '1.3rem',
      color: 'var(--ink-900)',
      lineHeight: 1.1
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  }, price)), rating != null && /*#__PURE__*/React.createElement(__ds_scope.Rating, {
    value: rating,
    count: reviewCount,
    size: 16
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: 'var(--text-muted)',
      fontSize: '0.95rem'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-map-pin",
    style: {
      color: 'var(--chili-500)'
    }
  }), /*#__PURE__*/React.createElement("span", null, suburb, distance ? ` · ${distance}` : '')), hoursLine && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '0.95rem',
      fontWeight: 600,
      color: isOpen ? 'var(--coriander-700)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-clock",
    style: {
      color: isOpen ? 'var(--coriander-500)' : 'var(--text-muted)'
    }
  }), /*#__PURE__*/React.createElement("span", null, hoursLine)), cuisines.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      marginTop: '2px'
    }
  }, cuisines.slice(0, 3).map(c => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: c,
    style: {
      fontSize: '0.8rem',
      padding: '4px 11px'
    }
  }, c)))));
}
Object.assign(__ds_scope, { PlaceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/listings/PlaceCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/App.jsx
try { (() => {
function App() {
  const [route, setRoute] = React.useState('home');
  const [venueId, setVenueId] = React.useState(null);
  const [storyId, setStoryId] = React.useState(null);
  const [exploreQuery, setExploreQuery] = React.useState('');
  const [exploreLocate, setExploreLocate] = React.useState(false);
  const open = id => {
    setVenueId(id);
    setRoute('detail');
    window.scrollTo(0, 0);
  };
  const openStory = id => {
    setStoryId(id);
    setRoute('story');
    window.scrollTo(0, 0);
  };
  const nav = r => {
    if (r === 'explore') {
      setExploreQuery('');
      setExploreLocate(false);
    }
    setRoute(r);
    window.scrollTo(0, 0);
  };
  const goSearch = q => {
    setExploreQuery(q || '');
    setExploreLocate(false);
    setRoute('explore');
    window.scrollTo(0, 0);
  };
  const goNearMe = () => {
    setExploreQuery('');
    setExploreLocate(true);
    setRoute('explore');
    window.scrollTo(0, 0);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-page)'
    }
  }, /*#__PURE__*/React.createElement(Header, {
    onNav: nav,
    active: route === 'detail' ? 'explore' : route === 'story' ? 'stories' : route
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1
    }
  }, route === 'home' && /*#__PURE__*/React.createElement(Home, {
    onNav: nav,
    onSearch: goSearch,
    onNearMe: goNearMe,
    onOpen: open
  }), route === 'explore' && /*#__PURE__*/React.createElement(MapExplore, {
    onOpen: open,
    initialQuery: exploreQuery,
    autoLocate: exploreLocate
  }), route === 'stories' && /*#__PURE__*/React.createElement(Stories, {
    onOpenStory: openStory
  }), route === 'story' && /*#__PURE__*/React.createElement(StoryDetail, {
    id: storyId,
    onBack: () => nav('stories')
  }), route === 'detail' && /*#__PURE__*/React.createElement(VenueDetail, {
    id: venueId,
    onBack: () => nav('explore')
  })), route !== 'explore' && /*#__PURE__*/React.createElement(Footer, null));
}
window.App = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/Footer.jsx
try { (() => {
function Footer() {
  const col = (title, items) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      color: '#fff',
      marginBottom: '4px'
    }
  }, title), items.map(i => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      color: 'var(--paper-200)',
      textDecoration: 'none',
      fontSize: '.95rem'
    }
  }, i)));
  const flags = ['var(--flag-blue)', 'var(--flag-white)', 'var(--flag-red)', 'var(--flag-green)', 'var(--flag-yellow)'];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--ink-900)',
      color: '#fff',
      marginTop: '64px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '10px'
    }
  }, Array.from({
    length: 30
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      background: flags[i % 5]
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: '48px 24px 36px',
      display: 'flex',
      gap: '48px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 320
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-momo.svg",
    alt: "",
    style: {
      width: 36,
      height: 36
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '1.35rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--marigold-500)'
    }
  }, "Nepali"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#fff'
    }
  }, "Eats"))), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--paper-200)',
      lineHeight: 1.6,
      margin: 0
    }
  }, "Every plate of Nepali food in Australia, gathered with love, from steamy momo windows to Sunday market stalls.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '48px',
      flexWrap: 'wrap'
    }
  }, col('Explore', ['By cuisine', 'By city', 'Food trucks', 'New this week']), col('Community', ['Add a spot', 'Write a review', 'Our story', 'For owners']), col('Hungry?', ['Momo guide', 'Where to eat thali', 'Festival eats']))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid rgba(255,255,255,.12)',
      padding: '18px 24px',
      textAlign: 'center',
      color: 'var(--paper-200)',
      fontSize: '.85rem'
    }
  }, "Made with love for Nepali food in Australia \xB7 \xA9 2026 NepaliEats"));
}
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/Header.jsx
try { (() => {
const {
  Button
} = window.DesignSystem_580998;
function Header({
  onNav,
  active
}) {
  const [open, setOpen] = React.useState(false);
  const [isNarrow, setIsNarrow] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 880px)');
    const on = () => {
      setIsNarrow(mq.matches);
      if (!mq.matches) setOpen(false);
    };
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const go = key => {
    setOpen(false);
    onNav(key);
  };
  const link = (key, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => go(key),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: '1.02rem',
      color: active === key ? 'var(--chili-500)' : 'var(--ink-700)',
      padding: '6px 4px',
      borderBottom: active === key ? '3px solid var(--chili-500)' : '3px solid transparent'
    }
  }, label);
  const mobileLink = (key, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => go(key),
    style: {
      background: active === key ? 'var(--paper-100)' : 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '1.15rem',
      textAlign: 'left',
      color: active === key ? 'var(--chili-500)' : 'var(--ink-900)',
      padding: '14px 16px',
      borderRadius: 'var(--radius-md)',
      width: '100%'
    }
  }, label);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 30,
      background: 'rgba(255,251,244,0.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      padding: '8px 24px 8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('home'),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-momo.svg",
    alt: "",
    style: {
      width: 40,
      height: 40
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '1.5rem',
      letterSpacing: '-.02em'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--chili-500)'
    }
  }, "Nepali"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-900)'
    }
  }, "Eats"))), !isNarrow && /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: '18px',
      marginLeft: '8px',
      alignItems: 'center'
    }
  }, link('explore', 'Explore'), link('stories', 'Stories'), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-plus"
    }),
    onClick: () => go('explore'),
    style: {
      marginLeft: '12px'
    }
  }, "Add a spot")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), !isNarrow && /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "outline",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-user"
    }),
    onClick: () => go('explore')
  }, "Log in"), isNarrow && /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(o => !o),
    "aria-label": "Menu",
    style: {
      background: open ? 'var(--ink-900)' : 'transparent',
      color: open ? '#fff' : 'var(--ink-900)',
      border: '2px solid var(--ink-900)',
      borderRadius: 'var(--radius-md)',
      width: 44,
      height: 44,
      cursor: 'pointer',
      fontSize: '1.4rem',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: open ? 'ph ph-x' : 'ph ph-list'
  }))), isNarrow && open && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: () => setOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      top: 57,
      background: 'rgba(43,26,18,.35)',
      zIndex: 25
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '100%',
      background: 'var(--bg-page)',
      borderBottom: '1px solid var(--border-soft)',
      boxShadow: 'var(--shadow-lg)',
      padding: '12px 16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      zIndex: 26
    }
  }, mobileLink('explore', 'Explore'), mobileLink('stories', 'Stories'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    block: true,
    variant: "primary",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-plus"
    }),
    onClick: () => go('explore')
  }, "Add a spot"), /*#__PURE__*/React.createElement(Button, {
    block: true,
    variant: "outline",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-user"
    }),
    onClick: () => go('explore')
  }, "Log in")))));
}
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/Home.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  Tag,
  PlaceCard,
  Badge,
  Input
} = window.DesignSystem_580998;
function Bunting() {
  const flags = ['var(--flag-blue)', 'var(--flag-yellow)', 'var(--flag-red)', 'var(--flag-green)'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
      marginBottom: '18px'
    }
  }, Array.from({
    length: 9
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 0,
      height: 0,
      borderLeft: '14px solid transparent',
      borderRight: '14px solid transparent',
      borderTop: `24px solid ${flags[i % 4]}`,
      filter: 'drop-shadow(0 3px 3px rgba(43,26,18,.18))'
    }
  })));
}
function Home({
  onNav,
  onSearch,
  onNearMe,
  onOpen
}) {
  const data = window.NE_DATA;
  const featured = data.venues.slice(0, 6);
  const [heroQ, setHeroQ] = React.useState('');
  const submit = () => onSearch(heroQ);
  const trackRef = React.useRef(null);
  const scrollBy = dir => {
    if (trackRef.current) trackRef.current.scrollBy({
      left: dir * 360,
      behavior: 'smooth'
    });
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(1200px 500px at 50% -10%, var(--marigold-100), var(--paper-50))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: '0 auto',
      padding: '56px 24px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(Bunting, null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: '.82rem',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--chili-500)'
    }
  }, "All across Australia"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 'clamp(2.6rem, 6vw, 4.25rem)',
      lineHeight: 1.02,
      letterSpacing: '-.02em',
      color: 'var(--ink-900)',
      margin: '12px 0 0'
    }
  }, "Find your", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--chili-500)'
    }
  }, "momo people.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '1.25rem',
      color: 'var(--ink-700)',
      maxWidth: 560,
      margin: '18px auto 0',
      lineHeight: 1.5
    }
  }, "From hole-in-the-wall steamers to Sunday market stalls, every hidden gem serving real Nepali food, gathered in one happy place."), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      submit();
    },
    style: {
      maxWidth: 600,
      margin: '30px auto 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: '#fff',
      border: '2px solid var(--border-strong)',
      borderRadius: 'var(--radius-pill)',
      padding: '6px 6px 6px 20px',
      boxShadow: 'var(--shadow-md)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-magnifying-glass",
    style: {
      color: 'var(--text-muted)',
      fontSize: '1.35rem',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: heroQ,
    onChange: e => setHeroQ(e.target.value),
    placeholder: "Search a restaurant, suburb or postcode",
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: '1.1rem',
      color: 'var(--ink-900)',
      minWidth: 0
    }
  }), /*#__PURE__*/React.createElement(Button, {
    size: "md",
    variant: "primary",
    type: "submit",
    iconRight: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-arrow-right"
    })
  }, "Search"))), /*#__PURE__*/React.createElement("button", {
    onClick: onNearMe,
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--chili-100)';
      e.currentTarget.style.borderColor = 'var(--chili-500)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = '#fff';
      e.currentTarget.style.borderColor = 'var(--border-strong)';
    },
    style: {
      background: '#fff',
      border: '2px solid var(--border-strong)',
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      marginTop: '16px',
      padding: '9px 18px',
      color: 'var(--chili-600)',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '1rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      boxShadow: 'var(--shadow-sm)',
      transition: 'background var(--dur-fast), border-color var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-navigation-arrow",
    style: {
      color: 'var(--chili-500)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Share your location and we\u2019ll find the closest momo")))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: '44px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: '.82rem',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--marigold-700)'
    }
  }, "Local favourites"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '2.2rem',
      margin: '4px 0 0',
      color: 'var(--ink-900)'
    }
  }, "This week's hidden gems")), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    iconRight: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-arrow-right"
    }),
    onClick: () => onNav('explore')
  }, "See all spots")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '24px'
    }
  }, featured.map(v => /*#__PURE__*/React.createElement(PlaceCard, _extends({
    key: v.id
  }, v, {
    onClick: () => onOpen(v.id)
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container)',
      margin: '40px auto 0',
      padding: '0 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: '18px',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: '.82rem',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--himalaya-700)'
    }
  }, "Eat by craving"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '2.2rem',
      margin: '4px 0 0',
      color: 'var(--ink-900)'
    }
  }, "What are you hungry for?")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flex: 'none'
    }
  }, [['ph-caret-left', -1], ['ph-caret-right', 1]].map(([icon, dir]) => /*#__PURE__*/React.createElement("button", {
    key: icon,
    onClick: () => scrollBy(dir),
    "aria-label": dir < 0 ? 'Previous' : 'Next',
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--ink-900)';
      e.currentTarget.style.color = '#fff';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--surface-card)';
      e.currentTarget.style.color = 'var(--ink-900)';
    },
    style: {
      width: 44,
      height: 44,
      borderRadius: 'var(--radius-pill)',
      border: '2px solid var(--ink-900)',
      background: 'var(--surface-card)',
      color: 'var(--ink-900)',
      cursor: 'pointer',
      fontSize: '1.2rem',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--dur-fast), color var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ph ${icon}`
  }))))), /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    className: "ne-hscroll",
    style: {
      display: 'flex',
      gap: 18,
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      padding: '4px 8px 10px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }
  }, data.cuisines.map((c, i) => {
    const h = [18, 35, 350, 168, 4, 45, 205, 120, 28][i % 9];
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      onClick: () => onSearch(c),
      style: {
        flex: 'none',
        width: 230,
        scrollSnapAlign: 'start',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 170,
        borderRadius: 'var(--radius-lg)',
        background: `linear-gradient(135deg, hsl(${h},78%,62%), hsl(${(h + 32) % 360},76%,50%))`,
        display: 'grid',
        placeItems: 'center',
        color: 'rgba(255,255,255,.85)',
        fontSize: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: "ph ph-image"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: '1.1rem',
        color: 'var(--ink-900)'
      }
    }, c));
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: '56px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--ink-900)',
      borderRadius: 'var(--radius-xl)',
      padding: '44px',
      display: 'flex',
      gap: '32px',
      alignItems: 'center',
      flexWrap: 'wrap',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 320px'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "favourite",
    solid: true
  }, "Our story"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '2rem',
      color: '#fff',
      margin: '14px 0 10px'
    }
  }, "Nepali food is having a moment. We didn't want to miss a single plate."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--paper-200)',
      fontSize: '1.1rem',
      lineHeight: 1.6,
      margin: '0 0 20px'
    }
  }, "NepaliEats started as a group chat of friends swapping momo tips. Now it's a map of every kitchen, cafe and truck worth the trip, added by people who actually eat there."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconRight: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-arrow-right"
    }),
    onClick: () => onNav('stories')
  }, "Read the story")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 200px',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-momo.svg",
    alt: "",
    style: {
      width: 160,
      opacity: .96
    }
  })))));
}
window.Home = Home;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/MapExplore.jsx
try { (() => {
const {
  Badge,
  Tag,
  Rating,
  Button,
  Input,
  PlaceCard
} = window.DesignSystem_580998;
const VENUE_ICON = {
  Restaurant: 'ph-fork-knife',
  Cafe: 'ph-coffee',
  'Food truck': 'ph-truck',
  Stall: 'ph-storefront'
};

/* ---- Leaflet pin (brand teardrop with rating) ---- */
function pinHtml(v, hi) {
  const color = v.favourite ? 'var(--marigold-500)' : 'var(--chili-500)';
  const ring = hi ? '3px solid var(--ink-900)' : '2px solid #fff';
  const scale = hi ? 1.18 : 1;
  return `
    <div style="position:relative;transform:scale(${scale});transition:transform .15s var(--ease-bounce);">
      <div style="width:34px;height:34px;background:${color};border:${ring};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(43,26,18,.35);"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-display);font-weight:700;font-size:12px;padding-bottom:4px;">${v.rating.toFixed(1)}</div>
    </div>`;
}
function makeIcon(v, hi) {
  return L.divIcon({
    html: pinHtml(v, hi),
    className: '',
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    tooltipAnchor: [0, -34]
  });
}
function DishCarousel({
  hue,
  count = 5
}) {
  const [i, setI] = React.useState(0);
  const go = (d, e) => {
    e.stopPropagation();
    setI(p => (p + d + count) % count);
  };
  const arrow = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: 'rgba(255,255,255,.92)',
    border: 'none',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--ink-900)',
    boxShadow: 'var(--shadow-sm)',
    fontSize: '.9rem'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(135deg, hsl(${(hue + i * 14) % 360},78%,62%), hsl(${(hue + i * 14 + 34) % 360},76%,50%))`,
      display: 'grid',
      placeItems: 'center',
      color: 'rgba(255,255,255,.85)',
      fontSize: '1.9rem'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-image"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: e => go(-1, e),
    style: {
      ...arrow,
      left: 8
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-caret-left"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: e => go(1, e),
    style: {
      ...arrow,
      right: 8
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-caret-right"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 8,
      left: 0,
      right: 0,
      display: 'flex',
      gap: 5,
      justifyContent: 'center'
    }
  }, Array.from({
    length: count
  }).map((_, d) => /*#__PURE__*/React.createElement("span", {
    key: d,
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: d === i ? '#fff' : 'rgba(255,255,255,.5)'
    }
  }))));
}
function CompactRow({
  v,
  hovered,
  selected,
  onOpen,
  onHover,
  rowRef,
  narrow
}) {
  const hi = hovered || selected;
  const s = window.NE_DATA.todayStatus(v);
  return /*#__PURE__*/React.createElement("article", {
    ref: rowRef,
    onClick: () => onOpen(v.id),
    onMouseEnter: () => onHover(v.id),
    onMouseLeave: () => onHover(null),
    style: {
      display: 'flex',
      flexDirection: narrow ? 'column' : 'row',
      cursor: 'pointer',
      overflow: 'hidden',
      background: selected ? 'var(--paper-100)' : 'var(--surface-card)',
      border: `2px solid ${hi ? 'var(--chili-500)' : 'var(--border-soft)'}`,
      borderRadius: 'var(--radius-lg)',
      boxShadow: hi ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast), background var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: 'none',
      ...(narrow ? {
        width: '100%',
        height: 180
      } : {
        width: 230,
        alignSelf: 'stretch',
        minHeight: 190
      })
    }
  }, /*#__PURE__*/React.createElement(DishCarousel, {
    hue: v.hue,
    count: 5
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: s.open ? 'open' : 'closed',
    solid: true,
    style: {
      fontSize: '.66rem',
      padding: '3px 9px'
    }
  }, s.open ? 'Open' : 'Closed')), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 2,
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: 'rgba(255,255,255,.92)',
      display: 'grid',
      placeItems: 'center',
      color: v.favourite ? 'var(--chili-500)' : 'var(--ink-500)',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: v.favourite ? 'ph-fill ph-heart' : 'ph ph-heart'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      padding: '14px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '1.3rem',
      color: 'var(--ink-900)',
      lineHeight: 1.12
    }
  }, v.name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontWeight: 600,
      flex: 'none'
    }
  }, '$'.repeat(v.priceLevel))), /*#__PURE__*/React.createElement(Rating, {
    value: v.rating,
    count: v.reviewCount,
    size: 15
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      color: 'var(--text-muted)',
      fontSize: '.9rem'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-map-pin",
    style: {
      color: 'var(--chili-500)'
    }
  }), /*#__PURE__*/React.createElement("span", null, v.suburb, " \xB7 ", v.distance)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: '.9rem',
      fontWeight: 600,
      color: s.open ? 'var(--coriander-700)' : 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-clock",
    style: {
      color: s.open ? 'var(--coriander-500)' : 'var(--text-muted)',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", null, s.open ? `Open · until ${s.range.split('–')[1]}` : s.line)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      flexWrap: 'wrap',
      marginTop: 2
    }
  }, v.cuisines.slice(0, 3).map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    style: {
      fontSize: '.74rem',
      padding: '3px 10px'
    }
  }, c)))));
}
function Seg({
  value,
  onChange,
  options
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      border: '2px solid var(--border-strong)',
      borderRadius: 'var(--radius-pill)',
      overflow: 'hidden',
      flex: 'none'
    }
  }, options.map(([val, label]) => /*#__PURE__*/React.createElement("button", {
    key: String(val),
    onClick: () => onChange(val),
    style: {
      border: 'none',
      cursor: 'pointer',
      padding: '5px 14px',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '.9rem',
      background: value === val ? 'var(--chili-500)' : 'transparent',
      color: value === val ? '#fff' : 'var(--ink-700)',
      transition: 'background var(--dur-fast)'
    }
  }, label)));
}
function SearchItem({
  icon,
  title,
  sub,
  onPick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onMouseDown: e => {
      e.preventDefault();
      onPick();
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--paper-100)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      textAlign: 'left',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      padding: '10px 16px',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ph ${icon}`,
    style: {
      color: 'var(--chili-500)',
      fontSize: '1.15rem',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontWeight: 600,
      color: 'var(--ink-900)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: '.82rem',
      color: 'var(--text-muted)'
    }
  }, sub)));
}
function SearchSection({
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 16px 4px',
      fontSize: '.72rem',
      fontWeight: 700,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      background: 'var(--bg-page)'
    }
  }, label);
}

// Single OpenTable-style box: type → grouped Locations + Restaurants suggestions.
function SearchBox({
  data,
  onPickLocation,
  onPickVenue,
  onSubmit
}) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ql = q.trim().toLowerCase();
  const titleCase = s => s.replace(/\b\w/g, c => c.toUpperCase());
  const locs = ql ? Object.entries(data.locations).filter(([k, l]) => k.includes(ql) || l.metro.toLowerCase().includes(ql)).slice(0, 5) : [];
  const vens = ql ? data.venues.filter(v => v.name.toLowerCase().includes(ql) || v.suburb.toLowerCase().includes(ql)).slice(0, 6) : [];
  const show = open && ql.length > 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: '1 1 360px',
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: '#fff',
      border: '2px solid var(--border-strong)',
      borderRadius: 'var(--radius-pill)',
      padding: '4px 4px 4px 16px'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-magnifying-glass",
    style: {
      color: 'var(--text-muted)',
      fontSize: '1.15rem',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    placeholder: "Search a restaurant, suburb or postcode",
    onChange: e => {
      setQ(e.target.value);
      setOpen(true);
    },
    onFocus: () => setOpen(true),
    onBlur: () => setTimeout(() => setOpen(false), 160),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        onSubmit(q);
        setOpen(false);
      }
    },
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: '1rem',
      color: 'var(--ink-900)',
      minWidth: 0
    }
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    onClick: () => {
      onSubmit(q);
      setOpen(false);
    },
    style: {
      flex: 'none'
    }
  }, "Search")), show && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: 0,
      right: 0,
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-soft)',
      overflow: 'hidden',
      zIndex: 60,
      maxHeight: 400,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onMouseDown: e => {
      e.preventDefault();
      onSubmit(q);
      setOpen(false);
    },
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      background: 'var(--chili-500)',
      color: '#fff',
      padding: '11px 16px',
      fontFamily: 'var(--font-body)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-magnifying-glass",
    style: {
      marginRight: 8
    }
  }), "Search \u201C", q, "\u201D"), locs.length > 0 && /*#__PURE__*/React.createElement(SearchSection, {
    label: "Locations"
  }), locs.map(([k, l]) => /*#__PURE__*/React.createElement(SearchItem, {
    key: k,
    icon: "ph-map-pin",
    title: titleCase(k),
    sub: l.metro,
    onPick: () => {
      setQ(titleCase(k));
      setOpen(false);
      onPickLocation(k, l);
    }
  })), vens.length > 0 && /*#__PURE__*/React.createElement(SearchSection, {
    label: "Restaurants"
  }), vens.map(v => /*#__PURE__*/React.createElement(SearchItem, {
    key: v.id,
    icon: "ph-fork-knife",
    title: v.name,
    sub: `${v.suburb} · ${v.venueType}`,
    onPick: () => {
      setQ(v.name);
      setOpen(false);
      onPickVenue(v);
    }
  })), locs.length === 0 && vens.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px',
      color: 'var(--text-muted)'
    }
  }, "No matches \u2014 try another name or suburb.")));
}
function MapExplore({
  onOpen,
  initialQuery = '',
  autoLocate = false
}) {
  const data = window.NE_DATA;
  const [metro, setMetro] = React.useState(data.defaultMetro);
  const [textFilter, setTextFilter] = React.useState('');
  const [price, setPrice] = React.useState(0);
  const [minRating, setMinRating] = React.useState(0);
  const [sort, setSort] = React.useState('featured');
  const [openOnly, setOpenOnly] = React.useState(true);
  const [hovered, setHovered] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('map');
  const [isNarrow, setIsNarrow] = React.useState(false);
  const mapRef = React.useRef(null);
  const mapEl = React.useRef(null);
  const layerRef = React.useRef(null);
  const markersRef = React.useRef({});
  const listEl = React.useRef(null);
  const cardEls = React.useRef({});
  const tf = textFilter.trim().toLowerCase();
  const venues = data.venues.filter(v => (metro === 'All' || v.metro === metro) && (price === 0 || v.priceLevel === price) && v.rating >= minRating && (!openOnly || window.NE_DATA.todayStatus(v).open) && (tf === '' || v.name.toLowerCase().includes(tf) || v.suburb.toLowerCase().includes(tf) || v.cuisines.some(c => c.toLowerCase().includes(tf))));
  const sorted = [...venues];
  if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);else if (sort === 'distance') sorted.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));else if (sort === 'newest') sorted.sort((a, b) => b.id - a.id);

  /* responsive */
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 880px)');
    const on = () => setIsNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  /* init map once */
  React.useEffect(() => {
    const loc = data.locations[data.defaultMetro.toLowerCase()] || {
      center: [-33.815, 150.985],
      zoom: 11
    };
    const map = L.map(mapEl.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true
    }).setView(loc.center, loc.zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap · © CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => {
      map.invalidateSize();
      if (metro === 'All') fitAll();
    }, 60);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* (re)build markers when filtered set changes */
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !layerRef.current) return;
    layerRef.current.clearLayers();
    markersRef.current = {};
    venues.forEach(v => {
      const m = L.marker([v.lat, v.lng], {
        icon: makeIcon(v, false)
      });
      m.bindTooltip(v.name, {
        direction: 'top',
        offset: [0, -34]
      });
      m.on('click', () => {
        setSelected(v.id);
        map.panTo([v.lat, v.lng], {
          animate: true
        });
        const el = cardEls.current[v.id];
        if (el && listEl.current) listEl.current.scrollTo({
          top: el.offsetTop - 12,
          behavior: 'smooth'
        });
      });
      m.on('mouseover', () => setHovered(v.id));
      m.on('mouseout', () => setHovered(null));
      m.addTo(layerRef.current);
      markersRef.current[v.id] = m;
    });
  }, [metro, textFilter, price, minRating, openOnly]);

  /* update highlight imperatively */
  React.useEffect(() => {
    venues.forEach(v => {
      const m = markersRef.current[v.id];
      if (!m) return;
      const hi = v.id === hovered || v.id === selected;
      m.setIcon(makeIcon(v, hi));
      m.setZIndexOffset(hi ? 1000 : 0);
    });
  }, [hovered, selected, metro, textFilter, price, minRating, openOnly]);
  const fitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    const pts = data.venues.map(v => [v.lat, v.lng]);
    map.flyToBounds(L.latLngBounds(pts).pad(0.2), {
      duration: 0.8
    });
  };

  /* pick a location from the search dropdown — recenter the map */
  const pickLocation = (key, loc) => {
    setMetro(loc.metro);
    setTextFilter('');
    setSelected(null);
    if (mapRef.current) mapRef.current.flyTo(loc.center, loc.zoom, {
      duration: 0.8
    });
  };

  /* pick a restaurant from the search dropdown — open its page */
  const pickVenue = v => onOpen(v.id);

  /* free-text submit: jump to a matching location, else filter the list */
  const submitSearch = raw => {
    const key = (raw || '').trim().toLowerCase();
    if (!key) {
      setTextFilter('');
      return;
    }
    if (key === 'australia' || key === 'all') {
      setMetro('All');
      setTextFilter('');
      fitAll();
      return;
    }
    const entry = data.locations[key] || Object.entries(data.locations).find(([k]) => k.includes(key));
    const loc = Array.isArray(entry) ? entry[1] : entry;
    if (loc) {
      setMetro(loc.metro);
      setTextFilter('');
      setSelected(null);
      if (mapRef.current) mapRef.current.flyTo(loc.center, loc.zoom, {
        duration: 0.8
      });
    } else {
      setTextFilter(key);
    }
  };

  /* run the hero search / locate once on entry */
  React.useEffect(() => {
    if (autoLocate) setTimeout(() => nearMe(), 200);else if (initialQuery) setTimeout(() => submitSearch(initialQuery), 120);
  }, []);
  const nearMe = () => {
    const map = mapRef.current;
    if (!map) return;
    setMetro('Sydney');
    const syd = data.locations['sydney'];
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => map.flyTo([p.coords.latitude, p.coords.longitude], 13, {
        duration: 0.8
      }), () => map.flyTo(syd.center, syd.zoom, {
        duration: 0.8
      }), {
        timeout: 3000
      });
    } else map.flyTo(syd.center, syd.zoom, {
      duration: 0.8
    });
  };
  React.useEffect(() => {
    if (viewMode === 'map' && mapRef.current) setTimeout(() => mapRef.current.invalidateSize(), 60);
  }, [viewMode, isNarrow]);
  const locLabel = `${venues.length} ${venues.length === 1 ? 'spot' : 'spots'}${metro !== 'All' ? ` in ${metro}` : ' across Australia'}`;
  const emptyState = /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '48px 0',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '2.2rem'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-cooking-pot"
  })), "No spots here yet \u2014 try another area or filter.");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 57px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 24px',
      borderBottom: '1px solid var(--border-soft)',
      background: 'var(--bg-warm)',
      position: 'relative',
      zIndex: 1200
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(SearchBox, {
    data: data,
    onPickLocation: pickLocation,
    onPickVenue: pickVenue,
    onSubmit: submitSearch
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-navigation-arrow"
    }),
    onClick: nearMe,
    style: {
      flex: 'none',
      whiteSpace: 'nowrap'
    }
  }, "Near me")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      alignItems: 'center',
      marginTop: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenOnly(o => !o),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      border: '2px solid',
      borderColor: openOnly ? 'var(--coriander-500)' : 'var(--border-strong)',
      background: openOnly ? 'var(--coriander-500)' : '#fff',
      color: openOnly ? '#fff' : 'var(--ink-700)',
      borderRadius: 'var(--radius-pill)',
      padding: '5px 16px',
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '.9rem',
      transition: 'all var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-clock"
  }), "Open now"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      color: 'var(--ink-700)',
      fontSize: '.9rem'
    }
  }, "Sort"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: sort,
    onChange: e => setSort(e.target.value),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      border: '2px solid var(--border-strong)',
      borderRadius: 'var(--radius-pill)',
      background: '#fff',
      padding: '5px 34px 5px 14px',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '.9rem',
      color: 'var(--ink-900)',
      cursor: 'pointer',
      outline: 'none'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "featured"
  }, "Featured"), /*#__PURE__*/React.createElement("option", {
    value: "rating"
  }, "Highest rated"), /*#__PURE__*/React.createElement("option", {
    value: "distance"
  }, "Distance"), /*#__PURE__*/React.createElement("option", {
    value: "newest"
  }, "Newest")), /*#__PURE__*/React.createElement("i", {
    className: "ph ph-caret-down",
    style: {
      position: 'absolute',
      right: 13,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--ink-700)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      color: 'var(--ink-700)',
      fontSize: '.9rem'
    }
  }, "Price"), /*#__PURE__*/React.createElement(Seg, {
    value: price,
    onChange: setPrice,
    options: [[0, 'Any'], [1, '$'], [2, '$$'], [3, '$$$']]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      color: 'var(--ink-700)',
      fontSize: '.9rem'
    }
  }, "Rating"), /*#__PURE__*/React.createElement(Seg, {
    value: minRating,
    onChange: setMinRating,
    options: [[0, 'Any'], [4, '★ 4.0+'], [4.5, '★ 4.5+']]
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      position: 'relative',
      display: 'flex'
    }
  }, (!isNarrow || viewMode === 'list') && /*#__PURE__*/React.createElement("div", {
    ref: listEl,
    style: {
      width: isNarrow ? '100%' : 540,
      flex: 'none',
      overflowY: 'auto',
      padding: 16,
      background: 'var(--bg-page)',
      borderRight: isNarrow ? 'none' : '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      color: 'var(--ink-700)',
      padding: '0 2px 12px'
    }
  }, locLabel), venues.length === 0 ? emptyState : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 12
    }
  }, sorted.map(v => /*#__PURE__*/React.createElement(CompactRow, {
    key: v.id,
    v: v,
    narrow: isNarrow,
    hovered: hovered === v.id,
    selected: selected === v.id,
    onOpen: onOpen,
    onHover: setHovered,
    rowRef: el => {
      cardEls.current[v.id] = el;
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: 'relative',
      minWidth: 0,
      display: !isNarrow || viewMode === 'map' ? 'block' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: mapEl,
    style: {
      position: 'absolute',
      inset: 0
    }
  })), isNarrow && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1100
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setViewMode(viewMode === 'map' ? 'list' : 'map'),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--ink-900)',
      color: '#fff',
      border: 'none',
      borderRadius: 'var(--radius-pill)',
      padding: '13px 24px',
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '1.02rem',
      boxShadow: 'var(--shadow-lg)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ph ${viewMode === 'map' ? 'ph-rows' : 'ph-map-trifold'}`,
    style: {
      fontSize: '1.2rem'
    }
  }), viewMode === 'map' ? 'List' : 'Map'))));
}
window.MapExplore = MapExplore;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/MapExplore.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/Stories.jsx
try { (() => {
const {
  Badge,
  Button
} = window.DesignSystem_580998;
function StoryImage({
  hue,
  height,
  radius = 'var(--radius-lg)',
  fontSize = '1.8rem'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      borderRadius: radius,
      background: `linear-gradient(135deg, hsl(${hue},78%,62%), hsl(${(hue + 34) % 360},76%,50%))`,
      display: 'grid',
      placeItems: 'center',
      color: 'rgba(255,255,255,.85)',
      fontSize,
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-image"
  }));
}
function Stories({
  onOpenStory
}) {
  const posts = window.NE_DATA.stories;
  const featured = posts[0];
  const rest = posts.slice(1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: '40px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: '.82rem',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--chili-500)'
    }
  }, "Stories"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '2.6rem',
      margin: '6px 0 4px',
      color: 'var(--ink-900)'
    }
  }, "Tales from the Nepali table"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      margin: '0 0 32px',
      fontSize: '1.15rem',
      maxWidth: 620
    }
  }, "City guides, dish explainers and the people behind the kitchens we love."), /*#__PURE__*/React.createElement("article", {
    onClick: () => onOpenStory(featured.id),
    style: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: 28,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      cursor: 'pointer',
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement(StoryImage, {
    hue: featured.hue,
    height: '100%',
    radius: 0,
    fontSize: '3rem'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '32px 32px 32px 0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "favourite",
    solid: true
  }, featured.category)), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '2rem',
      lineHeight: 1.1,
      color: 'var(--ink-900)',
      margin: '0 0 12px'
    }
  }, featured.title), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--ink-700)',
      fontSize: '1.1rem',
      lineHeight: 1.55,
      margin: '0 0 18px'
    }
  }, featured.dek), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: 'var(--text-muted)',
      fontSize: '.92rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: 'var(--ink-700)'
    }
  }, featured.author), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, featured.date), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, featured.readTime)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 26,
      paddingBottom: 8
    }
  }, rest.map(p => /*#__PURE__*/React.createElement("article", {
    key: p.id,
    onClick: () => onOpenStory(p.id),
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column'
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  }, /*#__PURE__*/React.createElement(StoryImage, {
    hue: p.hue,
    height: 170,
    radius: 0
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "info"
  }, p.category), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '1.3rem',
      lineHeight: 1.15,
      color: 'var(--ink-900)',
      margin: 0
    }
  }, p.title), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--ink-700)',
      lineHeight: 1.5,
      margin: 0,
      flex: 1
    }
  }, p.dek), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: 'var(--text-muted)',
      fontSize: '.85rem'
    }
  }, /*#__PURE__*/React.createElement("span", null, p.date), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, p.readTime)))))));
}
function StoryDetail({
  id,
  onBack
}) {
  const p = window.NE_DATA.stories.find(s => s.id === id) || window.NE_DATA.stories[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-narrow)',
      margin: '0 auto',
      padding: '24px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--ink-700)',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-arrow-left"
  }), " All stories"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "favourite",
    solid: true
  }, p.category)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '2.8rem',
      lineHeight: 1.05,
      color: 'var(--ink-900)',
      margin: '0 0 14px'
    }
  }, p.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: 'var(--text-muted)',
      fontSize: '.95rem',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: 'var(--ink-700)'
    }
  }, p.author), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, p.date), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, p.readTime)), /*#__PURE__*/React.createElement(StoryImage, {
    hue: p.hue,
    height: 320,
    fontSize: '3rem'
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '1.4rem',
      lineHeight: 1.5,
      color: 'var(--ink-900)',
      fontWeight: 500,
      margin: '28px 0 20px'
    }
  }, p.dek), p.body.map((para, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    style: {
      fontSize: '1.15rem',
      lineHeight: 1.7,
      color: 'var(--ink-700)',
      margin: '0 0 18px'
    }
  }, para)), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '32px 0 0',
      padding: '28px',
      background: 'var(--ink-900)',
      borderRadius: 'var(--radius-xl)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '1.6rem',
      color: '#fff',
      margin: '0 0 14px'
    }
  }, "Hungry yet?"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconRight: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-arrow-right"
    }),
    onClick: onBack
  }, "Find these spots on the map")));
}
window.Stories = Stories;
window.StoryDetail = StoryDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/Stories.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/VenueDetail.jsx
try { (() => {
const {
  Button,
  Badge,
  Tag,
  Rating,
  Avatar
} = window.DesignSystem_580998;
const DETAIL_MENU = {
  default: [['Steamed buff momo', '$12'], ['Jhol momo (10 pc)', '$15'], ['Thakali dal bhat set', '$22'], ['Sekuwa platter', '$24'], ['Sel roti (3 pc)', '$7']]
};
const REVIEWS = [{
  name: 'Anish Gurung',
  when: '2 days ago',
  rating: 5,
  text: 'Tastes exactly like home. The jhol momo broth is unreal. Came back twice in one week.'
}, {
  name: 'Maya Shrestha',
  when: '1 week ago',
  rating: 4,
  text: 'Cosy spot, generous portions. Get there early on weekends, it fills up fast.'
}, {
  name: 'Tom Whitfield',
  when: '3 weeks ago',
  rating: 5,
  text: 'My first proper Nepali meal and now I\u2019m hooked. Staff walked me through the whole menu.'
}];
function InfoRow({
  icon,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ph ${icon}`,
    style: {
      color: 'var(--chili-500)',
      fontSize: '1.3rem'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-700)'
    }
  }, children));
}
function VenueDetail({
  id,
  onBack
}) {
  const v = window.NE_DATA.venues.find(x => x.id === id) || window.NE_DATA.venues[0];
  const status = window.NE_DATA.todayStatus(v);
  const week = window.NE_DATA.weekSchedule(v);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: '20px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--ink-700)',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-arrow-left"
  }), " Back to spots"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 280,
      borderRadius: 'var(--radius-xl)',
      background: `linear-gradient(135deg, hsl(${v.hue}, 80%, 62%), hsl(${(v.hue + 40) % 360}, 78%, 52%))`,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      opacity: .35,
      fontSize: '7rem',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-fill ph-fork-knife"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '24px 28px',
      width: '100%',
      background: 'linear-gradient(transparent, rgba(43,26,18,.7))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: status.open ? 'open' : 'closed',
    solid: true
  }, status.open ? 'Open now' : 'Closed'), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    solid: true
  }, v.venueType)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '2.6rem',
      color: '#fff',
      margin: 0,
      lineHeight: 1.05
    }
  }, v.name))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 320px',
      gap: '36px',
      marginTop: '28px',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Rating, {
    value: v.rating,
    count: v.reviewCount,
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontWeight: 600
    }
  }, '$'.repeat(v.priceLevel)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-map-pin"
  }), v.suburb, " \xB7 ", v.distance)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 20
    }
  }, v.cuisines.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c
  }, c))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '1.18rem',
      lineHeight: 1.6,
      color: 'var(--ink-700)',
      margin: '0 0 28px'
    }
  }, v.blurb), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '1.5rem',
      margin: '0 0 8px'
    }
  }, "Popular dishes"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: '8px 20px',
      marginBottom: 32
    }
  }, DETAIL_MENU.default.map(([dish, price]) => /*#__PURE__*/React.createElement("div", {
    key: dish,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-900)',
      fontWeight: 500
    }
  }, dish), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--chili-600)',
      fontWeight: 700,
      fontFamily: 'var(--font-display)'
    }
  }, price)))), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '1.5rem',
      margin: '0 0 14px'
    }
  }, "What people say"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, REVIEWS.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.name,
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: '18px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: r.name,
    size: 40
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontFamily: 'var(--font-display)'
    }
  }, r.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '.85rem'
    }
  }, r.when)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Rating, {
    value: r.rating,
    showValue: false,
    size: 15
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--ink-700)',
      lineHeight: 1.5
    }
  }, r.text))))), /*#__PURE__*/React.createElement("aside", {
    style: {
      position: 'sticky',
      top: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      padding: '20px 22px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    block: true,
    variant: "primary",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-navigation-arrow"
    }),
    style: {
      marginBottom: 10
    }
  }, "Get directions"), /*#__PURE__*/React.createElement(Button, {
    block: true,
    variant: "outline",
    iconLeft: /*#__PURE__*/React.createElement("i", {
      className: "ph ph-phone"
    })
  }, "Call the kitchen"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      paddingTop: 16,
      borderTop: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-clock",
    style: {
      color: status.open ? 'var(--coriander-500)' : 'var(--text-muted)',
      fontSize: '1.3rem'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      color: status.open ? 'var(--coriander-700)' : 'var(--ink-700)'
    }
  }, status.open ? `Open now · until ${status.range.split('–')[1]}` : status.line)), week.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.day,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      fontSize: '0.95rem',
      fontWeight: d.today ? 700 : 400,
      color: d.today ? 'var(--ink-900)' : 'var(--ink-700)'
    }
  }, /*#__PURE__*/React.createElement("span", null, d.day, d.today ? ' · Today' : ''), /*#__PURE__*/React.createElement("span", {
    style: {
      color: d.range === 'Closed' ? 'var(--text-muted)' : 'inherit'
    }
  }, d.range)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      paddingTop: 12,
      borderTop: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement(InfoRow, {
    icon: "ph-map-pin"
  }, v.suburb), /*#__PURE__*/React.createElement(InfoRow, {
    icon: "ph-wheelchair"
  }, "Step-free access"), /*#__PURE__*/React.createElement(InfoRow, {
    icon: "ph-leaf"
  }, "Veg options available"))), /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      width: '100%',
      marginTop: 14,
      background: 'var(--marigold-100)',
      border: 'none',
      borderRadius: 'var(--radius-lg)',
      padding: '14px',
      cursor: 'pointer',
      color: 'var(--marigold-700)',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph ph-heart"
  }), " Save to my list"))));
}
window.VenueDetail = VenueDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/VenueDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/data.js
try { (() => {
// NepaliEats sample venue data (demo only)
window.NE_DATA = {
  cuisines: ['Momo', 'Thakali', 'Newari', 'Sel roti', 'Sekuwa', 'Chatpate', 'Dal bhat', 'Veg-friendly', 'Sweets'],
  // Default map focus = western Sydney, the heart of Nepali Australia.
  defaultMetro: 'Sydney',
  // Opening-hours templates. Index 0=Sun … 6=Sat. null = closed that day.
  schedules: {
    resto: ['12:00-21:00', null, '11:30-21:30', '11:30-21:30', '11:30-21:30', '11:30-22:00', '11:30-22:00'],
    daily: ['11:00-21:00', '11:00-21:00', '11:00-21:00', '11:00-21:00', '11:00-22:00', '11:00-22:00', '11:00-22:00'],
    cafe: ['08:00-15:00', '07:30-16:00', '07:30-16:00', '07:30-16:00', '07:30-16:00', '07:30-16:30', '08:00-16:30'],
    truck: ['11:00-20:00', null, null, null, null, '16:00-21:00', '11:00-21:00']
  },
  // Suburb / postcode lookup for search. Keys are lowercase.
  locations: {
    'sydney': {
      metro: 'Sydney',
      center: [-33.815, 150.985],
      zoom: 11
    },
    'western sydney': {
      metro: 'Sydney',
      center: [-33.815, 150.95],
      zoom: 11
    },
    'parramatta': {
      metro: 'Sydney',
      center: [-33.815, 151.000],
      zoom: 13
    },
    '2150': {
      metro: 'Sydney',
      center: [-33.820, 151.003],
      zoom: 13
    },
    'harris park': {
      metro: 'Sydney',
      center: [-33.823, 151.005],
      zoom: 14
    },
    'rooty hill': {
      metro: 'Sydney',
      center: [-33.770, 150.841],
      zoom: 13
    },
    '2766': {
      metro: 'Sydney',
      center: [-33.770, 150.841],
      zoom: 13
    },
    'blacktown': {
      metro: 'Sydney',
      center: [-33.771, 150.906],
      zoom: 13
    },
    '2148': {
      metro: 'Sydney',
      center: [-33.771, 150.906],
      zoom: 13
    },
    'westmead': {
      metro: 'Sydney',
      center: [-33.807, 150.987],
      zoom: 14
    },
    'liverpool': {
      metro: 'Sydney',
      center: [-33.920, 150.924],
      zoom: 13
    },
    'strathfield': {
      metro: 'Sydney',
      center: [-33.877, 151.095],
      zoom: 14
    },
    'melbourne': {
      metro: 'Melbourne',
      center: [-37.805, 144.910],
      zoom: 12
    },
    'footscray': {
      metro: 'Melbourne',
      center: [-37.800, 144.900],
      zoom: 14
    },
    '3011': {
      metro: 'Melbourne',
      center: [-37.800, 144.900],
      zoom: 14
    },
    'sunshine': {
      metro: 'Melbourne',
      center: [-37.788, 144.833],
      zoom: 14
    },
    'brisbane': {
      metro: 'Brisbane',
      center: [-27.470, 153.010],
      zoom: 12
    },
    'adelaide': {
      metro: 'Adelaide',
      center: [-34.928, 138.600],
      zoom: 12
    },
    'canberra': {
      metro: 'Canberra',
      center: [-35.281, 149.130],
      zoom: 12
    }
  },
  venues: [{
    id: 1,
    name: 'Himalayan Momo House',
    metro: 'Sydney',
    venueType: 'Restaurant',
    sched: 'resto',
    cuisines: ['Momo', 'Newari', 'Thakali'],
    rating: 4.7,
    reviewCount: 212,
    suburb: 'Rooty Hill, NSW',
    distance: '1.2 km',
    priceLevel: 2,
    favourite: true,
    hue: 18,
    lat: -33.7702,
    lng: 150.8412,
    blurb: 'A family kitchen turning out steamer after steamer of jhol momo. The buff momo here have a cult following across western Sydney.'
  }, {
    id: 3,
    name: 'Thakali Kitchen',
    metro: 'Sydney',
    venueType: 'Restaurant',
    sched: 'daily',
    cuisines: ['Thakali', 'Dal bhat'],
    rating: 4.8,
    reviewCount: 140,
    suburb: 'Harris Park, NSW',
    distance: '0.8 km',
    priceLevel: 2,
    favourite: true,
    hue: 35,
    lat: -33.8235,
    lng: 151.0048,
    blurb: 'A proper Thakali thali set: black dal, gundruk, and as many refills as you can handle. Comfort in a steel plate.'
  }, {
    id: 8,
    name: 'Momo Station',
    metro: 'Sydney',
    venueType: 'Food truck',
    sched: 'truck',
    cuisines: ['Momo', 'Chatpate'],
    rating: 4.6,
    reviewCount: 73,
    suburb: 'Parramatta, NSW',
    distance: '0.5 km',
    priceLevel: 1,
    favourite: true,
    hue: 28,
    lat: -33.8150,
    lng: 151.0010,
    blurb: 'A truck that only does momo: steamed, fried, jhol, C-momo. They do it exceptionally well.'
  }, {
    id: 9,
    name: 'Kathmandu Kitchen',
    metro: 'Sydney',
    venueType: 'Restaurant',
    sched: 'resto',
    cuisines: ['Momo', 'Dal bhat', 'Newari'],
    rating: 4.5,
    reviewCount: 110,
    suburb: 'Blacktown, NSW',
    distance: '2.4 km',
    priceLevel: 2,
    favourite: false,
    hue: 12,
    lat: -33.7711,
    lng: 150.9061,
    blurb: 'Big portions, bigger welcome. The samay baji platter is the move when you bring a hungry crew.'
  }, {
    id: 10,
    name: 'Sano Sansar Cafe',
    metro: 'Sydney',
    venueType: 'Cafe',
    sched: 'cafe',
    cuisines: ['Sweets', 'Momo', 'Chatpate'],
    rating: 4.2,
    reviewCount: 57,
    suburb: 'Westmead, NSW',
    distance: '1.1 km',
    priceLevel: 1,
    favourite: false,
    hue: 205,
    lat: -33.8071,
    lng: 150.9872,
    blurb: 'Milky masala chiya, juju dhau and a counter of barfi. A small-world spot for an afternoon catch-up.'
  }, {
    id: 11,
    name: 'Gorkha Grill',
    metro: 'Sydney',
    venueType: 'Restaurant',
    sched: 'daily',
    cuisines: ['Sekuwa', 'Thakali', 'Momo'],
    rating: 4.6,
    reviewCount: 132,
    suburb: 'Liverpool, NSW',
    distance: '5.5 km',
    priceLevel: 2,
    favourite: true,
    hue: 4,
    lat: -33.9201,
    lng: 150.9241,
    blurb: 'Charcoal sekuwa skewers smoking out the back. Go for the mutton, stay for the achaar.'
  }, {
    id: 12,
    name: "Didi's Momo",
    metro: 'Sydney',
    venueType: 'Stall',
    sched: 'truck',
    cuisines: ['Momo', 'Chatpate'],
    rating: 4.7,
    reviewCount: 64,
    suburb: 'Strathfield, NSW',
    distance: '3.2 km',
    priceLevel: 1,
    favourite: false,
    hue: 30,
    lat: -33.8772,
    lng: 151.0951,
    blurb: 'A weekend stall with a queue that says everything. Steamed momo and a chatpate that bites back.'
  }, {
    id: 2,
    name: 'Newa Lahana',
    metro: 'Melbourne',
    venueType: 'Restaurant',
    sched: 'resto',
    cuisines: ['Newari', 'Sekuwa', 'Dal bhat'],
    rating: 4.9,
    reviewCount: 167,
    suburb: 'Sunshine, VIC',
    distance: '2.6 km',
    priceLevel: 3,
    favourite: false,
    hue: 350,
    lat: -37.7881,
    lng: 144.8331,
    blurb: 'The full Newari spread: samay baji platters, fiery choila and bara cooked the way Kathmandu grandmothers intended.'
  }, {
    id: 4,
    name: 'Yak & Yeti Express',
    metro: 'Melbourne',
    venueType: 'Food truck',
    sched: 'truck',
    cuisines: ['Sel roti', 'Chatpate', 'Veg-friendly'],
    rating: 4.4,
    reviewCount: 86,
    suburb: 'Footscray, VIC',
    distance: '3.0 km',
    priceLevel: 1,
    favourite: false,
    hue: 168,
    lat: -37.8001,
    lng: 144.9001,
    blurb: 'Weekend-market legend. Sweet sel roti fried to order and chatpate mixed in front of you. Cash kept handy.'
  }, {
    id: 5,
    name: 'Everest Cafe',
    metro: 'Brisbane',
    venueType: 'Cafe',
    sched: 'cafe',
    cuisines: ['Sweets', 'Momo', 'Veg-friendly'],
    rating: 4.3,
    reviewCount: 98,
    suburb: 'Auchenflower, QLD',
    distance: '4.1 km',
    priceLevel: 1,
    favourite: false,
    hue: 210,
    lat: -27.4751,
    lng: 153.0001,
    blurb: 'Milky masala chiya, juju dhau and a counter of barfi. The neighbourhood spot for an afternoon catch-up.'
  }, {
    id: 6,
    name: 'Pokhara Grill',
    metro: 'Adelaide',
    venueType: 'Restaurant',
    sched: 'resto',
    cuisines: ['Sekuwa', 'Momo', 'Thakali'],
    rating: 4.5,
    reviewCount: 121,
    suburb: 'Adelaide, SA',
    distance: '1.9 km',
    priceLevel: 2,
    favourite: false,
    hue: 6,
    lat: -34.9286,
    lng: 138.6001,
    blurb: 'Charcoal sekuwa skewers smoking out the back, lakeside-Pokhara vibes out front. Go for the mutton.'
  }, {
    id: 7,
    name: 'Annapurna Spice',
    metro: 'Canberra',
    venueType: 'Restaurant',
    sched: 'daily',
    cuisines: ['Dal bhat', 'Veg-friendly'],
    rating: 4.2,
    reviewCount: 64,
    suburb: 'Canberra, ACT',
    distance: '2.2 km',
    priceLevel: 2,
    favourite: false,
    hue: 45,
    lat: -35.2810,
    lng: 149.1301,
    blurb: 'Generous veg thali and a quiet dining room. A reliable hug of a meal after a long day.'
  }]
};

/* ---------- opening-hours helpers ---------- */
(function () {
  const toMin = t => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const fmt = t => {
    let [h, m] = t.split(':').map(Number);
    const ap = h < 12 ? 'am' : 'pm';
    let hh = h % 12;
    if (hh === 0) hh = 12;
    return m === 0 ? `${hh}${ap}` : `${hh}:${String(m).padStart(2, '0')}${ap}`;
  };
  const range = slot => `${fmt(slot.split('-')[0])}–${fmt(slot.split('-')[1])}`;

  // Today's open/closed status + label for a venue.
  window.NE_DATA.todayStatus = function (v, now = new Date()) {
    const sched = window.NE_DATA.schedules[v.sched] || window.NE_DATA.schedules.daily;
    const slot = sched[now.getDay()];
    if (!slot) return {
      open: false,
      range: 'Closed today',
      line: 'Closed today'
    };
    const cur = now.getHours() * 60 + now.getMinutes();
    const [o, c] = slot.split('-');
    const open = cur >= toMin(o) && cur < toMin(c);
    let line;
    if (open) line = `Open · until ${fmt(c)}`;else if (cur < toMin(o)) line = `Closed · opens ${fmt(o)}`;else line = 'Closed · opens tomorrow';
    return {
      open,
      range: range(slot),
      line
    };
  };

  // Full week, ordered Mon→Sun, with today flagged.
  window.NE_DATA.weekSchedule = function (v, now = new Date()) {
    const sched = window.NE_DATA.schedules[v.sched] || window.NE_DATA.schedules.daily;
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const order = [1, 2, 3, 4, 5, 6, 0];
    const today = now.getDay();
    return order.map(i => ({
      day: names[i],
      range: sched[i] ? range(sched[i]) : 'Closed',
      today: i === today
    }));
  };
})();

/* ---------- Stories / blog (demo content) ---------- */
window.NE_DATA.stories = [{
  id: 's1',
  category: 'City guide',
  hue: 18,
  readTime: '6 min read',
  author: 'Maya Shrestha',
  date: 'June 2026',
  title: 'Where to eat momo in western Sydney',
  dek: 'Harris Park to Rooty Hill: the steamy windows, the jhol momo, and the queues worth joining.',
  body: ['Western Sydney is, quietly, the momo capital of Australia. On any given evening the steamers are fogging up windows from Parramatta to Blacktown, and the only hard part is choosing.', 'Start in Harris Park, where Thakali Kitchen plates a dal bhat set that locals drive across the city for. A few suburbs west, Himalayan Momo House has built a cult around its buff momo. Order the jhol, the soupy cousin that arrives swimming in a sesame-tomato broth.', 'The rule of thumb: follow the queues, bring cash for the trucks, and never skip the achaar.']
}, {
  id: 's2',
  category: 'Dish guide',
  hue: 35,
  readTime: '5 min read',
  author: 'NepaliEats',
  date: 'May 2026',
  title: 'A beginner’s guide to Nepali food',
  dek: 'New to momo, dal bhat and sel roti? Here’s how to order your first proper Nepali meal.',
  body: ['Nepali food rewards the curious. If you only know momo, you are standing at the doorway of a much bigger, more generous kitchen.', 'Begin with dal bhat: lentils, rice and a rotating cast of vegetable and pickle sides, the everyday meal that anchors the whole cuisine. Then branch into the Newari table: choila, bara, and samay baji platters built for sharing.', 'Wash it down with milky masala chiya, and if there’s sel roti at the counter, get one. It’s a sweet, ring-shaped rice bread that tastes like celebration.']
}, {
  id: 's3',
  category: 'Spotlight',
  hue: 350,
  readTime: '4 min read',
  author: 'Anish Gurung',
  date: 'May 2026',
  title: 'The family behind Newa Lahana',
  dek: 'In Sunshine, a Melbourne kitchen is cooking the way Kathmandu grandmothers intended.',
  body: ['Newa Lahana didn’t set out to be a destination. It started as a way for one family to cook the Newari food they missed, and the city came knocking.', 'The samay baji platter is the heart of the menu: beaten rice, fiery choila, egg, soybeans and more, each element with its own role. It’s a meal that asks you to slow down.', 'Come hungry, come with friends, and let them bring you whatever is freshest that day.']
}, {
  id: 's4',
  category: 'Festival eats',
  hue: 168,
  readTime: '5 min read',
  author: 'Maya Shrestha',
  date: 'April 2026',
  title: 'Sel roti season: a sweet tradition',
  dek: 'During Tihar and Dashain, the markets fill with the smell of sel roti frying. Here’s where to find it.',
  body: ['There’s a particular smell to festival season — rice batter hitting hot oil, curling into golden rings of sel roti. For many Nepali Australians it’s the smell of home.', 'Around Tihar and Dashain, weekend markets and food trucks like Yak & Yeti Express fry sel roti to order. Sweet, slightly crisp, best eaten warm in your hand.', 'Keep an eye on the NepaliEats map during festival weeks; the pop-ups don’t last long.']
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Rating = __ds_scope.Rating;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.PlaceCard = __ds_scope.PlaceCard;

})();
