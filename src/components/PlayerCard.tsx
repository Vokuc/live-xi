"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Player } from "@/types/database";
import { Zap, Activity, Trophy, Download } from "lucide-react";
import { toPng } from 'html-to-image';

interface PlayerCardProps {
  player: Player;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Determine gradient colors based on card type
  const getCardStyle = () => {
    switch (player.card_type) {
      case "live":
        return "from-emerald-500 via-green-400 to-emerald-600 shadow-emerald-500/20 border-emerald-500/30";
      case "tournament":
        return "from-purple-500 via-pink-500 to-orange-500 shadow-purple-500/20 border-pink-500/30";
      default:
        return "from-zinc-700 via-zinc-600 to-zinc-800 shadow-zinc-500/10 border-zinc-600/30";
    }
  };

  const getIcon = () => {
    switch (player.card_type) {
      case "live":
        return <Activity className="w-4 h-4 text-emerald-300" />;
      case "tournament":
        return <Trophy className="w-4 h-4 text-purple-200" />;
      default:
        return null;
    }
  };

  const handleDownload = useCallback(() => {
    if (cardRef.current === null) {
      return;
    }

    // Convert the DOM node to a high-res PNG image
    toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#000' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${player.name.replace(/\s+/g, '-').toLowerCase()}-live-xi.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Oops, something went wrong!', err);
      });
  }, [player.name]);

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        ref={cardRef}
        whileHover={{ scale: 1.05, rotateY: 5, rotateX: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="perspective-1000 w-full max-w-[320px] bg-zinc-950 rounded-2xl" 
      >
        <div
          className={`relative w-full aspect-[2.5/3.5] rounded-2xl p-1 bg-gradient-to-br ${getCardStyle()} shadow-2xl transition-all duration-300 hover:shadow-3xl`}
        >
          {/* Holographic Inner Layer */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay z-20" />
          
          <div className="relative w-full h-full rounded-xl bg-zinc-950 overflow-hidden flex flex-col justify-between border border-white/10 p-4">
            
            {/* Top Section: Rating & Position */}
            <div className="flex justify-between items-start z-10">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
                  {player.base_rating}
                </span>
                <span className="text-sm font-bold text-white/80 tracking-widest">
                  {player.position}
                </span>
                <div className="mt-1 w-6 h-[2px] bg-white/40 rounded-full" />
                <span className="text-xs mt-1 text-white/60 font-semibold truncate max-w-[50px]">
                  {player.nation.substring(0, 3).toUpperCase()}
                </span>
              </div>
              
              {/* Card Type Badge */}
              <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                {getIcon()}
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                  {player.card_type}
                </span>
              </div>
            </div>

            {/* Player Image (Real Cutout) */}
            <div className="absolute inset-0 top-16 bottom-[70px] z-0 flex items-end justify-center pointer-events-none drop-shadow-2xl">
               <img 
                 src={player.image_url} 
                 alt={player.name} 
                 className="h-full object-contain object-bottom scale-[1.35] translate-y-3 opacity-90 transition-opacity duration-300"
                 crossOrigin="anonymous" 
               />
            </div>

            {/* Bottom Section: Name & Hype */}
            <div className="z-10 bg-gradient-to-t from-black via-black/80 to-transparent -mx-4 -mb-4 p-4 pt-12 flex flex-col items-center">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight text-center drop-shadow-lg">
                {player.name}
              </h2>
              
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent my-3" />
              
              {/* Stats Row */}
              <div className="flex justify-around w-full text-white">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-zinc-400 font-semibold tracking-wider">HYPE</span>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-lg">{player.hype_score}</span>
                  </div>
                </div>
                <div className="w-[1px] bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="text-xs text-zinc-400 font-semibold tracking-wider">CLUB</span>
                  <span className="font-bold text-sm leading-6 truncate max-w-[100px] text-center">{player.club}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Download Button outside the card */}
      <button 
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 mt-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors text-sm font-semibold cursor-pointer z-10"
      >
        <Download className="w-4 h-4" />
        Download Card
      </button>
    </div>
  );
}
