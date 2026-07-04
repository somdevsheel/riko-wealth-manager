import type { Language } from '../store/useAppStore';
import type { ScoreFactorKey } from '../api/types';

// Fixed enum-style display names the backend returns as English identifiers
// (category names, instrument names, goal ids, factor keys, ask "source").
// These are looked up here rather than sent pre-translated by the backend so
// chart legends / colorForCategory() keying stays stable regardless of language.

const CATEGORY_HI: Record<string, string> = {
  Rent: 'किराया',
  Groceries: 'किराना',
  Dining: 'बाहर खाना',
  Transport: 'परिवहन',
  Utilities: 'उपयोगिताएँ',
  Shopping: 'खरीदारी',
  Entertainment: 'मनोरंजन',
  Health: 'स्वास्थ्य',
  Investment: 'निवेश',
  Other: 'अन्य',
};

const INSTRUMENT_HI: Record<string, string> = {
  SIP: 'एसआईपी',
  FD: 'एफडी',
  ETF: 'ईटीएफ',
  Gold: 'सोना',
};

const RISK_PROFILE_HI: Record<string, string> = {
  Conservative: 'सतर्क',
  Moderate: 'मध्यम',
  Aggressive: 'आक्रामक',
};

const GOAL_NAME_HI: Record<string, string> = {
  emergency: 'आपातकालीन निधि',
  vacation: 'छुट्टी',
  home: 'घर की डाउन पेमेंट',
  education: 'शिक्षा निधि',
  retirement: 'सेवानिवृत्ति',
};

const FACTOR_LABEL_HI: Record<ScoreFactorKey, string> = {
  savings_rate: 'बचत दर',
  spending_discipline: 'खर्च अनुशासन',
  investments: 'निवेश',
  goal_progress: 'लक्ष्य प्रगति',
  emergency_fund: 'आपातकालीन निधि',
  debt_ratio: 'ऋण अनुपात',
};

const FACTOR_LABEL_EN: Record<ScoreFactorKey, string> = {
  savings_rate: 'Savings Rate',
  spending_discipline: 'Spending Discipline',
  investments: 'Investments',
  goal_progress: 'Goal Progress',
  emergency_fund: 'Emergency Fund',
  debt_ratio: 'Debt Ratio',
};

const SOURCE_LABEL_HI: Record<string, string> = {
  llm: 'एआई जनरेटेड',
  rule_based: 'नियम-आधारित',
};

const SOURCE_LABEL_EN: Record<string, string> = {
  llm: 'AI generated',
  rule_based: 'Rule-based',
};

export function categoryLabel(name: string, lang: Language): string {
  return lang === 'hi' ? CATEGORY_HI[name] ?? name : name;
}

export function instrumentLabel(name: string, lang: Language): string {
  return lang === 'hi' ? INSTRUMENT_HI[name] ?? name : name;
}

export function riskProfileLabel(name: string, lang: Language): string {
  return lang === 'hi' ? RISK_PROFILE_HI[name] ?? name : name;
}

export function goalNameLabel(id: string, fallbackName: string, lang: Language): string {
  return lang === 'hi' ? GOAL_NAME_HI[id] ?? fallbackName : fallbackName;
}

export function factorLabel(key: ScoreFactorKey, lang: Language): string {
  return lang === 'hi' ? FACTOR_LABEL_HI[key] : FACTOR_LABEL_EN[key];
}

export function sourceLabel(source: string, lang: Language): string {
  return lang === 'hi' ? SOURCE_LABEL_HI[source] ?? source : SOURCE_LABEL_EN[source] ?? source;
}
