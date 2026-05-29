import PlayerCard from "@/components/PlayerCard";
import AdminPanel from "@/components/AdminPanel";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Prevent static rendering so it fetches fresh data
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch real players from the Supabase database
  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .order('hype_score', { ascending: false });

  if (error) {
    console.error("Error fetching players:", error);
  }

  // Map the database rows to match our PlayerCard props expected format
  const formattedPlayers = (players || []).map(p => ({
    ...p,
    // Use stylized image if available, fallback to raw photo
    image_url: p.stylized_image_url || p.raw_image_url
  }));

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-8 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center space-y-6 relative z-10 mt-16 mb-20">
        <h1 className="text-7xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-white to-zinc-400 drop-shadow-2xl">
          LIVE XI
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium">
          The real-time football platform driven by match performance and internet hype.
        </p>
      </div>

      {formattedPlayers.length === 0 ? (
        <div className="text-center text-zinc-500 py-12 relative z-10">
          <p className="text-xl">No players in database yet.</p>
          <p>Run the Ingestion tool below to populate the World Cup test data!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 relative z-10 w-full max-w-7xl px-4 place-items-center">
          {formattedPlayers.map((player) => (
            <Link key={player.id} href={`/player/${player.id}`} className="block transition-transform hover:-translate-y-2">
               <PlayerCard player={player as any} />
            </Link>
          ))}
        </div>
      )}

      <AdminPanel />
    </main>
  );
}
