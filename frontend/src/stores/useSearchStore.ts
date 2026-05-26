import { create } from "zustand";
import type { Message } from "@/types/chat";

interface SearchState {
  highlightedMessageId: string | null;
  searchResults: Message[];
  isSearching: boolean;

  setHighlightedMessage: (messageId: string | null) => void;
  clearHighlight: () => void;
  setSearchResults: (results: Message[]) => void;
  clearSearchResults: () => void;
  setIsSearching: (loading: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  highlightedMessageId: null,
  searchResults: [],
  isSearching: false,

  setHighlightedMessage: (messageId) => {
    set({ highlightedMessageId: messageId });
  },

  clearHighlight: () => {
    set({ highlightedMessageId: null });
  },

  setSearchResults: (results) => {
    set({ searchResults: results });
  },

  clearSearchResults: () => {
    set({ searchResults: [] });
  },

  setIsSearching: (loading) => {
    set({ isSearching: loading });
  },
}));
