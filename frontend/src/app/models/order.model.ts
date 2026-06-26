import { OrderItem } from "./orderItem.model";

export interface Order {
  id: number;
  total: number;
  created_at: string;
  products?: OrderItem[];
}