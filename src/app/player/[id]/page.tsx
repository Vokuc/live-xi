import PlayerCard from "@/components/PlayerCard";
import Link from "next/link";
import { ArrowLeft, Activity, TrendingUp, Goal, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { CardRecord, MatchRecord, Player, PlayerMatchStatsRecord, PlayerRecord } from "@/types/database";

export const dynamic = 'force-dynamic';

type MatchStatsRow = PlayerMatchStatsRecord & {
  match: MatchRecord | null;
};

function getMatchStatusLabel(match: MatchRecord | null) {
  if (!match) {
    return "Awaiting first tracked match";
  }

  if (match.status === "live") {
    return match.minute ? `LIVE ${match.minute}'` : "LIVE MATCH ACTIVE";
  }

  if (match.status === "finished") {
    return "Latest match complete";
  }

  return `Next kickoff ${new Date(match.kickoff_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
}

function getMomentumCopy(playerName: string, stats: MatchStatsRow | null, activeCard: CardRecord | null) {
  if (!stats || !stats.match) {
    return `No tracked match stats yet for ${playerName}. Once the ingestion pipeline starts writing match events, this page will show live performance and momentum swings.`;
  }

  const contributions = stats.goals + stats.assists;
  const ratingText = stats.rating > 0 ? `${stats.rating.toFixed(1)} rating` : "early rating";
  const cardLabel = activeCard ? `${activeCard.type} card` : "base card";

  if (contributions > 0) {
    return `${playerName} is coming off ${contributions} direct goal contribution${contributions === 1 ? "" : "s"} in ${stats.match.competition_name}. That ${ratingText} is currently feeding the ${cardLabel} narrative for LIVE XI.`;
  }

  return `${playerName}'s latest tracked appearance in ${stats.match.competition_name} logged ${stats.minutes_played} minutes with a ${ratingText}. The next step is to layer hype and view activity on top of this performance baseline.`;
};

export default async function PlayerPage({ params }: { params: { id: string } }) {
  const { data: dbPlayer, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !dbPlayer) {
    return <div className="p-8 text-white">Player not found</div>;
  }

  const [{ data: activeCard }, { data: latestStats }] = await Promise.all([
    supabase
      .from("cards")
      .select("*")
      .eq("player_id", params.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("player_match_stats")
      .select(`
        *,
        match:matches (*)
      `)
      .eq("player_id", params.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const playerRow = dbPlayer as PlayerRecord;
  const cardRow = (activeCard as CardRecord | null) ?? null;
  const statsRow = (latestStats as MatchStatsRow | null) ?? null;
  const player: Player = {
    id: playerRow.id,
    name: playerRow.name,
    nation: playerRow.nation,
    club: playerRow.club,
    position: playerRow.position,
    base_rating: cardRow?.overall_rating || playerRow.current_rating || playerRow.base_rating,
    hype_score: cardRow?.hype_score ?? playerRow.hype_score,
    image_url: cardRow?.image_url || playerRow.stylized_image_url || playerRow.raw_image_url || "/players/mbappe.png",
    card_type: cardRow?.type || "base",
  };

  const matchStatusLabel = getMatchStatusLabel(statsRow?.match || null);
  const latestMatchLabel = statsRow?.match
    ? `${statsRow.match.home_team} ${statsRow.match.home_score} - ${statsRow.match.away_score} ${statsRow.match.away_team}`
    : "No match line yet";
  const ratingValue = statsRow?.rating ? statsRow.rating.toFixed(1) : "--";
  const goalsValue = statsRow?.goals ?? 0;
  const assistsValue = statsRow?.assists ?? 0;
  const momentumCopy = getMomentumCopy(player.name, statsRow, cardRow);
  const performanceLabel = statsRow?.performance_score
    ? `${statsRow.performance_score} performance score`
    : "Performance score populates after match ingestion";

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto mt-8">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-12 w-fit">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Hub</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Card Showcase */}
          <div className="w-full lg:w-1/3 flex justify-center lg:justify-start">
            <PlayerCard player={player} />
          </div>

          {/* Stats & Hype Dashboard */}
          <div className="w-full lg:w-2/3 space-y-12 z-10 relative">
            <div>
              <h1 className="text-6xl font-black uppercase tracking-tighter drop-shadow-xl">{player.name}</h1>
              <div className="flex items-center gap-4 mt-4 text-xl text-zinc-400">
                <span className="font-bold text-white">{player.club}</span>
                <span>•</span>
                <span>{player.nation}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{matchStatusLabel}</span>
              </div>
              <p className="mt-4 text-sm uppercase tracking-[0.3em] text-zinc-500">{latestMatchLabel}</p>
            </div>

            {/* Live Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
                <Target className="w-6 h-6 text-yellow-400" />
                <span className="text-3xl font-black">{ratingValue}</span>
                <span className="text-sm font-semibold text-zinc-500 tracking-wider">MATCH RATING</span>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                <Goal className="w-6 h-6 text-emerald-400" />
                <span className="text-3xl font-black">{goalsValue}</span>
                <span className="text-sm font-semibold text-zinc-500 tracking-wider">GOALS</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                <Activity className="w-6 h-6 text-blue-400" />
                <span className="text-3xl font-black">{assistsValue}</span>
                <span className="text-sm font-semibold text-zinc-500 tracking-wider">ASSISTS</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-pink-500" />
                <TrendingUp className="w-6 h-6 text-pink-400" />
                <span className="text-3xl font-black">{player.hype_score}</span>
                <span className="text-sm font-semibold text-zinc-500 tracking-wider">HYPE VELOCITY</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-emerald-400" />
                Hype Momentum
              </h3>
              <p className="text-zinc-400">
                {momentumCopy}
              </p>
              <div className="w-full h-32 mt-6 rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-2 border border-zinc-800 text-center px-4">
                 <span className="text-zinc-400 font-semibold uppercase tracking-[0.25em]">{player.card_type} card active</span>
                 <span className="text-zinc-600 font-semibold">{performanceLabel}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
