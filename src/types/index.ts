export type Role = 'admin' | 'logist' | 'driver' | 'mechanic' | 'accountant';

export interface DocumentAttachment {
  id: string;
  title: string;
  type: 'receipt' | 'invoice' | 'license' | 'insurance' | 'inspection' | 'service_act' | 'med_cert';
  typeLabel: string;
  fileName: string;
  fileSize?: string;
  previewUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  expiryDate?: string;
  notes?: string;
}

export interface DriverCredentials {
  licenseNumber: string;
  categories: string[];
  licenseExpiry: string;
  medCertExpiry: string;
  tachoCardNumber: string;
  documents: DocumentAttachment[];
}

export interface User {
  id: string;
  name: string;
  role: Role;
  roleLabel: string;
  email: string;
  phone: string;
  avatar?: string;
  telegram?: string;
  driverCredentials?: DriverCredentials;
}

export interface Company {
  id: string;
  name: string;
  currency: 'RUB' | 'KZT' | 'BYN';
  timezone: string;
  supportPhone: string;
}

export type VehicleStatus = 'ready' | 'in_trip' | 'repair' | 'inspection';

export interface VehicleEquipmentItem {
  id: string;
  name: string;
  category: 'docs' | 'safety' | 'tools';
  required: boolean;
  status: 'present' | 'missing' | 'unchecked';
  checkedAt?: string;
  checkedBy?: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  serviceType: 'TO_planned' | 'repair_emergency' | 'tire_service' | 'diagnostics';
  serviceTypeLabel: string;
  date: string;
  mileageKm: number;
  workshopName: string;
  description: string;
  cost: number;
  attachment?: DocumentAttachment;
  performedBy: string;
}

export interface Incident {
  id: string;
  vehicleId: string;
  reportedBy: string;
  reportedAt: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  resolvedAt?: string;
  cost?: number;
  photoAttachment?: DocumentAttachment;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  brandModel: string;
  year: number;
  seatsCount: number;
  type: 'minibus' | 'bus';
  status: VehicleStatus;
  currentLocation: string;
  mileageKm: number;
  nextServiceKm: number;
  incidents: Incident[];
  equipment: VehicleEquipmentItem[];
  documents: DocumentAttachment[];
  serviceRecords: ServiceRecord[];
}

export interface RouteStop {
  id: string;
  name: string;
  stopOrder: number;
  arrivalTimeOffsetMin: number;
  priceFromStart: number;
}

export interface Route {
  id: string;
  name: string;
  departureCity: string;
  arrivalCity: string;
  totalDistanceKm: number;
  estimatedDurationHours: number;
  stops: RouteStop[];
}

export type TripStatus = 'scheduled' | 'boarding' | 'in_progress' | 'completed' | 'cancelled';

export interface TripCheckpoint {
  stopId: string;
  stopName: string;
  scheduledTime: string;
  passedTime?: string;
  isPassed: boolean;
}

export interface Trip {
  id: string;
  tripNumber: string;
  routeId: string;
  routeName: string;
  departureDate: string;
  departureTime: string;
  vehicleId?: string;
  driverId?: string;
  status: TripStatus;
  basePrice: number;
  currency: 'RUB' | 'KZT' | 'BYN';
  checkpoints: TripCheckpoint[];
}

export type BookingStatus = 'new' | 'confirmed' | 'paid' | 'cancelled';
export type BoardingStatus = 'waiting' | 'boarded' | 'no_show';

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  seatNumber: number;
  fromStop: string;
  toStop: string;
  price: number;
  currency: 'RUB' | 'KZT' | 'BYN';
  status: BookingStatus;
  boardingStatus: BoardingStatus;
  createdAt: string;
  paymentMethod?: string;
  accountId?: string;
  collectedByDriver?: boolean;
}

export interface Passenger {
  id: string;
  fullName: string;
  phone: string;
  telegram?: string;
  documentNumber?: string;
  totalTrips: number;
  notes?: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  currency: string;
}

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending_approval' | 'confirmed' | 'rejected';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: 'ticket_sale' | 'fuel' | 'repair' | 'salary' | 'fine' | 'other';
  categoryLabel: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  date: string;
  description: string;
  createdBy: string;
  approvedBy?: string;
  tripId?: string;
  vehicleId?: string;
  bookingId?: string;
  supplierName?: string;
  invoiceNumber?: string;
  liters?: number;
  receiptAttachment?: DocumentAttachment;
  isOpeningBalance?: boolean;
}
