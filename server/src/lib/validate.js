import { z } from 'zod';

const today = () => new Date(new Date().toDateString());

export const bookingSchema = z.object({
  customerName: z.string().trim().min(1).max(100),
  phoneNumber: z.string().trim().regex(/^[0-9()+\-\s]{7,20}$/, 'nomor telepon tidak valid'),
  email: z.string().trim().email().max(150),
  selectedService: z.union([z.string(), z.number()]).transform(String),
  serviceDetails: z.string().trim().min(1).max(1000),
  quantity: z.coerce.number().int().min(1).max(100),
  estimatedDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v) >= today(), 'tanggal tidak valid / di masa lalu'),
  notes: z.string().trim().max(1000).optional().default(''),
  preferredPayment: z.enum(['DP', 'FULL']),
  website: z.string().max(200).optional().default(''), // honeypot
});

export const loginSchema = z.object({
  phone: z.string().trim().min(6).max(20),
  password: z.string().min(1).max(64),
});

export const consultSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

export const gallerySchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().default(''),
  image: z.string().url().max(500),
  category: z.string().trim().max(40).optional().default(''),
  price: z.coerce.number().int().min(0).optional(),
  tags: z.array(z.string().max(40)).max(12).optional().default([]),
});
