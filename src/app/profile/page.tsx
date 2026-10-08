import LogoutButton from '@/components/features/header/LogoutButton';

export default function ProfilePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-[#e5c4b4] bg-[#fff8f2] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c86445]">Profil</p>
        <h1 className="mt-2 text-2xl font-bold text-[#5a4d41]">Ton espace personnel est prêt.</h1>
      </div>

      <section
        aria-labelledby="session-title"
        className="rounded-[2rem] border border-[#e5c4b4] bg-[#fff8f2] p-6 shadow-sm"
      >
        <h2 id="session-title" className="text-lg font-bold text-[#5a4d41]">Session</h2>
        <p className="mt-1 text-sm text-[#8c7a6b]">
          Termine ta session sur cet appareil. Tu devras te reconnecter pour accéder à tes budgets.
        </p>
        <LogoutButton className="mt-4" />
      </section>
    </main>
  );
}
