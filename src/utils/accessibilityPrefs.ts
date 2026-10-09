/** Réglages d'accessibilité choisis par la personne : gardés sur l'appareil, sans compte. */
export interface AccessibilityPrefs {
  /** Police Luciole à la place de Nunito. */
  police: boolean;
  /** Texte plus grand. */
  grand: boolean;
  /** Contraste renforcé. */
  contraste: boolean;
  /** Moins d'animations. */
  calme: boolean;
  /** Lettres, mots et lignes plus espacés. */
  espace: boolean;
}

export type AccessibilityKey = keyof AccessibilityPrefs;

export const STORAGE_KEY = 'piggy-accessibilite';

export const DEFAULT_PREFS: AccessibilityPrefs = { police: false, grand: false, contraste: false, calme: false, espace: false };

/** Attribut posé sur <html> quand l'option est active : le CSS (globals.css) fait le reste. */
export const ACCESSIBILITY_ATTRIBUTES: Record<AccessibilityKey, { name: string; value: string }> = {
  police: { name: 'data-police', value: 'luciole' },
  grand: { name: 'data-taille', value: 'grand' },
  contraste: { name: 'data-contraste', value: 'fort' },
  calme: { name: 'data-calme', value: 'oui' },
  espace: { name: 'data-espace', value: 'large' },
};

const KEYS = Object.keys(DEFAULT_PREFS) as AccessibilityKey[];

export function parsePrefs(raw: string | null): AccessibilityPrefs {
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return { ...DEFAULT_PREFS };
    const record = data as Record<string, unknown>;
    return Object.fromEntries(KEYS.map((key) => [key, record[key] === true])) as unknown as AccessibilityPrefs;
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
}

/** Script lu avant l'affichage : évite que la page change de police ou de taille une fois chargée. */
export function noFlashScript(): string {
  const table = JSON.stringify(ACCESSIBILITY_ATTRIBUTES);
  return `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||'{}'),t=${table},r=document.documentElement;for(var k in t){if(p[k]===true)r.setAttribute(t[k].name,t[k].value)}}catch(e){}`;
}
