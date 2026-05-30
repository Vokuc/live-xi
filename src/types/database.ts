export type Position = "GK" | "DEF" | "MID" | "FWD";

export type CardType =
  | "base"
  | "live"
  | "hype"
  | "meme"
  | "legendary"
  | "tournament"
  | "fan"
  | "what_if";

export type CardRarity = "common" | "rare" | "epic" | "iconic" | "mythic";

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export interface PlayerRecord {
  id: string;
  api_id: number;
  slug: string | null;
  name: string;
  nation: string;
  club: string;
  position: Position;
  shirt_number: number | null;
  date_of_birth: string | null;
  base_rating: number;
  current_rating: number;
  hype_score: number;
  raw_image_url: string | null;
  stylized_image_url: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CardRecord {
  id: string;
  player_id: string;
  type: CardType;
  rarity: CardRarity;
  title: string | null;
  overall_rating: number;
  hype_score: number;
  image_url: string | null;
  overlay_image_url: string | null;
  is_active: boolean;
  is_shareable: boolean;
  generated_from_match_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MatchRecord {
  id: string;
  api_id: number | null;
  competition_name: string;
  stage: string | null;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  kickoff_at: string;
  status: MatchStatus;
  minute: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlayerMatchStatsRecord {
  id: string;
  player_id: string;
  match_id: string;
  team_name: string;
  started: boolean;
  minutes_played: number;
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  passes_completed: number;
  tackles: number;
  saves: number;
  clean_sheet: boolean;
  yellow_cards: number;
  red_cards: number;
  rating: number;
  performance_score: number;
  created_at: string;
  updated_at: string;
}

export interface SquadRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  formation: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SquadPlayerRecord {
  id: string;
  squad_id: string;
  player_id: string;
  card_id: string | null;
  slot: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProfileRecord {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_club: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerViewRecord {
  id: string;
  player_id: string;
  viewer_id: string | null;
  session_id: string | null;
  viewed_at: string;
}

export interface Player {
  id: string;
  name: string;
  nation: string;
  club: string;
  position: Position;
  base_rating: number;
  hype_score: number;
  image_url: string;
  card_type: CardType;
}

export interface PlayerWithCard extends PlayerRecord {
  active_card: CardRecord | null;
  image_url: string;
  card_type: CardType;
}

export interface PlayerMatchStats {
  id: string;
  player_id: string;
  match_id: string;
  goals: number;
  assists: number;
  minutes_played: number;
  rating: number;
}
