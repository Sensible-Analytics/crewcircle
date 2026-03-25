import RosterGrid from '@/features/roster/RosterGrid';

export default function RosterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Weekly Roster</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <RosterGrid />
      </main>
    </div>
  );
}