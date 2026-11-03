import { createContext, useContext } from "react";

/**
 * Every piece of copy the kit renders on its own account: button labels,
 * accessible names, empty states. An application overrides only what it cares
 * about — anything it leaves out keeps the built-in wording, so a kit release
 * that adds a string never renders a blank or a raw key.
 *
 * Interpolated copy is a function rather than a template with placeholders, so
 * a translation can put the parts in whatever order its language needs.
 */
export type WhisperinkText = {
  actions: {
    close: string;
    remove: string;
    skip: string;
    today: string;
    undo: string;
  };
  field: {
    optional: string;
    helpFor: (label: string) => string;
  };
  search: {
    placeholder: string;
    label: string;
  };
  colorPicker: {
    edit: (label: string) => string;
    views: string;
    adjust: string;
    hex: string;
    rgb: string;
    hsb: string;
    colorModel: string;
    hue: string;
    red: string;
    green: string;
    blue: string;
    redShort: string;
    greenShort: string;
    blueShort: string;
    hueShort: string;
    saturation: string;
    brightness: string;
    saturationShort: string;
    brightnessShort: string;
    saturationBrightness: string;
    saturationBrightnessValue: (saturation: number, brightness: number) => string;
    searchPalette: (palette: string) => string;
    noPaletteMatches: string;
  };
  feedback: {
    loading: string;
  };
  error: {
    causes: string;
    details: string;
    hideDetails: string;
    report: string;
  };
  nav: {
    breadcrumb: string;
    expandSidebar: string;
    collapseSidebar: string;
    moreCrumbs: string;
    navigation: string;
    mainNavigation: string;
    closeNavigation: string;
    skipToContent: string;
    sections: string;
    notifications: (count: number) => string;
    account: (name: string) => string;
    profile: string;
    settings: string;
    signOut: string;
  };
  pageActions: {
    label: string;
    more: string;
  };
  table: {
    pagination: string;
    rowsPerPage: string;
    previousPage: string;
    nextPage: string;
    page: (page: number) => string;
    range: (from: number, to: number, total: number) => string;
    perPage: (size: number) => string;
    selected: (count: number) => string;
    clearSelection: string;
  };
  list: {
    move: string;
    moveHint: string;
    /** Announced after a keyboard move, since nothing else says where the item went. */
    moved: (position: number, total: number) => string;
  };
  tree: {
    expand: (label: string) => string;
    collapse: (label: string) => string;
  };
  dropzone: {
    label: string;
    rejected: (count: number) => string;
  };
  code: {
    copy: string;
    copied: string;
  };
  agenda: {
    empty: string;
  };
  timeline: {
    project: string;
    today: string;
    deadline: string;
  };
  dock: {
    help: string;
    close: string;
    movePanel: string;
    moveToolbar: string;
    /** Accessible name of a split tool's caret, when the host names none. */
    toolOptions: string;
    panelOptions: string;
    dockTop: string;
    dockLeft: string;
    dockRight: string;
    dockBottom: string;
    resize: string;
    resizeHint: string;
    dropHint: string;
    side: (side: string) => string;
    panelHint: (title: string) => string;
  };
  powerApp: {
    panels: string;
    visible: string;
    closed: string;
    /** Menu entry that brings a closed panel back; a function, since languages place the name differently. */
    show: (panel: string) => string;
    resetLayout: string;
    layoutReset: string;
    closedPanels: (count: number) => string;
  };
  markdown: {
    /** Accessible name of the anchor beside a heading. */
    anchor: (heading: string) => string;
    /** Titles of callouts (`> [!NOTE]` and friends) that bring none of their own. */
    callouts: Record<"note" | "tip" | "important" | "warning" | "caution", string>;
  };
  manual: {
    contents: string;
    search: string;
    clearSearch: string;
    results: (count: number) => string;
    onThisPage: string;
    previous: string;
    next: string;
    showContents: string;
    notFound: string;
    notFoundHint: string;
  };
  calendar: {
    weekAbbreviation: string;
    weekNumber: (week: number) => string;
    previousMonth: string;
    nextMonth: string;
    previousYear: string;
    nextYear: string;
    previousWeek: string;
    nextWeek: string;
    pickMonthAndYear: string;
    year: string;
    yearBack: string;
    yearForward: string;
    clear: string;
    hint: string;
    noDate: string;
    current: string;
    selected: string;
    range: string;
    more: (count: number) => string;
    shortcuts: {
      today: string;
      tomorrow: string;
      nextMonday: string;
      inOneWeek: string;
      inTwoWeeks: string;
      endOfMonth: string;
      inOneMonth: string;
    };
    kinds: {
      item: string;
      task: string;
      deadline: string;
      "project-start": string;
      "project-end": string;
    };
    roles: Record<
      "date" | "start" | "end" | "deadline",
      { placeholder: string; title: string }
    >;
    pair: { start: string; end: string };
    keyboard: { day: string; month: string; year: string; today: string; select: string };
  };
  richText: {
    editor: string; modes: string; visual: string; markdown: string; html: string; toolbar: string;
    placeholder: string; visualHint: string; sourceHint: string; readOnlyHint: string;
    link: string; image: string; url: string; linkText: string; alt: string; altHint: string;
    linkHint: string; imageHint: string; invalidUrl: string; apply: string; cancel: string; remove: string; code: string;
    dropHint: string;
    limit: (max: number) => string;
    count: (length: number, max?: number) => string;
    tools: Record<"undo" | "redo" | "paragraph" | "heading1" | "heading2" | "heading3" | "bold" | "italic" | "strike" | "bulletList" | "orderedList" | "quote" | "link" | "image" | "inlineCode" | "codeBlock" | "rule" | "clear", string>;
  };
};

