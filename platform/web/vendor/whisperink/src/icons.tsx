import { forwardRef, type ReactNode } from "react";
import { IconContext, type Icon, type IconProps } from "@phosphor-icons/react";
import {
  AddressBook as AddressBookBase,
  Aperture as ApertureBase,
  AppWindow as AppWindowBase,
  Archive as ArchiveBase,
  ArrowClockwise as ArrowClockwiseBase,
  ArrowCounterClockwise as ArrowCounterClockwiseBase,
  ArrowDown as ArrowDownBase,
  ArrowLeft as ArrowLeftBase,
  ArrowRight as ArrowRightBase,
  ArrowsClockwise as ArrowsClockwiseBase,
  ArrowsDownUp as ArrowsDownUpBase,
  ArrowsOutCardinal as ArrowsOutCardinalBase,
  ArrowsOutSimple as ArrowsOutSimpleBase,
  ArrowSquareOut as ArrowSquareOutBase,
  ArrowUp as ArrowUpBase,
  ArrowUpRight as ArrowUpRightBase,
  ArrowUUpLeft as ArrowUUpLeftBase,
  Article as ArticleBase,
  Bell as BellBase,
  BookOpenText as BookOpenTextBase,
  Buildings as BuildingsBase,
  CalendarDots as CalendarDotsBase,
  Camera as CameraBase,
  CaretDoubleLeft as CaretDoubleLeftBase,
  CaretDoubleRight as CaretDoubleRightBase,
  CaretDown as CaretDownBase,
  CaretLeft as CaretLeftBase,
  CaretRight as CaretRightBase,
  ChatCircleDots as ChatCircleDotsBase,
  Check as CheckBase,
  CheckCircle as CheckCircleBase,
  CircleNotch as CircleNotchBase,
  ClipboardText as ClipboardTextBase,
  Clock as ClockBase,
  ClockCounterClockwise as ClockCounterClockwiseBase,
  Code as CodeBase,
  CodeBlock as CodeBlockBase,
  Command as CommandBase,
  Compass as CompassBase,
  Copy as CopyBase,
  Crosshair as CrosshairBase,
  Cube as CubeBase,
  Cursor as CursorBase,
  CursorClick as CursorClickBase,
  Desktop as DesktopBase,
  DeviceMobile as DeviceMobileBase,
  DeviceTablet as DeviceTabletBase,
  DotsSix as DotsSixBase,
  DotsSixVertical as DotsSixVerticalBase,
  DotsThree as DotsThreeBase,
  DownloadSimple as DownloadSimpleBase,
  Envelope as EnvelopeBase,
  Eraser as EraserBase,
  Eye as EyeBase,
  FileText as FileTextBase,
  Flag as FlagBase,
  FloppyDisk as FloppyDiskBase,
  FolderOpen as FolderOpenBase,
  Funnel as FunnelBase,
  Gear as GearBase,
  GridFour as GridFourBase,
  HardDrive as HardDriveBase,
  House as HouseBase,
  Image as ImageBase,
  Info as InfoBase,
  Kanban as KanbanBase,
  Keyboard as KeyboardBase,
  Layout as LayoutBase,
  Lifebuoy as LifebuoyBase,
  Lightning as LightningBase,
  LinkSimple as LinkSimpleBase,
  List as ListBase,
  ListBullets as ListBulletsBase,
  ListChecks as ListChecksBase,
  ListDashes as ListDashesBase,
  ListNumbers as ListNumbersBase,
  Lock as LockBase,
  MagnifyingGlass as MagnifyingGlassBase,
  Minus as MinusBase,
  Monitor as MonitorBase,
  Moon as MoonBase,
  Package as PackageBase,
  PaintBrush as PaintBrushBase,
  Palette as PaletteBase,
  PaperPlaneTilt as PaperPlaneTiltBase,
  Paragraph as ParagraphBase,
  PencilSimple as PencilSimpleBase,
  Play as PlayBase,
  Plus as PlusBase,
  Question as QuestionBase,
  Quotes as QuotesBase,
  Receipt as ReceiptBase,
  RocketLaunch as RocketLaunchBase,
  Rows as RowsBase,
  ShareNetwork as ShareNetworkBase,
  SidebarSimple as SidebarSimpleBase,
  SignOut as SignOutBase,
  Sliders as SlidersBase,
  SlidersHorizontal as SlidersHorizontalBase,
  Sparkle as SparkleBase,
  Square as SquareBase,
  SquaresFour as SquaresFourBase,
  Stack as StackBase,
  Sun as SunBase,
  SunDim as SunDimBase,
  Swatches as SwatchesBase,
  Table as TableBase,
  Terminal as TerminalBase,
  TextAa as TextAaBase,
  TextB as TextBBase,
  Textbox as TextboxBase,
  TextHOne as TextHOneBase,
  TextHThree as TextHThreeBase,
  TextHTwo as TextHTwoBase,
  TextItalic as TextItalicBase,
  TextStrikethrough as TextStrikethroughBase,
  TextUnderline as TextUnderlineBase,
  Timer as TimerBase,
  Toolbox as ToolboxBase,
  Trash as TrashBase,
  Tray as TrayBase,
  TrendUp as TrendUpBase,
  UploadSimple as UploadSimpleBase,
  User as UserBase,
  Users as UsersBase,
  Wallet as WalletBase,
  Warning as WarningBase,
  Wheelchair as WheelchairBase,
  X as XBase,
  XCircle as XCircleBase,
} from "@phosphor-icons/react";

