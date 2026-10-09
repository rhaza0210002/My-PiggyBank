import Pig from '@/components/ui/Pig';

interface RegisterWelcomeProps {
  email: string;
  onEnter: () => void;
  /** Supprime le compte tout juste créé et ramène à l'inscription. */
  onWrongEmail: () => void;
  isBusy?: boolean;
  error?: string | null;
}

/**
 * Juste après l'inscription : l'adresse est rappelée en clair. Sans confirmation par e-mail, une faute de frappe
 * empêcherait plus tard de récupérer le mot de passe ; on la repère et on la corrige ici.
 */
export default function RegisterWelcome({ email, onEnter, onWrongEmail, isBusy = false, error = null }: RegisterWelcomeProps) {
  return (
    <div className="w-full max-w-[440px] space-y-4 rounded-carte border-2 border-texte bg-surface p-6 text-center shadow-sticker">
      <Pig mood="content" className="mx-auto size-16" />
      <div role="status" className="space-y-2">
        <h1 className="text-[1.6rem] font-black tracking-[-0.05em] text-texte">Bienvenue !</h1>
        <p className="text-texte">
          Ton compte est créé avec l’adresse <strong>{email}</strong>.
        </p>
        <p className="text-sm text-texte-doux">Elle te servira si tu oublies ton mot de passe : vérifie qu’elle est juste.</p>
      </div>
      {error && (
        <p role="alert" className="text-sm font-bold text-depasse">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onEnter}
        disabled={isBusy}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-bonbon border-2 border-texte bg-corail px-6 font-titre text-lg font-extrabold text-sur-corail shadow-bonbon transition-transform hover:translate-y-[2px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 motion-reduce:transition-none"
      >
        Entrer dans ma tirelire
      </button>
      <button
        type="button"
        onClick={onWrongEmail}
        disabled={isBusy}
        className="min-h-11 text-sm font-black text-accent-fort underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
      >
        Ce n’est pas la bonne adresse ?
      </button>
    </div>
  );
}
