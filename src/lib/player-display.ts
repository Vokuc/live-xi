import type { CardRecord, Player, PlayerRecord } from "@/types/database";

const cardPriority: Record<CardRecord["type"], number> = {
  legendary: 7,
  hype: 6,
  live: 5,
  tournament: 4,
  meme: 3,
  what_if: 2,
  fan: 1,
  base: 0,
};

function pickDisplayCard(cards: CardRecord[]) {
  return [...cards].sort((left, right) => {
    const priorityDelta = cardPriority[right.type] - cardPriority[left.type];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  })[0] ?? null;
}

export function mapPlayersForDisplay(players: PlayerRecord[], cards: CardRecord[]) {
  const cardsByPlayerId = new Map<string, CardRecord[]>();

  for (const card of cards) {
    const existingCards = cardsByPlayerId.get(card.player_id) ?? [];
    existingCards.push(card);
    cardsByPlayerId.set(card.player_id, existingCards);
  }

  return players.map((player) => {
    const activeCard = pickDisplayCard(cardsByPlayerId.get(player.id) ?? []);

    return {
      id: player.id,
      name: player.name,
      nation: player.nation,
      club: player.club,
      position: player.position,
      base_rating: activeCard?.overall_rating ?? player.current_rating ?? player.base_rating,
      hype_score: activeCard?.hype_score ?? player.hype_score,
      image_url:
        activeCard?.image_url ||
        player.stylized_image_url ||
        player.raw_image_url ||
        "/players/mbappe.png",
      card_type: activeCard?.type ?? "base",
    } satisfies Player;
  });
}