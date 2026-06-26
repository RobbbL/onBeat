import { Address } from "./address.model";

export interface UpdateRequest {
  username: string;

  firstName: string;
  lastName: string;
  phone: string;
  email: string;

  shippingAddress: Address;
}
