const STORAGE_KEY = "nudge.uiAccent";
const CUSTOM_HEX_STORAGE_KEY = "nudge.uiAccent.customHex";
export const CUSTOM_UI_ACCENT_ID = "custom";

export const UI_ACCENT_OPTIONS = [
  { id: "terracotta", label: "Terracotta", primary: "16 60% 52%" },
  { id: "sage", label: "Sage", primary: "145 30% 44%" },
  { id: "ocean", label: "Ocean", primary: "205 44% 47%" },
  { id: "plum", label: "Plum", primary: "282 34% 52%" },
  { id: "slate", label: "Slate", primary: "220 18% 43%" },
];

const OPTION_BY_ID = Object.fromEntries(
  UI_ACCENT_OPTIONS.map((option) => [option.id, option]),
);

export const DEFAULT_UI_ACCENT_ID = UI_ACCENT_OPTIONS[0].id;

function getRoot() {
  return typeof document !== "undefined" ? document.documentElement : null;
}

export function applyUiAccent(option) {
  const root = getRoot();
  if (!root || !option?.primary) {
    return;
  }
  root.style.setProperty("--primary", option.primary);
}

export function getStoredUiAccentId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === CUSTOM_UI_ACCENT_ID) {
      return raw;
    }
    if (raw && OPTION_BY_ID[raw]) {
      return raw;
    }
  } catch {
    // No-op: keep default.
  }
  return DEFAULT_UI_ACCENT_ID;
}

export function getUiAccentById(id) {
  return OPTION_BY_ID[id] ?? OPTION_BY_ID[DEFAULT_UI_ACCENT_ID];
}

function normalizeHex(hex) {
  const raw = String(hex ?? "").trim();
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(withHash)) {
    return null;
  }
  if (withHash.length === 4) {
    const r = withHash[1];
    const g = withHash[2];
    const b = withHash[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return withHash.toLowerCase();
}

function hexToHslString(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = 60 * (((g - b) / delta) % 6);
        break;
      case g:
        h = 60 * ((b - r) / delta + 2);
        break;
      default:
        h = 60 * ((r - g) / delta + 4);
        break;
    }
  }
  if (h < 0) {
    h += 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function setUiAccentById(id) {
  const accent = getUiAccentById(id);
  applyUiAccent(accent);
  try {
    localStorage.setItem(STORAGE_KEY, accent.id);
  } catch {
    // No-op: app still works without persistence.
  }
  return accent;
}

export function getStoredCustomUiAccentHex() {
  try {
    return normalizeHex(localStorage.getItem(CUSTOM_HEX_STORAGE_KEY)) ?? "#d1764f";
  } catch {
    return "#d1764f";
  }
}

export function setCustomUiAccentHex(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    return null;
  }
  const hsl = hexToHslString(normalized);
  if (!hsl) {
    return null;
  }
  applyUiAccent({ primary: hsl });
  try {
    localStorage.setItem(STORAGE_KEY, CUSTOM_UI_ACCENT_ID);
    localStorage.setItem(CUSTOM_HEX_STORAGE_KEY, normalized);
  } catch {
    // No-op.
  }
  return normalized;
}

export function initUiAccentFromStorage() {
  const id = getStoredUiAccentId();
  if (id === CUSTOM_UI_ACCENT_ID) {
    setCustomUiAccentHex(getStoredCustomUiAccentHex());
    return { id: CUSTOM_UI_ACCENT_ID, label: "Custom" };
  }
  return setUiAccentById(id);
}
