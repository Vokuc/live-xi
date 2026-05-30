-- LIVE XI Database Schema (MVP Foundation)
-- Run this script in your Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'player_position'
    ) THEN
        CREATE TYPE player_position AS ENUM ('GK', 'DEF', 'MID', 'FWD');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'card_type'
    ) THEN
        CREATE TYPE card_type AS ENUM (
            'base',
            'live',
            'hype',
            'meme',
            'legendary',
            'tournament',
            'fan',
            'what_if'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'card_rarity'
    ) THEN
        CREATE TYPE card_rarity AS ENUM (
            'common',
            'rare',
            'epic',
            'iconic',
            'mythic'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'match_status'
    ) THEN
        CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    username VARCHAR(40) UNIQUE,
    display_name VARCHAR(80),
    avatar_url TEXT,
    bio TEXT,
    favorite_club VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_id INT UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    nation VARCHAR(255) NOT NULL,
    club VARCHAR(255) NOT NULL,
    position player_position NOT NULL,
    shirt_number INT,
    date_of_birth DATE,
    base_rating INT NOT NULL DEFAULT 80 CHECK (base_rating BETWEEN 0 AND 100),
    current_rating INT NOT NULL DEFAULT 80 CHECK (current_rating BETWEEN 0 AND 100),
    hype_score INT NOT NULL DEFAULT 0 CHECK (hype_score BETWEEN 0 AND 100),
    raw_image_url TEXT,
    stylized_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_id INT UNIQUE,
    competition_name VARCHAR(255) NOT NULL,
    stage VARCHAR(255),
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    home_score INT NOT NULL DEFAULT 0,
    away_score INT NOT NULL DEFAULT 0,
    kickoff_at TIMESTAMPTZ NOT NULL,
    status match_status NOT NULL DEFAULT 'scheduled',
    minute INT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    started BOOLEAN NOT NULL DEFAULT FALSE,
    minutes_played INT NOT NULL DEFAULT 0,
    goals INT NOT NULL DEFAULT 0,
    assists INT NOT NULL DEFAULT 0,
    shots INT NOT NULL DEFAULT 0,
    shots_on_target INT NOT NULL DEFAULT 0,
    passes_completed INT NOT NULL DEFAULT 0,
    tackles INT NOT NULL DEFAULT 0,
    saves INT NOT NULL DEFAULT 0,
    clean_sheet BOOLEAN NOT NULL DEFAULT FALSE,
    yellow_cards INT NOT NULL DEFAULT 0,
    red_cards INT NOT NULL DEFAULT 0,
    rating NUMERIC(3, 1) NOT NULL DEFAULT 0,
    performance_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (player_id, match_id)
);

CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    type card_type NOT NULL DEFAULT 'base',
    rarity card_rarity NOT NULL DEFAULT 'common',
    title VARCHAR(255),
    overall_rating INT NOT NULL DEFAULT 80 CHECK (overall_rating BETWEEN 0 AND 100),
    hype_score INT NOT NULL DEFAULT 0 CHECK (hype_score BETWEEN 0 AND 100),
    image_url TEXT,
    overlay_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_shareable BOOLEAN NOT NULL DEFAULT TRUE,
    generated_from_match_id UUID REFERENCES matches (id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ,UNIQUE (player_id, type)
);

CREATE TABLE IF NOT EXISTS squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    formation VARCHAR(20),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS squad_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads (id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards (id) ON DELETE SET NULL,
    slot VARCHAR(30),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (squad_id, player_id)
);

CREATE TABLE IF NOT EXISTS player_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_slug ON players (slug);
CREATE INDEX IF NOT EXISTS idx_players_hype_score ON players (hype_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff_at ON matches (kickoff_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player_id ON player_match_stats (player_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_match_id ON player_match_stats (match_id);
CREATE INDEX IF NOT EXISTS idx_cards_player_id ON cards (player_id);
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards (type);
CREATE INDEX IF NOT EXISTS idx_squads_user_id ON squads (user_id);
CREATE INDEX IF NOT EXISTS idx_squad_players_squad_id ON squad_players (squad_id);
CREATE INDEX IF NOT EXISTS idx_player_views_player_id ON player_views (player_id);

COMMENT ON TABLE players IS 'Canonical football player records synced from external data providers.';
COMMENT ON TABLE cards IS 'Shareable collectible card variants derived from a player state and card rules.';
COMMENT ON TABLE matches IS 'Match fixtures and live state used to recalculate cards.';
COMMENT ON TABLE player_match_stats IS 'Per-player stat line for a specific match.';
COMMENT ON TABLE squads IS 'User-created player collections for sharing and comparison.';
