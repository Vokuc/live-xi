import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

type ApiFootballPlayer = {
  id: number;
  name: string;
  photo: string;
  position: string | null;
};

type ApiFootballSquadResponse = {
  response?: Array<{
    players: ApiFootballPlayer[];
  }>;
};

type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    name: string;
    round: string | null;
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    away: {
      id: number;
      name: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type ApiFootballFixturesResponse = {
  response?: ApiFootballFixture[];
};

type ApiFootballFixturePlayer = {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: Array<{
    games: {
      minutes: number | null;
      position: string | null;
      rating: string | null;
      substitute: boolean | null;
    };
    shots: {
      total: number | null;
      on: number | null;
    };
    goals: {
      total: number | null;
      assists: number | null;
      saves: number | null;
      conceded: number | null;
    };
    passes: {
      total: number | null;
    };
    tackles: {
      total: number | null;
    };
    cards: {
      yellow: number | null;
      red: number | null;
    };
  }>;
};

type ApiFootballFixturePlayersResponse = {
  response?: Array<{
    team: {
      id: number;
      name: string;
    };
    players: ApiFootballFixturePlayer[];
  }>;
};

type PlayerUpsertRow = {
  id: string;
  base_rating: number;
  hype_score: number;
  stylized_image_url: string | null;
};

type MatchUpsertRow = {
  id: string;
};

function shouldDisableStylization(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeApiError = error as { response?: { status?: number } };
  const status = maybeApiError.response?.status;

  return status === 402 || status === 429;
}

function normalizePosition(position: string | null) {
  const normalized = position?.trim().toLowerCase();

  if (!normalized) {
    return 'MID';
  }

  if (normalized.startsWith('goal')) {
    return 'GK';
  }

  if (normalized === 'g') {
    return 'GK';
  }

  if (normalized.startsWith('def')) {
    return 'DEF';
  }

  if (normalized === 'd') {
    return 'DEF';
  }

  if (normalized.startsWith('mid')) {
    return 'MID';
  }

  if (normalized === 'm') {
    return 'MID';
  }

  if (normalized.startsWith('att') || normalized.startsWith('for') || normalized.startsWith('str') || normalized.startsWith('wing')) {
    return 'FWD';
  }

  if (normalized === 'f') {
    return 'FWD';
  }

  return 'MID';
}

function mapMatchStatus(status: string) {
  if (["1H", "HT", "2H", "ET", "P", "LIVE", "BT"].includes(status)) {
    return 'live';
  }

  if (["FT", "AET", "PEN"].includes(status)) {
    return 'finished';
  }

  if (["PST", "CANC", "ABD", "AWD", "WO"].includes(status)) {
    return 'postponed';
  }

  return 'scheduled';
}

function parseRating(rating: string | null) {
  const parsed = rating ? Number.parseFloat(rating) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : 0;
}

function getStableBaseRating(apiId: number) {
  return 80 + (apiId % 16);
}

function clampRating(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getPerformanceScore(playerStats: ApiFootballFixturePlayer["statistics"][number]) {
  const rating = parseRating(playerStats.games.rating);
  const goals = playerStats.goals.total ?? 0;
  const assists = playerStats.goals.assists ?? 0;
  const shotsOnTarget = playerStats.shots.on ?? 0;
  const tackles = playerStats.tackles.total ?? 0;
  const saves = playerStats.goals.saves ?? 0;
  const cleanSheetBonus = playerStats.goals.conceded === 0 && normalizePosition(playerStats.games.position) === 'GK' ? 8 : 0;

  return Math.round(
    rating * 8 +
      goals * 12 +
      assists * 8 +
      shotsOnTarget * 2 +
      tackles * 1.5 +
      saves * 2 +
      cleanSheetBonus
  );
}

function getCurrentRating(baseRating: number, rating: number, performanceScore: number) {
  const ratingDelta = rating > 0 ? Math.round((rating - 6.5) * 6) : 0;
  const performanceDelta = Math.round(performanceScore / 12);

  return clampRating(baseRating + ratingDelta + performanceDelta);
}

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch Argentina Squad (Team 26) as MVP test
    const options = {
      method: 'GET',
      headers: {
        'x-apisports-key': process.env.RAPIDAPI_KEY!,
      }
    };
    
    const [squadResponse, fixturesResponse] = await Promise.all([
      fetch('https://v3.football.api-sports.io/players/squads?team=26', options),
      fetch('https://v3.football.api-sports.io/fixtures?team=26&season=2022', options),
    ]);

    const data = (await squadResponse.json()) as ApiFootballSquadResponse;
    const fixturesData = (await fixturesResponse.json()) as ApiFootballFixturesResponse;
    
    if (!data.response || data.response.length === 0) {
      return NextResponse.json({ error: 'No data from API' }, { status: 500 });
    }

    const latestFixture = [...(fixturesData.response || [])].sort(
      (left, right) => right.fixture.timestamp - left.fixture.timestamp
    )[0];

    if (!latestFixture) {
      return NextResponse.json({ error: 'No fixtures found for team 26' }, { status: 500 });
    }

    const fixturePlayersResponse = await fetch(
      `https://v3.football.api-sports.io/fixtures/players?fixture=${latestFixture.fixture.id}`,
      options
    );
    const fixturePlayersData = (await fixturePlayersResponse.json()) as ApiFootballFixturePlayersResponse;
    const argentinaStats = fixturePlayersData.response?.find((team) => team.team.id === 26);

    if (!argentinaStats || argentinaStats.players.length === 0) {
      return NextResponse.json({ error: 'No player stats found for latest Argentina fixture' }, { status: 500 });
    }

    const { data: dbMatch, error: dbMatchError } = await supabaseAdmin
      .from('matches')
      .upsert(
        {
          api_id: latestFixture.fixture.id,
          competition_name: latestFixture.league.name,
          stage: latestFixture.league.round,
          home_team: latestFixture.teams.home.name,
          away_team: latestFixture.teams.away.name,
          home_score: latestFixture.goals.home ?? 0,
          away_score: latestFixture.goals.away ?? 0,
          kickoff_at: latestFixture.fixture.date,
          status: mapMatchStatus(latestFixture.fixture.status.short),
          minute: latestFixture.fixture.status.elapsed,
          metadata: {
            source: 'api-football',
            home_team_id: latestFixture.teams.home.id,
            away_team_id: latestFixture.teams.away.id,
            fixture_status: latestFixture.fixture.status.short,
          },
        },
        { onConflict: 'api_id' }
      )
      .select('id')
      .single();

    if (dbMatchError || !dbMatch) {
      console.error('Supabase Match Error:', dbMatchError);
      return NextResponse.json({ error: 'Failed to persist latest fixture' }, { status: 500 });
    }

    const matchRow = dbMatch as MatchUpsertRow;

    const squadByApiId = new Map(data.response[0].players.map((player) => [player.id, player]));

    // Take just 3 players from the latest tracked fixture so the seeded players have live stats.
    const players = argentinaStats.players.slice(0, 3); 

    const results = [];

    let canAttemptStylization = true;

    for (const fixturePlayer of players) {
      const player = squadByApiId.get(fixturePlayer.player.id) ?? {
        id: fixturePlayer.player.id,
        name: fixturePlayer.player.name,
        photo: fixturePlayer.player.photo,
        position: fixturePlayer.statistics[0]?.games.position ?? null,
      };
      const playerStats = fixturePlayer.statistics[0];

      if (!playerStats) {
        continue;
      }

      const baseRating = getStableBaseRating(player.id);
      const performanceScore = getPerformanceScore(playerStats);
      const liveRating = getCurrentRating(baseRating, parseRating(playerStats.games.rating), performanceScore);

      // 2. Insert into Supabase (Initial Save)
      const { data: dbPlayer, error: dbError } = await supabaseAdmin
        .from('players')
        .upsert({
          api_id: player.id,
          name: player.name,
          nation: 'Argentina',
          club: 'Argentina National Team', 
          position: normalizePosition(player.position),
          base_rating: baseRating,
          current_rating: liveRating,
          hype_score: Math.max(performanceScore, 0),
          raw_image_url: player.photo,
        }, { onConflict: 'api_id' })
        .select()
        .single();

      if (dbError) {
        console.error('Supabase Error:', dbError);
        continue; // Skip AI if DB fails
      }

      const playerRow = dbPlayer as PlayerUpsertRow;

      await supabaseAdmin
        .from('player_match_stats')
        .upsert(
          {
            player_id: playerRow.id,
            match_id: matchRow.id,
            team_name: argentinaStats.team.name,
            started: !playerStats.games.substitute,
            minutes_played: playerStats.games.minutes ?? 0,
            goals: playerStats.goals.total ?? 0,
            assists: playerStats.goals.assists ?? 0,
            shots: playerStats.shots.total ?? 0,
            shots_on_target: playerStats.shots.on ?? 0,
            passes_completed: playerStats.passes.total ?? 0,
            tackles: playerStats.tackles.total ?? 0,
            saves: playerStats.goals.saves ?? 0,
            clean_sheet: (playerStats.goals.conceded ?? 0) === 0,
            yellow_cards: playerStats.cards.yellow ?? 0,
            red_cards: playerStats.cards.red ?? 0,
            rating: parseRating(playerStats.games.rating),
            performance_score: performanceScore,
          },
          { onConflict: 'player_id,match_id' }
        );

      // 3. AI Stylization via Replicate (Img2Img SDXL)
      let stylizedUrl = null;
      let stylizationAttempted = false;
      if (canAttemptStylization) {
        stylizationAttempted = true;
        console.log(`Stylizing ${player.name}...`);
        try {
          const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
              input: {
                image: player.photo,
                prompt: "Portrait of a football player in neon cyberpunk anime comic book style, highly stylized vector art, glowing neon accents, masterpiece, dark background",
                prompt_strength: 0.65, // Retain 35% of original photo structure, apply 65% style
                num_inference_steps: 25
              }
            }
          );
          stylizedUrl = Array.isArray(output) ? output[0] : output;
        } catch (aiError) {
          console.error(`AI generation failed for ${player.name}:`, aiError);

          if (shouldDisableStylization(aiError)) {
            canAttemptStylization = false;
            console.warn('Disabling further stylization attempts for this run due to Replicate billing or rate limits.');
          }
        }
      }

      // 4. Update Supabase with generated image
      if (stylizedUrl) {
         await supabaseAdmin
           .from('players')
           .update({ stylized_image_url: stylizedUrl })
           .eq('api_id', player.id);
      }

      const cardImageUrl = stylizedUrl || playerRow.stylized_image_url || player.photo;

      await supabaseAdmin
        .from('cards')
        .upsert(
          {
            player_id: playerRow.id,
            type: 'tournament',
            rarity: 'rare',
            title: `${player.name} World Cup Edition`,
            overall_rating: liveRating,
            hype_score: performanceScore,
            image_url: cardImageUrl,
            generated_from_match_id: matchRow.id,
            metadata: {
              source: 'api-football',
              team: 'Argentina',
              fixture_id: latestFixture.fixture.id,
              performance_score: performanceScore,
            },
          },
          { onConflict: 'player_id,type' }
        );

      results.push({
        name: player.name,
        fixtureId: latestFixture.fixture.id,
        raw: player.photo,
        stylized: stylizedUrl,
        stylizationAttempted,
        stats: {
          minutes: playerStats.games.minutes ?? 0,
          goals: playerStats.goals.total ?? 0,
          assists: playerStats.goals.assists ?? 0,
          rating: parseRating(playerStats.games.rating),
          performanceScore,
        }
      });
    }

    return NextResponse.json({ success: true, processed: results });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
