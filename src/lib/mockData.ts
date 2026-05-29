import { Player } from '@/types/database';

export const mockPlayers: Player[] = [
  {
    id: 'p_1',
    name: 'Lionel Messi',
    nation: 'Argentina',
    club: 'Inter Miami',
    position: 'FWD',
    base_rating: 93,
    hype_score: 98,
    image_url: '/players/mbappe.png', // Generated Cyberpunk Anime style
    card_type: 'tournament',
  },
  {
    id: 'p_2',
    name: 'Kylian Mbappé',
    nation: 'France',
    club: 'Real Madrid',
    position: 'FWD',
    base_rating: 92,
    hype_score: 95,
    image_url: '/players/mbappe.png', // Generated Cyberpunk Anime style
    card_type: 'live',
  },
  {
    id: 'p_3',
    name: 'Jude Bellingham',
    nation: 'England',
    club: 'Real Madrid',
    position: 'MID',
    base_rating: 90,
    hype_score: 99, 
    image_url: '/players/bellingham.png', // Generated Cyberpunk Anime style
    card_type: 'base',
  },
  {
    id: 'p_4',
    name: 'Erling Haaland',
    nation: 'Norway',
    club: 'Manchester City',
    position: 'FWD',
    base_rating: 91,
    hype_score: 94,
    image_url: '/players/bellingham.png', // Generated Cyberpunk Anime style
    card_type: 'live',
  }
];
