import {
  Anchor,
  Atom,
  Binoculars,
  Book,
  Briefcase,
  Camera,
  Code,
  Coffee,
  Compass,
  Cpu,
  Crown,
  Diamond,
  Flame,
  Globe,
  Heart,
  House,
  Leaf,
  Lightning,
  Moon,
  Mountains,
  MusicNote,
  Palette,
  Planet,
  PuzzlePiece,
  Robot,
  Rocket,
  Shield,
  Sparkle,
  Star,
  Sun,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type { UniverseIconName, UniverseIconColor } from "@lightspeed-ai/platform-shared";
import { cn } from "@/lib/utils";
import { UNIVERSE_ICON_BACKGROUNDS } from "@/lib/identity-colors";

export const UNIVERSE_ICON_GLYPHS: Record<UniverseIconName, PhosphorIcon> = {
  orbit: Planet, globe: Globe, rocket: Rocket, star: Star, sparkles: Sparkle,
  zap: Lightning, sun: Sun, moon: Moon, atom: Atom, compass: Compass,
  mountain: Mountains, leaf: Leaf, flame: Flame, heart: Heart, code: Code, briefcase: Briefcase,
  house: House, music: MusicNote, shield: Shield, bot: Robot,
  anchor: Anchor, book: Book, camera: Camera, coffee: Coffee, crown: Crown,
  gem: Diamond, palette: Palette, puzzle: PuzzlePiece, telescope: Binoculars, cpu: Cpu,
};

export function UniverseIcon({ icon = "orbit", iconColor = "default", className }: {
  icon?: UniverseIconName;
  iconColor?: UniverseIconColor;
  className?: string;
}) {
  const Icon = UNIVERSE_ICON_GLYPHS[icon] ?? Planet;
  const background = UNIVERSE_ICON_BACKGROUNDS[iconColor] ?? UNIVERSE_ICON_BACKGROUNDS.default;
  const foreground = background === UNIVERSE_ICON_BACKGROUNDS.default
    ? "bg-sidebar-primary text-sidebar-primary-foreground"
    : "text-white";
  return (
    <span aria-hidden="true" style={{ background }} className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", foreground, className)}>
      <Icon className="size-4" />
    </span>
  );
}
