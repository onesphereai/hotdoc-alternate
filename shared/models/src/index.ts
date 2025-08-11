import { z } from 'zod';

export const AddressSchema = z.object({
  line1: z.string(),
  suburb: z.string(),
  state: z.string(),
  postcode: z.string(),
  country: z.string().default('AU')
});

export const GeoSchema = z.object({
  lat: z.number(),
  lng: z.number()
});

export const PracticeSchema = z.object({
  practiceId: z.string(),
  tenantId: z.string(),
  name: z.string(),
  abn: z.string().optional(),
  address: AddressSchema,
  geo: GeoSchema.optional(),
  services: z.array(z.string()),
  hours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.string(),
    closeTime: z.string()
  })),
  billingPolicy: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const ProviderSchema = z.object({
  providerId: z.string(),
  tenantId: z.string(),
  practiceId: z.string(),
  name: z.string(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  languages: z.array(z.string()),
  specialties: z.array(z.string()),
  sessionRules: z.object({
    defaultSessionDuration: z.number(),
    defaultBreakDuration: z.number()
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const AppointmentTypeSchema = z.object({
  code: z.string(),
  tenantId: z.string(),
  practiceId: z.string(),
  name: z.string(),
  duration: z.number(),
  billingCode: z.string().optional(),
  description: z.string().optional()
});

export const SlotSchema = z.object({
  slotId: z.string(),
  providerId: z.string(),
  practiceId: z.string(),
  tenantId: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  apptTypeCode: z.string(),
  available: z.boolean()
});

export const BookingStatus = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']);

export const BookingSchema = z.object({
  bookingId: z.string(),
  tenantId: z.string(),
  patientId: z.string().optional(),
  contact: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    preferredChannel: z.enum(['email', 'sms', 'voice']).default('email')
  }),
  slotRef: z.object({
    slotId: z.string(),
    providerId: z.string(),
    practiceId: z.string(),
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  status: BookingStatus,
  confirmationCode: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const RecallSchema = z.object({
  recallId: z.string(),
  tenantId: z.string(),
  name: z.string(),
  criteria: z.object({
    providerId: z.string().optional(),
    cohort: z.string().optional(),
    patientIds: z.array(z.string()).optional()
  }),
  channel: z.enum(['email', 'sms', 'voice']),
  templateId: z.string(),
  schedule: z.object({
    type: z.enum(['immediate', 'scheduled']),
    scheduledAt: z.string().datetime().optional()
  }),
  status: z.enum(['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
  stats: z.object({
    total: z.number(),
    sent: z.number(),
    delivered: z.number(),
    failed: z.number()
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const PatientSchema = z.object({
  patientId: z.string(),
  tenantId: z.string(),
  demographics: z.object({
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    gender: z.enum(['male', 'female', 'other']).optional()
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string(),
    address: AddressSchema.optional()
  }),
  preferences: z.object({
    communicationChannel: z.enum(['email', 'sms', 'voice']).default('email'),
    reminderOptOut: z.boolean().default(false)
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const SessionSchema = z.object({
  sessionId: z.string(),
  tenantId: z.string(),
  providerId: z.string(),
  practiceId: z.string(),
  date: z.string(),
  slots: z.array(z.object({
    start: z.string(),
    end: z.string(),
    available: z.boolean(),
    apptTypeCode: z.string().optional()
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Address = z.infer<typeof AddressSchema>;
export type Geo = z.infer<typeof GeoSchema>;
export type Practice = z.infer<typeof PracticeSchema>;
export type Provider = z.infer<typeof ProviderSchema>;
export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;
export type Slot = z.infer<typeof SlotSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type Recall = z.infer<typeof RecallSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type Session = z.infer<typeof SessionSchema>;