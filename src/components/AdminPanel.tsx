"use client";

import { useState } from "react";

export default function AdminPanel() {
  const [ingesting, setIngesting] = useState(false);

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const res = await fetch('/api/ingest/worldcup', { method: 'POST' });
      const data = await res.json();
      console.log('Ingestion Results:', data);
      alert('Ingestion complete! Check browser console for results.');
      // Refresh the page to see the new players
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to ingest');
    }
    setIngesting(false);
  };

  return (
    <div className="mt-24 p-6 border border-zinc-800 rounded-2xl bg-black/50 backdrop-blur-xl relative z-10 flex flex-col items-center gap-4">
      <h3 className="text-xl font-bold text-zinc-300">Admin Controls</h3>
      <button 
        onClick={handleIngest}
        disabled={ingesting}
        className="px-6 py-3 rounded-full bg-emerald-500 text-black font-black hover:bg-emerald-400 disabled:opacity-50 transition-colors"
      >
        {ingesting ? "Running AI Pipeline..." : "Ingest World Cup Test (Argentina)"}
      </button>
      <p className="text-sm text-zinc-500">Fetches from API-Football, saves to Supabase, and runs Replicate img2img</p>
    </div>
  );
}
