export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">SestaKıbrıs</h1>
      <p className="mt-2 text-gray-600">Phase 0 — Foundation</p>
      <nav className="mt-6 flex flex-col gap-2 text-sm text-blue-600">
        <a href="/auth/login">Login</a>
        <a href="/auth/register">Register</a>
      </nav>
    </main>
  );
}
