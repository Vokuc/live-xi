import Link from "next/link";
import { Flame, ArrowLeft } from "lucide-react";

import PlayerCard from "@/components/PlayerCard";
import { mapPlayersForDisplay } from "@/lib/player-display";
import { supabase } from "@/lib/supabase";
import type { CardRecord, Player, PlayerRecord } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .order("hype_score", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Error fetching trending players:", error);
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
    console.error("Error fetching trending cards:", cardsError);
  }

  const formattedPlayers: Player[] = mapPlayersForDisplay(playerRows, (cards || []) as CardRecord[]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[10%] w-[35%] h-[35%] bg-orange-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[0%] w-[40%] h-[40%] bg-rose-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 mt-8 space-y-10">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Hub</span>
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-200 text-sm font-semibold uppercase tracking-[0.2em]">
              <Flame className="w-4 h-4" />
              Trending Now
            </div>
            <div>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Players Driving The Debate</h1>
              <p className="text-zinc-400 text-lg max-w-2xl mt-4">
                MVP ranking currently uses hype score from the player feed. Next phase will blend match updates, views, and squad usage into this surface.
              </p>
            </div>
          </div>
          <div className="text-sm text-zinc-500 max-w-sm">
            Updated from the live player table. This is the first retention loop surface for LIVE XI.
          </div>
        </div>

        {formattedPlayers.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-10 text-center text-zinc-400">
            No trending players yet. Run the ingestion flow from the home page to seed the leaderboard.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 place-items-center">
            {formattedPlayers.map((player, index) => (
              <div key={player.id} className="space-y-3">
                <div className="flex items-center justify-between px-2 text-xs uppercase tracking-[0.3em] text-zinc-500 font-semibold">
                  <span>Rank {(index + 1).toString().padStart(2, "0")}</span>
                  <span>{player.hype_score} hype</span>
                </div>
                <Link href={`/player/${player.id}`} className="block transition-transform hover:-translate-y-2">
                  <PlayerCard player={player} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}