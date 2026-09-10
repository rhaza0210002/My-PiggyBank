import DashboardPage from "./dashboard/page";

export default function Home() {
  return (
    <>
      <div className="flex items-center justify-center font-sans">
        <main className="flex w-full items-center sm:items-start">
          <DashboardPage />
        </main>
      </div>
    </>
  );
}
