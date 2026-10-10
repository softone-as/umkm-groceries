export type StaffRole = 'admin' | 'staff';

export interface StaffUser {
  readonly id: string;
  readonly username: string;
  readonly role: StaffRole;
  readonly is_active: boolean;
  readonly created_at: string;
}

export interface CustomerAccount {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone_number: string;
  readonly is_verified: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CustomerAuthProfile {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone_number: string;
}
