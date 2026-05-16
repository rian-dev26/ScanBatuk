export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string;
  age?: number;
  isSmoker?: boolean;
  coughDurationDays?: number;
  symptoms?: string;
}

export interface ScreeningResult {
  id: string;
  sessionId: string;
  userId?: string;
  audioUrl?: string;
  riskScore: number;
  riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk';
  symptoms: string[];
  aiInsight: string;
  recommendations: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}