export const defaultText: WhisperinkText = {
  actions: {
    close: "Close",
    remove: "Remove",
    skip: "Skip",
    today: "Today",
    undo: "Undo",
  },
  field: {
    optional: "Optional",
    helpFor: (label) => `Help with ${label}`,
  },
  search: {
    placeholder: "Search …",
    label: "Search",
  },
  colorPicker: {
    edit: (label) => `Edit ${label}`,
    views: "Colour views",
    adjust: "Adjust",
    hex: "HEX",
    rgb: "RGB",
    hsb: "HSB",
    colorModel: "Colour model",
    hue: "Hue",
    red: "Red",
    green: "Green",
    blue: "Blue",
    redShort: "R",
    greenShort: "G",
    blueShort: "B",
    hueShort: "H",
    saturation: "Saturation",
    brightness: "Brightness",
    saturationShort: "S",
    brightnessShort: "B",
    saturationBrightness: "Saturation and brightness",
    saturationBrightnessValue: (saturation, brightness) => `${saturation} % saturation, ${brightness} % brightness`,
    searchPalette: (palette) => `Search ${palette} …`,
    noPaletteMatches: "No matching colours",
  },
  feedback: {
    loading: "Loading",
  },
  error: {
    causes: "What needs attention",
    details: "Show details",
    hideDetails: "Hide details",
    report: "Error report",
  },
  nav: {
    breadcrumb: "Breadcrumb",
    expandSidebar: "Expand",
    collapseSidebar: "Collapse",
    moreCrumbs: "More levels",
    navigation: "Navigation",
    mainNavigation: "Main navigation",
    closeNavigation: "Close navigation",
    skipToContent: "Skip to content",
    sections: "Sections",
    notifications: (count) => count === 0 ? "Notifications" : count === 1 ? "1 new notification" : `${count} new notifications`,
    account: (name) => `Account: ${name}`,
    profile: "Profile",
    settings: "Settings",
    signOut: "Sign out",
  },
  pageActions: {
    label: "Page actions",
    more: "More actions",
  },
  table: {
    pagination: "Pagination",
    rowsPerPage: "Rows per page",
    previousPage: "Previous page",
    nextPage: "Next page",
    page: (page) => `Page ${page}`,
    range: (from, to, total) => `${from}–${to} of ${total}`,
    perPage: (size) => `${size} per page`,
    selected: (count) => `${count} selected`,
    clearSelection: "Clear selection",
  },
  list: {
    move: "Move (up and down arrows)",
    moveHint: "Drag, or move with the arrow keys",
    moved: (position, total) => `Moved to position ${position} of ${total}`,
  },
  tree: {
    expand: (label) => `Expand ${label}`,
    collapse: (label) => `Collapse ${label}`,
  },
  dropzone: {
    label: "Drop a file here or choose one",
    rejected: (count) => count === 1 ? "This file type isn't supported" : `${count} files have an unsupported type`,
  },
  code: {
    copy: "Copy",
    copied: "Copied",
  },
  agenda: {
    empty: "Nothing planned",
  },
  timeline: {
    project: "Project",
    today: "Today",
    deadline: "Deadline",
  },
  dock: {
    help: "Help",
    close: "Close",
    movePanel: "Move panel",
    moveToolbar: "Move toolbar",
    toolOptions: "More options",
    panelOptions: "Panel options",
    dockTop: "Dock to the top",
    dockLeft: "Dock to the left",
    dockRight: "Dock to the right",
    dockBottom: "Dock to the bottom",
    resize: "Resize",
    resizeHint: "Resize (arrow keys)",
    dropHint: "Drop the panel here",
    side: (side) => `${side} dock`,
    panelHint: (title) => `${title} – drag to move, middle-click to close`,
  },
  powerApp: {
    panels: "Panels",
    visible: "Visible",
    closed: "Closed",
    show: (panel) => `Show ${panel}`,
    resetLayout: "Reset layout",
    layoutReset: "Layout reset",
    closedPanels: (count) => `${count} panel${count === 1 ? "" : "s"} closed`,
  },
  markdown: {
    anchor: (heading) => `Link to “${heading}”`,
    callouts: { note: "Note", tip: "Tip", important: "Important", warning: "Warning", caution: "Caution" },
  },
  manual: {
    contents: "Contents",
    search: "Search the manual …",
    clearSearch: "Clear search",
    results: (count) => count === 0 ? "No results" : count === 1 ? "1 result" : `${count} results`,
    onThisPage: "On this page",
    previous: "Previous",
    next: "Next",
    showContents: "Table of contents",
    notFound: "This page doesn't exist",
    notFoundHint: "Pick a page from the table of contents.",
  },
  calendar: {
    weekAbbreviation: "Wk",
    weekNumber: (week) => `Week ${week}`,
    previousMonth: "Previous month",
    nextMonth: "Next month",
    previousYear: "Previous year",
    nextYear: "Next year",
    previousWeek: "Previous week",
    nextWeek: "Next week",
    pickMonthAndYear: "Choose month and year",
    year: "Year",
    yearBack: "Year back",
    yearForward: "Year forward",
    clear: "Clear date",
    hint: "Click a day, use a shortcut, or move with the keyboard.",
    noDate: "No date chosen",
    current: "Current:",
    selected: "Selected",
    range: "Range",
    more: (count) => `+${count} more`,
    shortcuts: {
      today: "Today",
      tomorrow: "Tomorrow",
      nextMonday: "Next Monday",
      inOneWeek: "In 1 week",
      inTwoWeeks: "In 2 weeks",
      endOfMonth: "End of month",
      inOneMonth: "In 1 month",
    },
    kinds: {
      item: "Appointment",
      task: "Task",
      deadline: "Deadline",
      "project-start": "Project start",
      "project-end": "Project end",
    },
    roles: {
      date: { placeholder: "Choose a date", title: "Choose a date" },
      start: { placeholder: "Choose a start", title: "Choose the start" },
      end: { placeholder: "Choose an end", title: "Choose the end" },
      deadline: { placeholder: "Choose a deadline", title: "Choose the deadline" },
    },
    pair: { start: "Start", end: "End" },
    keyboard: { day: "Day", month: "Month", year: "Year", today: "Today", select: "Select" },
  },
  richText: {
    editor: "Edit text", modes: "Editing view", visual: "Formatted", markdown: "Markdown", html: "HTML", toolbar: "Format text",
    placeholder: "Start writing …", visualHint: "Select text to format it · Ctrl/⌘ + B, I, K · Alt + F10 for the toolbar",
    sourceHint: "Editing the source. Switching back keeps supported elements and safe links only.",
    readOnlyHint: "Read only. Every view shows the same content.",
    link: "Edit link", image: "Edit image", url: "Address", linkText: "Link text", alt: "Image description", altHint: "Describes the image for people who can't see it.",
    linkHint: "https://, http://, /page, #anchor, mailto: or tel:", imageHint: "The full https:// or http:// address of an image.",
    invalidUrl: "Enter a valid, complete address.", apply: "Apply", cancel: "Cancel", remove: "Remove", code: "Code",
    dropHint: "Add files and dragged content through “Image” or the clipboard.",
    limit: (max) => `At most ${max} characters. The last change wasn't applied.`,
    count: (length, max) => `${length}${max === undefined ? "" : ` / ${max}`} characters`,
    tools: {
      undo: "Undo (Ctrl/⌘ + Z)", redo: "Redo (Ctrl/⌘ + Shift + Z)", paragraph: "Paragraph", heading1: "Heading 1", heading2: "Heading 2", heading3: "Heading 3",
      bold: "Bold (Ctrl/⌘ + B)", italic: "Italic (Ctrl/⌘ + I)", strike: "Strikethrough", bulletList: "Bulleted list", orderedList: "Numbered list", quote: "Quote",
      link: "Link (Ctrl/⌘ + K)", image: "Image", inlineCode: "Inline code", codeBlock: "Code block", rule: "Divider", clear: "Clear formatting",
    },
  },
};

