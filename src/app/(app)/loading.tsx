/** Affiché dès qu'on change de page, pendant le chargement : l'écran réagit tout de suite. */
export default function AppLoading() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col px-3 py-2 sm:px-5" role="status" aria-live="polite">
      <span className="sr-only">Chargement de la page…</span>
      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-[1.6rem] border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-4 sm:rounded-[2rem]" aria-hidden="true">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-[#e5c4b4]/70 motion-reduce:animate-none" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-3xl bg-[#fff8f2] motion-reduce:animate-none" />
          <div className="h-32 animate-pulse rounded-3xl bg-[#fff8f2] motion-reduce:animate-none" />
          <div className="h-32 animate-pulse rounded-3xl bg-[#fff8f2] motion-reduce:animate-none" />
        </div>
        <div className="min-h-0 flex-1 animate-pulse rounded-3xl bg-[#fff8f2] motion-reduce:animate-none" />
      </div>
    </div>
  );
}
