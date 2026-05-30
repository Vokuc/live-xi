import PlayerCard from "@/components/PlayerCard";
import AdminPanel from "@/components/AdminPanel";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { mapPlayersForDisplay } from "@/lib/player-display";
import type { CardRecord, Player, PlayerRecord } from "@/types/database";
import { Flame } from "lucide-react";

// Prevent static rendering so it fetches fresh data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .order("hype_score", { ascending: false });

  if (error) {
    console.error("Error fetching players:", error);
  }

  const playerRows = (players || []) as PlayerRecord[];
  const playerIds = playerRows.map((player) => player.id);

  const { data: cards, error: cardsError } = playerIds.length
    ? await supabase
        .from("cards")
        .select("*")
        .in("player_id", playerIds)
        .eq("is_active", true)
    : { data: [], error: null };

  if (cardsError) {
    console.error("Error fetching active cards:", cardsError);
  }

  const formattedPlayers: Player[] = mapPlayersForDisplay(playerRows, (cards || []) as CardRecord[]);

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
        <div className="flex justify-center">
          <Link
            href="/trending"
            className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-orange-100 transition-colors hover:bg-orange-500/20"
          >
            <Flame className="w-4 h-4" />
            Trending Players
          </Link>
        </div>
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
               <PlayerCard player={player} />
            </Link>
          ))}
        </div>
      )}

      <AdminPanel />
    </main>
  );
}
