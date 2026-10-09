/** Réglages d'accessibilité choisis par la personne : gardés sur l'appareil, sans compte. */
export interface AccessibilityPrefs {
  /** Police Luciole à la place de Nunito. */
  police: boolean;
  /** Contraste renforcé. */
  contraste: boolean;
  /** Moins d'animations. */
  calme: boolean;
  /** Lettres, mots et lignes plus espacés. */
  espace: boolean;
  /** Zoom du texte en pourcents (100 = réglage du navigateur), par pas de ZOOM_STEP. */
  zoom: number;
}

export const ZOOM_MIN = 100;
export const ZOOM_MAX = 150;
export const ZOOM_STEP = 10;

/** Options à deux états ; le zoom a son propre réglage. */
export type AccessibilityToggleKey = Exclude<keyof AccessibilityPrefs, 'zoom'>;

export const clampZoom = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
const isZoomStep = (value: unknown): value is number =>
  typeof value === 'number' && value >= ZOOM_MIN && value <= ZOOM_MAX && (value - ZOOM_MIN) % ZOOM_STEP === 0;

export const STORAGE_KEY = 'piggy-accessibilite';

export const DEFAULT_PREFS: AccessibilityPrefs = { police: false, contraste: false, calme: false, espace: false, zoom: ZOOM_MIN };

/** Attribut posé sur <html> quand l'option est active : le CSS (globals.css) fait le reste. */
export const ACCESSIBILITY_ATTRIBUTES: Record<AccessibilityToggleKey, { name: string; value: string }> = {
  police: { name: 'data-police', value: 'luciole' },
  contraste: { name: 'data-contraste', value: 'fort' },
  calme: { name: 'data-calme', value: 'oui' },
  espace: { name: 'data-espace', value: 'large' },
};

export const ZOOM_ATTRIBUTE = 'data-zoom';

const KEYS = Object.keys(ACCESSIBILITY_ATTRIBUTES) as AccessibilityToggleKey[];

export function parsePrefs(raw: string | null): AccessibilityPrefs {
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return { ...DEFAULT_PREFS };
    const record = data as Record<string, unknown>;
    const toggles = Object.fromEntries(KEYS.map((key) => [key, record[key] === true])) as Record<AccessibilityToggleKey, boolean>;
    return { ...toggles, zoom: isZoomStep(record.zoom) ? record.zoom : ZOOM_MIN };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

interface AttributeTarget {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export function applyPrefs(root: AttributeTarget, prefs: AccessibilityPrefs): void {
  KEYS.forEach((key) => {
    const { name, value } = ACCESSIBILITY_ATTRIBUTES[key];
    if (prefs[key]) root.setAttribute(name, value);
    else root.removeAttribute(name);
  });
  if (prefs.zoom > ZOOM_MIN) root.setAttribute(ZOOM_ATTRIBUTE, String(prefs.zoom));
  else root.removeAttribute(ZOOM_ATTRIBUTE);
}

/** Script lu avant l'affichage : évite que la page change de police ou de taille une fois chargée. */
export function noFlashScript(): string {
  const table = JSON.stringify(ACCESSIBILITY_ATTRIBUTES);
  return `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||'{}'),t=${table},r=document.documentElement;for(var k in t){if(p[k]===true)r.setAttribute(t[k].name,t[k].value)}if(p.zoom>${ZOOM_MIN}&&p.zoom<=${ZOOM_MAX}&&p.zoom%${ZOOM_STEP}===0)r.setAttribute(${JSON.stringify(ZOOM_ATTRIBUTE)},String(p.zoom))}catch(e){}`;
}
