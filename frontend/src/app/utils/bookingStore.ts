import { useEffect, useState } from "react";

import type { BookingPayload, ParsedIntent, SearchResult } from "./backendApi";

export interface PassengerRecord {
  id: string;
  name: string;
  age: string;
  gender: "male" | "female" | "other";
}

interface BookingState {
  from: string;
  to: string;
  date: string;
  trainClass: string;
  selectedTrain: SearchResult | null;
  selectedSeats: string[];
  passengers: PassengerRecord[];
  quickFilter: string;
  aiQuery: string;
  parsedIntent: ParsedIntent | null;
  searchResults: SearchResult[];
  searchError: string;
  bookingResult: BookingPayload | null;
}

class BookingStore {
  private state: BookingState = {
    from: "",
    to: "",
    date: "",
    trainClass: "3A",
    selectedTrain: null,
    selectedSeats: [],
    passengers: [],
    quickFilter: "all",
    aiQuery: "",
    parsedIntent: null,
    searchResults: [],
    searchError: "",
    bookingResult: null,
  };

  private listeners: Set<() => void> = new Set();

  getState() {
    return { ...this.state };
  }

  setState(updates: Partial<BookingState>) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  reset() {
    this.state = {
      from: "",
      to: "",
      date: "",
      trainClass: "3A",
      selectedTrain: null,
      selectedSeats: [],
      passengers: [],
      quickFilter: "all",
      aiQuery: "",
      parsedIntent: null,
      searchResults: [],
      searchError: "",
      bookingResult: null,
    };
    this.notify();
  }
}

export const bookingStore = new BookingStore();

export function useBookingStore() {
  const [state, setState] = useState(bookingStore.getState());

  useEffect(() => {
    return bookingStore.subscribe(() => {
      setState(bookingStore.getState());
    });
  }, []);

  return {
    ...state,
    updateBooking: (updates: Partial<BookingState>) => bookingStore.setState(updates),
    resetBooking: () => bookingStore.reset(),
  };
}
