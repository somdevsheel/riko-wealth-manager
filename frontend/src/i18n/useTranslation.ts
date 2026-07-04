import { useAppStore } from '../store/useAppStore';
import { strings, type StringKey } from './strings';

export function useTranslation() {
  const language = useAppStore((s) => s.language);
  const t = (key: StringKey): string => strings[language][key];
  return { t, language };
}
