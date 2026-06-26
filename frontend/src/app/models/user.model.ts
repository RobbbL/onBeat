import { Address } from "./address.model";

export interface User {
  id: number;
  username: string;
  email: string;

  profileImage: string;

  firstName: string;
  lastName: string;
  phone: string;

  role: string;

  shippingAddress: Address;
}
