// Shared TypeScript types mirroring the database schema.

export type UserRole = "donor" | "ngo" | "admin";

export type DonationStatus =
  | "pending"
  | "accepted"
  | "pickup_in_progress"
  | "delivered"
  | "expired";

export type DietaryType = "veg" | "non_veg";

export type Urgency = "low" | "medium" | "high";

export type VerificationStatus = "unverified" | "verified" | "rejected";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface NgoProfile {
  user_id: string;
  org_name: string;
  address: string;
  city: string;
  contact_person: string | null;
  service_area: string;
  capacity_kg: number;
  verification_status: VerificationStatus;
  verified_at: string | null;
  created_at: string;
  registration_number: string | null;
}

export interface Donation {
  id: string;
  donor_id: string;
  ngo_id: string | null;
  food_name: string;
  category: string;
  quantity: number;
  quantity_unit: string;
  dietary_type: DietaryType;
  prepared_at: string;
  safe_until: string;
  pickup_address: string;
  city: string;
  pickup_contact: string;
  notes: string | null;
  status: DonationStatus;
  urgency: Urgency;
  accepted_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

// The available_donations view omits pickup_contact and ngo_id.
export interface AvailableDonation {
  id: string;
  donor_id: string;
  food_name: string;
  category: string;
  quantity: number;
  quantity_unit: string;
  dietary_type: DietaryType;
  prepared_at: string;
  safe_until: string;
  pickup_address: string;
  city: string;
  notes: string | null;
  status: "pending";
  urgency: Urgency;
  created_at: string;
}