/**
 * The kit's copy in Swiss German ("ss", never "ß"), as shipped before English
 * became the default. Pass it to `WhisperinkProvider`'s `text` together with
 * `locale="de-CH"`.
 */
export const swissGermanText: WhisperinkText = {
  actions: {
    close: "Schliessen",
    remove: "Entfernen",
    skip: "Überspringen",
    today: "Heute",
    undo: "Rückgängig",
  },
  field: {
    optional: "Optional",
    helpFor: (label) => `Hilfe zu ${label}`,
  },
  search: {
    placeholder: "Suchen …",
    label: "Suchen",
  },
  colorPicker: {
    edit: (label) => `${label} bearbeiten`,
    views: "Farbauswahl",
    adjust: "Anpassen",
    hex: "HEX",
    rgb: "RGB",
    hsb: "HSB",
    colorModel: "Farbmodell",
    hue: "Farbton",
    red: "Rot",
    green: "Grün",
    blue: "Blau",
    redShort: "R",
    greenShort: "G",
    blueShort: "B",
    hueShort: "H",
    saturation: "Sättigung",
    brightness: "Helligkeit",
    saturationShort: "S",
    brightnessShort: "B",
    saturationBrightness: "Sättigung und Helligkeit",
    saturationBrightnessValue: (saturation, brightness) => `${saturation} % Sättigung, ${brightness} % Helligkeit`,
    searchPalette: (palette) => `${palette} durchsuchen …`,
    noPaletteMatches: "Keine passenden Farben",
  },
  feedback: {
    loading: "Wird geladen",
  },
  error: {
    causes: "Betroffene Angaben",
    details: "Details anzeigen",
    hideDetails: "Details ausblenden",
    report: "Fehlerbericht",
  },
  nav: {
    breadcrumb: "Navigationspfad",
    expandSidebar: "Ausklappen",
    collapseSidebar: "Einklappen",
    moreCrumbs: "Weitere Ebenen",
    navigation: "Navigation",
    mainNavigation: "Hauptnavigation",
    closeNavigation: "Navigation schliessen",
    skipToContent: "Zum Inhalt springen",
    sections: "Bereiche",
    notifications: (count) => count === 0 ? "Benachrichtigungen" : count === 1 ? "1 neue Benachrichtigung" : `${count} neue Benachrichtigungen`,
    account: (name) => `Konto: ${name}`,
    profile: "Profil",
    settings: "Einstellungen",
    signOut: "Abmelden",
  },
  pageActions: {
    label: "Seitenaktionen",
    more: "Weitere Aktionen",
  },
  table: {
    pagination: "Seitennavigation",
    rowsPerPage: "Zeilen pro Seite",
    previousPage: "Vorherige Seite",
    nextPage: "Nächste Seite",
    page: (page) => `Seite ${page}`,
    range: (from, to, total) => `${from}–${to} von ${total}`,
    perPage: (size) => `${size} / Seite`,
    selected: (count) => `${count} ausgewählt`,
    clearSelection: "Auswahl aufheben",
  },
  list: {
    move: "Verschieben (Pfeiltasten hoch/runter)",
    moveHint: "Ziehen oder mit Pfeiltasten verschieben",
    moved: (position, total) => `Verschoben an Position ${position} von ${total}`,
  },
  tree: {
    expand: (label) => `${label} ausklappen`,
    collapse: (label) => `${label} einklappen`,
  },
  dropzone: {
    label: "Datei hierher ziehen oder auswählen",
    rejected: (count) => count === 1 ? "Dieser Dateityp wird nicht unterstützt" : `${count} Dateien haben einen nicht unterstützten Typ`,
  },
  code: {
    copy: "Kopieren",
    copied: "Kopiert",
  },
  agenda: {
    empty: "Keine Aufgaben",
  },
  timeline: {
    project: "Projekt",
    today: "Heute",
    deadline: "Frist",
  },
  dock: {
    help: "Hilfe",
    close: "Schliessen",
    movePanel: "Panel verschieben",
    moveToolbar: "Werkzeugleiste verschieben",
    toolOptions: "Weitere Optionen",
    panelOptions: "Panel-Optionen",
    dockTop: "Oben andocken",
    dockLeft: "Links andocken",
    dockRight: "Rechts andocken",
    dockBottom: "Unten andocken",
    resize: "Grösse ändern",
    resizeHint: "Grösse ändern (Pfeiltasten)",
    dropHint: "Panel hierher ziehen",
    side: (side) => `Dock ${side}`,
    panelHint: (title) => `${title} – ziehen zum Verschieben, Mittelklick zum Schliessen`,
  },
  powerApp: {
    panels: "Panels",
    visible: "Sichtbar",
    closed: "Geschlossen",
    show: (panel) => `${panel} einblenden`,
    resetLayout: "Layout zurücksetzen",
    layoutReset: "Layout zurückgesetzt",
    closedPanels: (count) => `${count} Panel${count === 1 ? "" : "s"} geschlossen`,
  },
  markdown: {
    anchor: (heading) => `Link zu «${heading}»`,
    callouts: { note: "Hinweis", tip: "Tipp", important: "Wichtig", warning: "Achtung", caution: "Vorsicht" },
  },
  manual: {
    contents: "Inhalt",
    search: "Handbuch durchsuchen …",
    clearSearch: "Suche leeren",
    results: (count) => count === 0 ? "Keine Treffer" : count === 1 ? "1 Treffer" : `${count} Treffer`,
    onThisPage: "Auf dieser Seite",
    previous: "Zurück",
    next: "Weiter",
    showContents: "Inhaltsverzeichnis",
    notFound: "Diese Seite gibt es nicht",
    notFoundHint: "Wählen Sie eine Seite aus dem Inhaltsverzeichnis.",
  },
  calendar: {
    weekAbbreviation: "KW",
    weekNumber: (week) => `Kalenderwoche ${week}`,
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    previousYear: "Vorheriges Jahr",
    nextYear: "Nächstes Jahr",
    previousWeek: "Vorherige Woche",
    nextWeek: "Nächste Woche",
    pickMonthAndYear: "Monat und Jahr wählen",
    year: "Jahr",
    yearBack: "Jahr zurück",
    yearForward: "Jahr vor",
    clear: "Datum entfernen",
    hint: "Tag anklicken, Kurzwahl nutzen oder mit der Tastatur navigieren.",
    noDate: "Kein Datum gewählt",
    current: "Aktuell:",
    selected: "Gewählt",
    range: "Zeitraum",
    more: (count) => `+${count} weitere`,
    shortcuts: {
      today: "Heute",
      tomorrow: "Morgen",
      nextMonday: "Nächster Montag",
      inOneWeek: "In 1 Woche",
      inTwoWeeks: "In 2 Wochen",
      endOfMonth: "Monatsende",
      inOneMonth: "In 1 Monat",
    },
    kinds: {
      item: "Termin",
      task: "Aufgabe",
      deadline: "Frist",
      "project-start": "Projektstart",
      "project-end": "Projektende",
    },
    roles: {
      date: { placeholder: "Datum wählen", title: "Datum auswählen" },
      start: { placeholder: "Beginn wählen", title: "Beginn auswählen" },
      end: { placeholder: "Ende wählen", title: "Ende auswählen" },
      deadline: { placeholder: "Frist wählen", title: "Frist auswählen" },
    },
    pair: { start: "Beginn", end: "Ende" },
    keyboard: { day: "Tag", month: "Monat", year: "Jahr", today: "Heute", select: "Wählen" },
  },
  richText: {
    editor: "Text bearbeiten", modes: "Bearbeitungsansicht", visual: "Formatiert", markdown: "Markdown", html: "HTML", toolbar: "Text formatieren",
    placeholder: "Hier schreiben …", visualHint: "Text markieren und formatieren · Ctrl/⌘ + B, I, K · Alt + F10 zur Werkzeugleiste",
    sourceHint: "Quelltext bearbeiten. Beim Wechsel werden nur unterstützte Elemente und sichere Links übernommen.",
    readOnlyHint: "Nur lesen. Die verfügbaren Ansichten zeigen denselben Inhalt.",
    link: "Link bearbeiten", image: "Bild bearbeiten", url: "Adresse", linkText: "Linktext", alt: "Bildbeschreibung", altHint: "Beschreibt den Bildinhalt für Personen, die das Bild nicht sehen können.",
    linkHint: "https://, http://, /seite, #anker, mailto: oder tel:", imageHint: "Vollständige https://- oder http://-Adresse eines Bildes.",
    invalidUrl: "Bitte eine gültige, vollständige Adresse eingeben.", apply: "Übernehmen", cancel: "Abbrechen", remove: "Entfernen", code: "Code",
    dropHint: "Dateien und gezogene Inhalte bitte über «Bild» oder die Zwischenablage einfügen.",
    limit: (max) => `Maximal ${max} Zeichen. Die letzte Änderung wurde nicht übernommen.`,
    count: (length, max) => `${length}${max === undefined ? "" : ` / ${max}`} Zeichen`,
    tools: {
      undo: "Rückgängig (Ctrl/⌘ + Z)", redo: "Wiederholen (Ctrl/⌘ + Shift + Z)", paragraph: "Absatz", heading1: "Überschrift 1", heading2: "Überschrift 2", heading3: "Überschrift 3",
      bold: "Fett (Ctrl/⌘ + B)", italic: "Kursiv (Ctrl/⌘ + I)", strike: "Durchgestrichen", bulletList: "Aufzählung", orderedList: "Nummerierte Liste", quote: "Zitat",
      link: "Link (Ctrl/⌘ + K)", image: "Bild", inlineCode: "Code im Text", codeBlock: "Codeblock", rule: "Trennlinie", clear: "Textformatierung entfernen",
    },
  },
};

/** Overrides may stop at any level; everything below keeps the kit's wording. */
export type TextOverrides = {
  [Group in keyof WhisperinkText]?: {
    [Key in keyof WhisperinkText[Group]]?: WhisperinkText[Group][Key] extends
      Record<string, unknown>
      ? Partial<WhisperinkText[Group][Key]>
      : WhisperinkText[Group][Key];
  };
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Overlays overrides onto the defaults; functions and strings are leaves. */
export function mergeText(overrides?: TextOverrides): WhisperinkText {
  if (!overrides) return defaultText;
  const merged = { ...defaultText } as Record<string, unknown>;
  for (const [group, values] of Object.entries(overrides)) {
    if (!isPlainObject(values)) continue;
    const base = merged[group];
    if (!isPlainObject(base)) continue;
    const next: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) continue;
      const leaf = next[key];
      next[key] = isPlainObject(value) && isPlainObject(leaf) ? { ...leaf, ...value } : value;
    }
    merged[group] = next;
  }
  return merged as WhisperinkText;
}

export const TextContext = createContext<WhisperinkText>(defaultText);

/** The kit's own copy, with whatever the application overrode. */
export function useText(): WhisperinkText {
  return useContext(TextContext);
}
