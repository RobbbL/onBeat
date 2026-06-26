export interface Ticket {
  id: number;
  id_artista: number;
  type: string;
  event_name: string;
  place: string;
  date: string;
  price: number;
  artist_name?: string;
}