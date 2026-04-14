import { create } from 'zustand';
import { ParseResult } from '../types/models';

interface ParseStore {
  parsedResult: ParseResult | null;
  setParsedResult: (result: ParseResult) => void;
  clearParsedResult: () => void;
}

export const useParseStore = create<ParseStore>((set) => ({
  parsedResult: null,
  setParsedResult: (result) => set({ parsedResult: result }),
  clearParsedResult: () => set({ parsedResult: null }),
}));
