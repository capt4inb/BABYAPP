const ICONS = {
  home: '🏠',
  history: '🕘',
  milk: '🍼',
  stats: '📊',
  wonder: '⭐',
  settings: '⚙',
  feed: '🍼',
  drop: '💧',
  plus: '+',
  close: '×',
  trash: '⌫',
  edit: '✎',
  search: '⌕',
  down: '⌄',
  up: '⌃',
  right: '›',
  save: '▣',
  download: '⇩',
  upload: '⇧',
  users: '👪',
  logout: '↪',
  cloud: '☁',
  sun: '☀',
  storm: '☁',
  warning: '!',
  check: '✓',
  clock: '🕘',
  calendar: '□',
  sliders: '≡',
  snow: '🧊',
  thermo: '🌡',
  flame: '🔥',
  sparkles: '✨',
  target: '🎯',
  map: '▤',
  shield: '⬟',
  flag: '⚑',
  star: '⭐',
  weight: '⚖',
  bottle: '🍼',
  light: '💡',
};

export default function GameIcon({
  name,
  size = 34,
  variant = 'lavender',
  className = '',
  label,
  bare = false,
  style,
}) {
  const glyph = ICONS[name] || name || '•';
  const classes = bare
    ? `game-icon-bare ${className}`.trim()
    : `game-icon game-icon-${variant} ${className}`.trim();

  return (
    <span
      className={classes}
      style={{ '--game-icon-size': `${size}px`, ...style }}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
    >
      {glyph}
    </span>
  );
}
