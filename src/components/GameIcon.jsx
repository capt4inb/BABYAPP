import {
  Baby,
  Bell,
  Calendar,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Cloud,
  CloudRain,
  Download,
  Droplet,
  Flame,
  Flag,
  History,
  Home,
  Lightbulb,
  LogOut,
  Map,
  Milk,
  Moon,
  NotebookPen,
  Pencil,
  Plus,
  Ruler,
  Syringe,
  Save,
  Scale,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Target,
  Tag,
  Thermometer,
  Toilet,
  Trash2,
  TriangleAlert,
  Upload,
  Users,
  X,
} from 'lucide-react';
import feedIcon from '../assets/activity-feed.svg';
import diaperIcon from '../assets/activity-diaper.svg';
import sleepIcon from '../assets/activity-sleep.svg';
import statsIcon from '../assets/activity-stats.svg';
import pumpIcon from '../assets/activity-pump.svg';
import milkStorageIcon from '../assets/activity-milk-storage.svg';
import wonderIcon from '../assets/activity-wonder.svg';

const ICONS = {
  home: Home,
  history: History,
  milk: Milk,
  stats: ChartNoAxesColumn,
  settings: Settings,
  feed: Milk,
  drop: Droplet,
  plus: Plus,
  close: X,
  trash: Trash2,
  edit: Pencil,
  search: Search,
  down: ChevronDown,
  up: ChevronUp,
  left: ChevronLeft,
  right: ChevronRight,
  ruler: Ruler,
  save: Save,
  download: Download,
  upload: Upload,
  users: Users,
  logout: LogOut,
  cloud: Cloud,
  sun: Sun,
  storm: CloudRain,
  warning: TriangleAlert,
  check: Check,
  clock: Clock,
  calendar: Calendar,
  sliders: SlidersHorizontal,
  snow: Snowflake,
  thermo: Thermometer,
  flame: Flame,
  sparkles: Sparkles,
  target: Target,
  map: Map,
  shield: Shield,
  flag: Flag,
  star: Star,
  weight: Scale,
  bottle: Milk,
  moon: Moon,
  sleep: Moon,
  light: Lightbulb,
  baby: Baby,
  bell: Bell,
  syringe: Syringe,
  vaccine: Syringe,
  poop: Toilet,
  note: NotebookPen,
  tag: Tag,
};

const CUSTOM_ICONS = {
  feed: feedIcon,
  bottle: feedIcon,
  diaper: diaperIcon,
  poop: diaperIcon,
  sleep: sleepIcon,
  moon: sleepIcon,
  stats: statsIcon,
  pump: pumpIcon,
  milkStorage: milkStorageIcon,
  milk: milkStorageIcon,
  wonder: wonderIcon,
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
  const customIcon = CUSTOM_ICONS[name];
  const Icon = ICONS[name] || Circle;
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
      {customIcon ? (
        <img className="game-icon-image" src={customIcon} alt="" aria-hidden="true" draggable="false" />
      ) : (
        <Icon size={Math.max(12, Math.round(size * 0.58))} strokeWidth={2.2} />
      )}
    </span>
  );
}
