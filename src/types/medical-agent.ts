export interface Doctor {
  id: string;
  name: string;
  department: string;
  title: string;
  hospital: string;
  location: string;
  rating: number;
  availableSlots: string[];
  distance: string;
  specialties: string[];
}

export interface InsurancePlan {
  id: string;
  name: string;
  provider: string;
  coverage: string[];
  monthlyPrice: number;
  deductible: number;
  rating: number;
  matchReason: string;
}

export interface ContactInfo {
  type: 'emergency' | 'hotline' | 'online' | 'appointment';
  label: string;
  value: string;
  description: string;
  available: string;
}

export interface ToolResult {
  type: 'doctor_recommendation' | 'insurance_suggestion' | 'contact_info';
  data: Doctor[] | InsurancePlan[] | ContactInfo[];
  query: Record<string, unknown>;
}

export interface MedicalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolResult?: ToolResult;
  isEmergency?: boolean;
}

export interface UserProfile {
  location?: string;
  symptoms?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'emergency';
  duration?: string;
  medicalHistory?: string;
  insuranceStatus?: 'none' | 'basic' | 'commercial' | 'unknown';
  collectedFields: string[];
}

export const DEPARTMENTS = [
  '内科', '外科', '儿科', '妇科', '骨科', '皮肤科',
  '眼科', '耳鼻喉科', '心理科', '急诊科', '中医科',
  '口腔科', '心血管科', '呼吸科', '消化科', '神经科',
] as const;

export type Department = typeof DEPARTMENTS[number];
