export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  nation: string; // e.g., 'Argentina'
  club: string; // e.g., 'Inter Miami'
  position: Position;
  base_rating: number; // 0-100
  hype_score: number; // 0-100 (social media impact)
  image_url: string; // Path to player cutout image
  card_type: 'base' | 'live' | 'tournament';
}

export interface PlayerMatchStats {
  id: string;
  player_id: string;
  match_id: string;
  goals: number;
  assists: number;
  minutes_played: number;
  rating: number; // match rating out of 10
}
