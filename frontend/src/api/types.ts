export interface Profile {
  user_id: string;
  name: string;
  age: number;
  monthly_income: number;
  risk_profile: 'Conservative' | 'Moderate' | 'Aggressive';
  existing_investments: number;
  emergency_fund: number;
  monthly_debt_emi: number;
}

export interface DashboardResponse {
  profile: Profile;
  wealth_score: number;
  month: string;
  income: number;
  spending: number;
  savings: number;
  savings_rate_pct: number;
  investment_summary: {
    existing: number;
    recommended_monthly: number;
  };
  goal_progress_pct: number;
  insights: string[];
}

export interface OverspendAlert {
  category: string;
  current: number;
  average: number;
  delta_pct: number;
}

export interface RecurringExpense {
  merchant: string;
  avg_amount: number;
  months_seen: number;
}

export interface SpendingResponse {
  month: string;
  income: number;
  spending: number;
  savings: number;
  savings_rate_pct: number;
  by_category: Record<string, number>;
  trend: Record<string, number>;
  overspending: OverspendAlert[];
  recurring: RecurringExpense[];
}

export interface ScoreFactor {
  score: number;
  tip: string;
}

export type ScoreFactorKey =
  | 'savings_rate'
  | 'spending_discipline'
  | 'investments'
  | 'goal_progress'
  | 'emergency_fund'
  | 'debt_ratio';

export interface ScoreResponse {
  score: number;
  factors: Record<ScoreFactorKey, ScoreFactor>;
  weights: Record<ScoreFactorKey, number>;
}

export interface Recommendation {
  instrument: 'SIP' | 'FD' | 'ETF' | 'Gold';
  monthly_amount: number;
  expected_return: string;
  why: string;
}

export interface RecommendationsResponse {
  risk_profile: string;
  monthly_surplus: number;
  investable: number;
  recommendations: Recommendation[];
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  months: number;
  saved: number;
  progress_pct: number;
  required_monthly: number;
}

export interface GoalsResponse {
  goals: Goal[];
  total_required_monthly: number;
  surplus_available: number;
  feasible: boolean;
  overall_progress_pct: number;
}

export interface AskRequest {
  question: string;
  lang?: 'en' | 'hi';
}

export interface AskResponse {
  question: string;
  answer: string;
  source: 'llm' | 'rule_based';
}

export interface AffordabilityRequest {
  purchase_price: number;
  down_payment_pct?: number;
  loan_years?: number;
  loan_rate?: number;
  lang?: 'en' | 'hi';
}

export interface AffordabilityResponse {
  purchase_price: number;
  down_payment: number;
  loan_amount: number;
  emi: number;
  loan_years: number;
  current_savings_rate_pct: number;
  new_savings_rate_pct: number;
  verdict: 'affordable' | 'tight';
  explanation: string;
}
