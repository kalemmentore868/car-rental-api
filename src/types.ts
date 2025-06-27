export type UserType = "admin" | "customer";

export interface CustomerProfile {
  permitNumber: string;
  phone: string;
  issueDate: string;
  expiryDate: string;
  birthDate: string;
  address: string;
  driversPermitUrl: string;
  nationality?: string;
  passportNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface AppUser {
  uid: string; // Firebase UID
  email: string;
  firstName: string;
  lastName: string;
  type: UserType;
  created_at: Date | string;
  photoURL?: string;
  lastLogin?: Date | string;
  isDisabled?: boolean;
  profile?: CustomerProfile;
}

export interface Driver {
  name: string;
  permitNumber: string;
  issueDate: string;
  expiryDate: string;
  birthDate: string;
  address: string;
  phone: string;
}

export interface Car {
  carLicenseNo: string;
  carMake: string;
  carModel: string;
  carColor: string;
  carMonthlyRate: number;
  carDailyRate: number;
}

export interface Driver {
  name: string;
  permitNumber: string;
  issueDate: string;
  expiryDate: string;
  birthDate: string;
  address: string;
  phone: string;
}

export interface Car {
  carLicenseNo: string;
  carMake: string;
  carModel: string;
  carColor: string;
  carMonthlyRate: number;
  carDailyRate: number;
}

export interface ContractFormData {
  id?: string;
  userId: string;

  // Primary driver
  name: string;
  permitNumber: string;
  issueDate: string;
  expiryDate: string;
  birthDate: string;
  address: string;
  phone: string;

  additionalDrivers?: Driver[];

  // Foreign contact details
  foreignAddress?: string;
  foreignPhone?: string;
  foreignAddress2?: string;
  foreignPhone2?: string;

  // Company (if applicable)
  companyName?: string;
  companyPhone?: string;

  // Collision Damage Waiver
  collisionAcceptance: boolean;

  // Vehicle info

  carLicenseNo: string;
  carMake: string;
  carModel: string;
  carColor: string;
  carMonthlyRate: number;
  carDailyRate: number;

  additionalCars?: Car[];

  // Rental dates/times
  dateOut: string;
  timeOut: string;
  dateDue: string;
  timeIn: string;

  approved: boolean;
  mileageIn?: number;
  mileageOut?: number;
  dateCreated?: string;
  amount?: number;
  returnLocation?: string;
}
