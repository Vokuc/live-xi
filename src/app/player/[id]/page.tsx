import PlayerCard from "@/components/PlayerCard";
import Link from "next/link";
import { ArrowLeft, Activity, TrendingUp, Goal, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }: { params: { id: string } }) {
  const { data: dbPlayer, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !dbPlayer) {
    return <div className="p-8 text-white">Player not found</div>;
  }

  const player = {
    ...dbPlayer,
    image_url: dbPlayer.stylized_image_url || dbPlayer.raw_image_url
  };

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
            <PlayerCard player={player as any} />
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
                <span className="text-emerald-400 font-bold">LIVE MATCH ACTIVE</span>
              </div>
            </div>

            {/* Live Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
                <Target className="w-6 h-6 text-yellow-400" />
                <span className="text-3xl font-black">9.2</span>
                <span className="text-sm font-semibold text-zinc-500 tracking-wider">MATCH RATING</span>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                <Goal className="w-6 h-6 text-emerald-400" />
                <span className="text-3xl font-black">2</span>
                <span className="text-sm font-semibold text-zinc-500 tracking-wider">GOALS (LIVE)</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                <Activity className="w-6 h-6 text-blue-400" />
                <span className="text-3xl font-black">1</span>
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
                Social media mentions for {player.name} have spiked by 430% in the last 20 minutes following the second goal. Card rarity boost is imminent if momentum holds.
              </p>
              <div className="w-full h-32 mt-6 rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-800">
                 <span className="text-zinc-600 font-semibold">[ Real-time Chart Coming Phase 2 ]</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
