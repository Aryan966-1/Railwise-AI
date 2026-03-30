import API_BASE_URL from "./api";

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
  score: number;
  explanation: string;
};

export type SearchResponse = {
  success: boolean;
  data?: SearchResult[];
  error?: string;
};

export type BookRequest = {
  user_id: number;
  train_id: number;
  class_type: string;
};

export type BookingPayload = {
  booking_id: number;
  booking_reference: string;
  status: string;
};

export type BookResponse = {
  message?: string;
  error?: string;
  booking?: BookingPayload;
};

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || "Request failed");
  }

  return data as T;
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
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<SearchResponse>(response);
}

export async function bookTrain(payload: BookRequest): Promise<BookResponse> {
  const response = await fetch(`${API_BASE_URL}/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<BookResponse>(response);
}