export type { Icon, IconProps } from "@phosphor-icons/react";
export { IconContext } from "@phosphor-icons/react";

/** Wraps a Phosphor icon in the kit's light weight without needing a provider. */
export function light(Base: Icon): Icon {
  const Wrapped = forwardRef<SVGSVGElement, IconProps>((props, ref) => <Base ref={ref} weight="light" {...props} />);
  Wrapped.displayName = Base.displayName ?? "Icon";
  return Wrapped;
}

/**
 * Sets light as the default weight for every Phosphor icon in the subtree,
 * so icons the product passes into components match the kit's own icons.
 */
export function IconProvider({ children }: { children: ReactNode }) {
  return <IconContext.Provider value={{ weight: "light" }}>{children}</IconContext.Provider>;
}

/* Icons used inside the kit, pre-wrapped in light. */
export const AddressBook = light(AddressBookBase);
export const Aperture = light(ApertureBase);
export const AppWindow = light(AppWindowBase);
export const Archive = light(ArchiveBase);
export const ArrowClockwise = light(ArrowClockwiseBase);
export const ArrowCounterClockwise = light(ArrowCounterClockwiseBase);
export const ArrowDown = light(ArrowDownBase);
export const ArrowLeft = light(ArrowLeftBase);
export const ArrowRight = light(ArrowRightBase);
export const ArrowsClockwise = light(ArrowsClockwiseBase);
export const ArrowsDownUp = light(ArrowsDownUpBase);
export const ArrowsOutCardinal = light(ArrowsOutCardinalBase);
export const ArrowsOutSimple = light(ArrowsOutSimpleBase);
export const ArrowSquareOut = light(ArrowSquareOutBase);
export const ArrowUp = light(ArrowUpBase);
export const ArrowUpRight = light(ArrowUpRightBase);
export const ArrowUUpLeft = light(ArrowUUpLeftBase);
export const Article = light(ArticleBase);
export const Bell = light(BellBase);
export const BookOpenText = light(BookOpenTextBase);
export const Buildings = light(BuildingsBase);
export const CalendarDots = light(CalendarDotsBase);
export const Camera = light(CameraBase);
export const CaretDoubleLeft = light(CaretDoubleLeftBase);
export const CaretDoubleRight = light(CaretDoubleRightBase);
export const CaretDown = light(CaretDownBase);
export const CaretLeft = light(CaretLeftBase);
export const CaretRight = light(CaretRightBase);
export const ChatCircleDots = light(ChatCircleDotsBase);
export const Check = light(CheckBase);
export const CheckCircle = light(CheckCircleBase);
export const CircleNotch = light(CircleNotchBase);
export const ClipboardText = light(ClipboardTextBase);
export const Clock = light(ClockBase);
export const ClockCounterClockwise = light(ClockCounterClockwiseBase);
export const Code = light(CodeBase);
export const CodeBlock = light(CodeBlockBase);
export const Command = light(CommandBase);
export const Compass = light(CompassBase);
export const Copy = light(CopyBase);
export const Crosshair = light(CrosshairBase);
export const Cube = light(CubeBase);
export const Cursor = light(CursorBase);
export const CursorClick = light(CursorClickBase);
export const Desktop = light(DesktopBase);
export const DeviceMobile = light(DeviceMobileBase);
export const DeviceTablet = light(DeviceTabletBase);
export const DotsSix = light(DotsSixBase);
export const DotsSixVertical = light(DotsSixVerticalBase);
export const DotsThree = light(DotsThreeBase);
export const DownloadSimple = light(DownloadSimpleBase);
export const Envelope = light(EnvelopeBase);
export const Eraser = light(EraserBase);
export const Eye = light(EyeBase);
export const FileText = light(FileTextBase);
export const Flag = light(FlagBase);
export const FloppyDisk = light(FloppyDiskBase);
export const FolderOpen = light(FolderOpenBase);
export const Funnel = light(FunnelBase);
export const Gear = light(GearBase);
export const GridFour = light(GridFourBase);
export const HardDrive = light(HardDriveBase);
export const House = light(HouseBase);
export const Image = light(ImageBase);
export const Info = light(InfoBase);
export const Kanban = light(KanbanBase);
export const Keyboard = light(KeyboardBase);
export const Layout = light(LayoutBase);
export const Lifebuoy = light(LifebuoyBase);
export const Lightning = light(LightningBase);
export const LinkSimple = light(LinkSimpleBase);
export const List = light(ListBase);
export const ListBullets = light(ListBulletsBase);
export const ListChecks = light(ListChecksBase);
export const ListDashes = light(ListDashesBase);
export const ListNumbers = light(ListNumbersBase);
export const Lock = light(LockBase);
export const MagnifyingGlass = light(MagnifyingGlassBase);
export const Minus = light(MinusBase);
export const Monitor = light(MonitorBase);
export const Moon = light(MoonBase);
export const Package = light(PackageBase);
export const PaintBrush = light(PaintBrushBase);
export const Palette = light(PaletteBase);
export const PaperPlaneTilt = light(PaperPlaneTiltBase);
export const Paragraph = light(ParagraphBase);
export const PencilSimple = light(PencilSimpleBase);
export const Play = light(PlayBase);
export const Plus = light(PlusBase);
export const Question = light(QuestionBase);
export const Quotes = light(QuotesBase);
export const Receipt = light(ReceiptBase);
export const RocketLaunch = light(RocketLaunchBase);
export const Rows = light(RowsBase);
export const ShareNetwork = light(ShareNetworkBase);
export const SidebarSimple = light(SidebarSimpleBase);
export const SignOut = light(SignOutBase);
export const Sliders = light(SlidersBase);
export const SlidersHorizontal = light(SlidersHorizontalBase);
export const Sparkle = light(SparkleBase);
export const Square = light(SquareBase);
export const SquaresFour = light(SquaresFourBase);
export const Stack = light(StackBase);
export const Sun = light(SunBase);
export const SunDim = light(SunDimBase);
export const Swatches = light(SwatchesBase);
export const Table = light(TableBase);
export const Terminal = light(TerminalBase);
export const TextAa = light(TextAaBase);
export const TextB = light(TextBBase);
export const Textbox = light(TextboxBase);
export const TextHOne = light(TextHOneBase);
export const TextHThree = light(TextHThreeBase);
export const TextHTwo = light(TextHTwoBase);
export const TextItalic = light(TextItalicBase);
export const TextStrikethrough = light(TextStrikethroughBase);
export const TextUnderline = light(TextUnderlineBase);
export const Timer = light(TimerBase);
export const Toolbox = light(ToolboxBase);
export const Trash = light(TrashBase);
export const Tray = light(TrayBase);
export const TrendUp = light(TrendUpBase);
export const UploadSimple = light(UploadSimpleBase);
export const User = light(UserBase);
export const Users = light(UsersBase);
export const Wallet = light(WalletBase);
export const Warning = light(WarningBase);
export const Wheelchair = light(WheelchairBase);
export const X = light(XBase);
export const XCircle = light(XCircleBase);
