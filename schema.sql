-- LIVE XI Database Schema (Phase 1)
-- Run this script in your Supabase SQL Editor

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id INT UNIQUE NOT NULL, -- The player ID from API-Football
    name VARCHAR(255) NOT NULL,
    nation VARCHAR(255) NOT NULL,
    club VARCHAR(255) NOT NULL,
    position VARCHAR(10) NOT NULL,
    base_rating INT DEFAULT 80,
    hype_score INT DEFAULT 0,
    raw_image_url TEXT, -- The real photo from the API
    stylized_image_url TEXT, -- Our generated Cyberpunk Anime version
    card_type VARCHAR(50) DEFAULT 'base',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We will add matches and player_match_stats tables later when we build the live match webhook system.
