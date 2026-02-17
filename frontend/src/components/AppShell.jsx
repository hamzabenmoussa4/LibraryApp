export default function AppShell({ children }) {
  return (
    <main className="min-h-screen bg-slate-50">
    <div className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </div>
    </main>
  );
}
