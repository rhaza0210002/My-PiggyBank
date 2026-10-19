import { IMPORT_FORMATS_KEY } from '@/services/importFormatMemory';
import { DEMO_STORAGE_KEY } from '@/services/demoStore';
import { STORAGE_KEY as ACCESSIBILITY_KEY } from '@/utils/accessibilityPrefs';
import { TESTER_NAME_KEY } from '@/utils/testFeedback';

export interface DeviceStorageEntry {
  name: string;
  kind: 'Cookie' | 'Stockage local';
  role: string;
  duration: string;
  /** Uniquement de l'essentiel : rien de publicitaire ni de mesure d'audience, rien qui parte chez un tiers. */
  category: 'Strictement nécessaire' | 'Demandé par toi';
}

/**
 * Tout ce que My PiggyBank peut garder sur l'appareil. La page Cookies est affichée à partir de cette liste,
 * et un test vérifie qu'aucune clé de stockage n'est ajoutée au code sans y figurer.
 */
export const DEVICE_STORAGE: DeviceStorageEntry[] = [
  {
    name: 'sb-…-auth-token',
    kind: 'Cookie',
    role: 'Session : te garde connecté de façon sécurisée. Peut être découpé en plusieurs morceaux (.0, .1…) s’il est long.',
    duration: 'Jusqu’à ta déconnexion, ou 24 h sans utiliser l’app',
    category: 'Strictement nécessaire',
  },
  {
    name: 'sb-…-auth-token-code-verifier',
    kind: 'Cookie',
    role: 'Sécurise le lien reçu par e-mail (mot de passe oublié, confirmation d’adresse)',
    duration: 'Le temps d’ouvrir le lien',
    category: 'Strictement nécessaire',
  },
  {
    name: ACCESSIBILITY_KEY,
    kind: 'Stockage local',
    role: 'Tes réglages d’accessibilité (police, contraste, taille du texte…)',
    duration: 'Jusqu’à ce que tu les remettes à zéro',
    category: 'Demandé par toi',
  },
  {
    name: DEMO_STORAGE_KEY,
    kind: 'Stockage local',
    role: 'Les opérations fictives du mode exemple',
    duration: 'Jusqu’à la sortie du mode exemple ou la déconnexion',
    category: 'Demandé par toi',
  },
  {
    name: IMPORT_FORMATS_KEY,
    kind: 'Stockage local',
    role: 'La forme de tes relevés (quelle colonne est la date, le montant…), sans aucune opération ni montant',
    duration: 'Les 5 derniers formats utilisés',
    category: 'Demandé par toi',
  },
  {
    name: TESTER_NAME_KEY,
    kind: 'Stockage local',
    role: 'Séances de test entre amis seulement : le prénom laissé dans « Signaler un souci »',
    duration: 'Jusqu’à ce que tu l’effaces',
    category: 'Demandé par toi',
  },
];
