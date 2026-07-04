import type { Language } from '../store/useAppStore';

// These are sent as literal question text to /api/ask, so the Hindi versions
// use the same keyword patterns the backend's rule-based responder matches on.

export const SUGGESTED_QUESTIONS: Record<Language, string[]> = {
  en: [
    'Can I afford a ₹12 lakh car?',
    'Should I choose SIP or FD?',
    'Why is my wealth score low?',
    'How much should I invest monthly?',
  ],
  hi: [
    'क्या मैं ₹12 लाख की कार खरीद सकता हूं?',
    'एसआईपी या एफडी में क्या बेहतर है?',
    'मेरा वेल्थ स्कोर कम क्यों है?',
    'मुझे मासिक कितना निवेश करना चाहिए?',
  ],
};

export const AFFORDABILITY_DEMO: Record<Language, string> = {
  en: 'Can I afford a ₹15 lakh car?',
  hi: 'क्या मैं ₹15 लाख की कार खरीद सकता हूं?',
};

export const DEFAULT_GREETING: Record<Language, string> = {
  en: "Hi, I'm Artha, your Riko advisor. Ask me anything about your money.",
  hi: 'नमस्ते, मैं अर्थ हूं, आपका रीको एडवाइजर। मुझसे अपने पैसों के बारे में कुछ भी पूछें।',
};
