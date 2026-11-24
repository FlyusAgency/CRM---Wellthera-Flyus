import { ServiceBooking } from '../types';

/**
 * Real bookings log starts empty (zero synthetic/fabricated appointments or future dates).
 * Appointments logged via Front Desk Quick Log or synced from Google Sheets / ClinicSense
 * Appointments Report will populate here with verified dates, services, therapists, and CAD revenue.
 */
export const clinicSenseBookings: ServiceBooking[] = [];
