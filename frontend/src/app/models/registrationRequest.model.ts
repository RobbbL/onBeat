import { Address } from "./address.model";

export interface registrationRequest {
  username: string;
  email: string;
  profileImage: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  shippingAddress: Address
}