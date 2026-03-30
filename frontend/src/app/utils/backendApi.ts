import API_BASE_URL from "./api";
import { getAuthenticatedHeaders } from "./currentUser";

export type ParseIntentRequest = {
  query: string;
};

export type ParsedIntent = {
  source: string;
  destination: string;
  date: string;
  time_preference: string;
  preference: string;
};

export type ParseIntentResponse = {
  success: boolean;
  data?: ParsedIntent;
  error?: {
    code: string;
    message: string;
  };
};

export type SearchRequest = {
  source: string;
  destination: string;
  date: string;
  class_type?: string;
  time_preference?: string;
  preference?: string;
};

export type SearchResult = {
  train_id: number;
  train_name: string;
  source: string;
  destination: string;
  journey_date: string;
  departure_time: string;
  arrival_time: string;
  travel_hours: number;
  class_type: string;
  price: number;
  available_seats: number;
  total_seats: number;
  has_seat_data?: boolean;
  score: number;
  explanation: string;
};

export type SearchResponse = {
  success: boolean;
  data?: SearchResult[];
  message?: string;
  provider?: string;
  error?: string;
};

export type BookRequest = {
  train_id: number;
  class_type: string;
};

export type BookingPayload = {
  booking_id: number;
  booking_reference: string;
  status: string;
  user_id: number;
  train_id: number;
  train_name: string;
  source: string;
  destination: string;
  journey_date: string;
  class_type: string;
  created_at: string;
  fare: number;
};

export type MyBookingsResponse = {
  success: boolean;
  data?: BookingPayload[];
  error?: string;
};

export type BookResponse = {
  message?: string;
  error?: string;
  booking?: BookingPayload;
};

export type AssistantAction = "fill_form" | "search_results" | "booking_help" | "help" | "error";

export type AssistantFormPayload = {
  source?: string;
  destination?: string;
  date?: string;
  time_preference?: string;
  preference?: string;
  class_type?: string;
};

export type AssistantSearchPayload = {
  form?: AssistantFormPayload;
  results?: SearchResult[];
  provider?: string;
  message?: string;
  missing_fields?: string[];
};

export type AssistantChatRequest = {
  message: string;
  current_form?: AssistantFormPayload;
};

export type AssistantChatData = {
  reply: string;
  action: AssistantAction;
  payload?: AssistantSearchPayload & AssistantFormPayload;
};

export type AssistantChatResponse = {
  success: boolean;
  data?: AssistantChatData;
  error?: string;
};

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || "Request failed");
  }

  return data as T;
}

function isValidDate(year: number, month: number, day: number) {
  const candidateDate = new Date(year, month - 1, day);

  return (
    candidateDate.getFullYear() === year &&
    candidateDate.getMonth() === month - 1 &&
    candidateDate.getDate() === day
  );
}

function normalizeSearchDateForApi(rawDate: string) {
  if (typeof rawDate !== "string" || !rawDate.trim()) {
    throw new Error("Journey date is required.");
  }

  const normalizedDate = rawDate.trim();
  const yearMonthDayMatch = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yearMonthDayMatch) {
    const [, year, month, day] = yearMonthDayMatch;
    if (!isValidDate(Number(year), Number(month), Number(day))) {
      throw new Error("Journey date is invalid.");
    }

    return normalizedDate;
  }

  const dayMonthYearMatch = normalizedDate.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dayMonthYearMatch) {
    const [, day, month, year] = dayMonthYearMatch;
    if (!isValidDate(Number(year), Number(month), Number(day))) {
      throw new Error("Journey date is invalid.");
    }

    return `${year}-${month}-${day}`;
  }

  throw new Error("Journey date must use YYYY-MM-DD or DD-MM-YYYY.");
}

export async function parseIntent(payload: ParseIntentRequest): Promise<ParseIntentResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<ParseIntentResponse>(response);
}

export async function searchTrains(payload: SearchRequest): Promise<SearchResponse> {
  const normalizedPayload = {
    ...payload,
    date: normalizeSearchDateForApi(payload.date),
  };

  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(normalizedPayload),
  });

  return handleResponse<SearchResponse>(response);
}

export async function bookTrain(payload: BookRequest): Promise<BookResponse> {
  const response = await fetch(`${API_BASE_URL}/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthenticatedHeaders(),
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<BookResponse>(response);
}

export async function fetchMyBookings(): Promise<MyBookingsResponse> {
  const response = await fetch(`${API_BASE_URL}/bookings/my`, {
    method: "GET",
    headers: {
      ...getAuthenticatedHeaders(),
    },
  });

  return handleResponse<MyBookingsResponse>(response);
}

export async function assistantChat(payload: AssistantChatRequest): Promise<AssistantChatResponse> {
  const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<AssistantChatResponse>(response);
}
