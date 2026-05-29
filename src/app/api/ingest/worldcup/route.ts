import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    // 1. Fetch Argentina Squad (Team 26) as MVP test
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    };
    
    const res = await fetch('https://api-football-v1.p.rapidapi.com/v3/players/squads?team=26', options);
    const data = await res.json();
    
    if (!data.response || data.response.length === 0) {
      return NextResponse.json({ error: 'No data from API' }, { status: 500 });
    }

    // Take just 3 players for quick MVP processing so we don't timeout the server
    const players = data.response[0].players.slice(0, 3); 

    const results = [];

    for (const p of players) {
      // 2. Insert into Supabase (Initial Save)
      const { data: dbPlayer, error: dbError } = await supabase
        .from('players')
        .upsert({
          api_id: p.id,
          name: p.name,
          nation: 'Argentina',
          club: 'World Cup Roster', 
          position: p.position ? p.position.substring(0, 3).toUpperCase() : 'MID',
          base_rating: Math.floor(Math.random() * 15) + 80, // Mock rating 80-95
          raw_image_url: p.photo,
        }, { onConflict: 'api_id' })
        .select()
        .single();

      if (dbError) {
        console.error('Supabase Error:', dbError);
        continue; // Skip AI if DB fails
      }

      // 3. AI Stylization via Replicate (Img2Img SDXL)
      console.log(`Stylizing ${p.name}...`);
      let stylizedUrl = null;
      try {
        const output = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          {
            input: {
              image: p.photo,
              prompt: "Portrait of a football player in neon cyberpunk anime comic book style, highly stylized vector art, glowing neon accents, masterpiece, dark background",
              prompt_strength: 0.65, // Retain 35% of original photo structure, apply 65% style
              num_inference_steps: 25
            }
          }
        );
        stylizedUrl = Array.isArray(output) ? output[0] : output;
      } catch (aiError) {
        console.error(`AI generation failed for ${p.name}:`, aiError);
      }

      // 4. Update Supabase with generated image
      if (stylizedUrl) {
         await supabase
           .from('players')
           .update({ stylized_image_url: stylizedUrl })
           .eq('api_id', p.id);
      }

      results.push({
        name: p.name,
        raw: p.photo,
        stylized: stylizedUrl
      });
    }

    return NextResponse.json({ success: true, processed: results });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
