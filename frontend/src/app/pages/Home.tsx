import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Search,
  ArrowRightLeft,
  Calendar,
  Users,
  Zap,
  Star,
  TrendingUp,
  Mic,
  Clock,
  Sparkles,
  Bot,
} from "lucide-react";

import { FloatingCard } from "../components/ui/FloatingCard";
import { GlowButton } from "../components/ui/GlowButton";
import { FloatingChatbot } from "../components/ui/FloatingChatbot";
import { cities, popularRoutes } from "../data/mockData";
import {
  parseIntent,
  searchTrains,
  type AssistantFormPayload,
  type AssistantSearchPayload,
  type ParsedIntent,
} from "../utils/backendApi";
import { useBookingStore } from "../utils/bookingStore";

type QuickFilter = "all" | "tatkal" | "premium";

interface SearchFormState {
  from: string;
  to: string;
  date: string;
  timePreference: string;
  trainClass: string;
  quickFilter: QuickFilter;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayInputValue() {
  return formatLocalDate(new Date());
}

function getTomorrowInputValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalDate(tomorrow);
}

function mapQuickFilterToPreference(quickFilter: QuickFilter) {
  if (quickFilter === "tatkal") {
    return "cheapest";
  }

  if (quickFilter === "premium") {
    return "fastest";
  }

  return "balanced";
}

function mapPreferenceToQuickFilter(preference?: string): QuickFilter {
  const normalizedPreference = preference?.trim().toLowerCase();

  if (normalizedPreference === "cheapest") {
    return "tatkal";
  }

  if (normalizedPreference === "fastest") {
    return "premium";
  }

  return "all";
}

function normalizeAiDateForInput(rawDate: string, aiQuery: string) {
  const today = getTodayInputValue();
  const tomorrow = getTomorrowInputValue();
  const normalizedRawDate = rawDate.trim();
  const loweredRawDate = normalizedRawDate.toLowerCase();
  const loweredQuery = aiQuery.trim().toLowerCase();

  if (!normalizedRawDate) {
    if (/\btomorrow\b/.test(loweredQuery)) {
      return tomorrow;
    }

    if (/\btoday\b/.test(loweredQuery)) {
      return today;
    }

    throw new Error("AI did not return a journey date.");
  }

  if (loweredRawDate === "tomorrow") {
    return tomorrow;
  }

  if (loweredRawDate === "today") {
    return today;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedRawDate)) {
    return normalizedRawDate;
  }

  const dayMonthYearMatch = normalizedRawDate.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dayMonthYearMatch) {
    const [, day, month, year] = dayMonthYearMatch;
    return `${year}-${month}-${day}`;
  }

  const yearMonthDayMatch = normalizedRawDate.match(/^(\d{4})[/](\d{2})[/](\d{2})$/);
  if (yearMonthDayMatch) {
    const [, year, month, day] = yearMonthDayMatch;
    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(normalizedRawDate);
  if (!Number.isNaN(parsedDate.getTime())) {
    return formatLocalDate(parsedDate);
  }

  throw new Error(`AI returned an unsupported date format: ${rawDate}`);
}

function validateInputDate(dateValue: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    throw new Error("Journey date must use YYYY-MM-DD for the date input.");
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const candidateDate = new Date(year, month - 1, day);

  if (
    candidateDate.getFullYear() !== year ||
    candidateDate.getMonth() !== month - 1 ||
    candidateDate.getDate() !== day
  ) {
    throw new Error("Journey date is not a valid calendar date.");
  }

  if (dateValue < getTodayInputValue()) {
    throw new Error("Journey date cannot be in the past.");
  }

  return dateValue;
}

export function Home() {
  const navigate = useNavigate();
  const { updateBooking } = useBookingStore();

  const [formData, setFormData] = useState<SearchFormState>({
    from: "",
    to: "",
    date: getTodayInputValue(),
    timePreference: "any",
    trainClass: "3A",
    quickFilter: "all",
  });
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiQuery, setAiQuery] = useState("");
  const [aiError, setAiError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);

  const recentSearches = [
    { from: "Delhi", to: "Lucknow" },
    { from: "Delhi", to: "Mumbai" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredFromCities = useMemo(
    () => cities.filter((city) => city.toLowerCase().includes(formData.from.toLowerCase())),
    [formData.from],
  );

  const filteredToCities = useMemo(
    () => cities.filter((city) => city.toLowerCase().includes(formData.to.toLowerCase())),
    [formData.to],
  );

  const updateFormField = <K extends keyof SearchFormState>(field: K, value: SearchFormState[K]) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
  };

  const populateFormFromAi = (aiData: ParsedIntent, originalQuery: string) => {
    const normalizedDate = validateInputDate(
      normalizeAiDateForInput(aiData.date ?? "", originalQuery),
    );

    const normalizedSource = aiData.source?.trim();
    const normalizedDestination = aiData.destination?.trim();

    if (!normalizedSource || !normalizedDestination) {
      throw new Error("AI could not extract source and destination from your request.");
    }

    setFormData((currentFormData) => ({
      ...currentFormData,
      from: normalizedSource,
      to: normalizedDestination,
      date: normalizedDate,
      timePreference: aiData.time_preference || "any",
      quickFilter: mapPreferenceToQuickFilter(aiData.preference),
    }));
  };

  const applyAssistantFormPayload = (payload: AssistantFormPayload) => {
    const nextFormData: SearchFormState = {
      ...formData,
      from: payload.source?.trim() || formData.from,
      to: payload.destination?.trim() || formData.to,
      date: payload.date ? validateInputDate(payload.date) : formData.date,
      timePreference: payload.time_preference?.trim() || formData.timePreference,
      trainClass: payload.class_type?.trim() || formData.trainClass,
      quickFilter: payload.preference
        ? mapPreferenceToQuickFilter(payload.preference)
        : formData.quickFilter,
    };

    setFormData(nextFormData);
    setSearchError("");
    setParsedIntent({
      source: nextFormData.from.trim(),
      destination: nextFormData.to.trim(),
      date: nextFormData.date,
      time_preference: nextFormData.timePreference,
      preference: mapQuickFilterToPreference(nextFormData.quickFilter),
    });

    return nextFormData;
  };

  const handleAssistantSearchResults = (payload: AssistantSearchPayload & AssistantFormPayload) => {
    const nextFormData = applyAssistantFormPayload(payload.form ?? payload);

    updateBooking({
      from: nextFormData.from.trim(),
      to: nextFormData.to.trim(),
      date: nextFormData.date,
      trainClass: nextFormData.trainClass,
      quickFilter: nextFormData.quickFilter,
      aiQuery: aiQuery.trim(),
      parsedIntent: {
        source: nextFormData.from.trim(),
        destination: nextFormData.to.trim(),
        date: nextFormData.date,
        time_preference: nextFormData.timePreference,
        preference: mapQuickFilterToPreference(nextFormData.quickFilter),
      },
      searchResults: payload.results ?? [],
      searchError: "",
      searchMessage: payload.message ?? "",
      searchProvider: payload.provider ?? "",
      selectedTrain: null,
      selectedSeats: [],
      passengers: [],
      bookingResult: null,
    });
  };

  const handleAskAi = async () => {
    setAiError("");
    setSearchError("");
    setIsAskingAi(true);

    try {
      if (!aiQuery.trim()) {
        throw new Error("Enter a natural language query before asking AI.");
      }

      const parseResponse = await parseIntent({ query: aiQuery.trim() });
      const nextParsedIntent = parseResponse.data;

      if (!nextParsedIntent) {
        throw new Error("AI parsing did not return structured trip data.");
      }

      populateFormFromAi(nextParsedIntent, aiQuery);
      setParsedIntent(nextParsedIntent);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI parsing failed");
    } finally {
      setIsAskingAi(false);
    }
  };

  const runTrainSearch = async () => {
    const validatedDate = validateInputDate(formData.date);
    const searchResponse = await searchTrains({
      source: formData.from.trim(),
      destination: formData.to.trim(),
      date: validatedDate,
      class_type: formData.trainClass,
      time_preference: formData.timePreference,
      preference: mapQuickFilterToPreference(formData.quickFilter),
    });

    updateBooking({
      from: formData.from.trim(),
      to: formData.to.trim(),
      date: validatedDate,
      trainClass: formData.trainClass,
      quickFilter: formData.quickFilter,
      aiQuery: aiQuery.trim(),
      parsedIntent,
      searchResults: searchResponse.data ?? [],
      searchError: "",
      searchMessage: searchResponse.message ?? "",
      searchProvider: searchResponse.provider ?? "",
      selectedTrain: null,
      selectedSeats: [],
      passengers: [],
      bookingResult: null,
    });

    navigate("/trains");
  };

  const handleSearch = async () => {
    setSearchError("");

    setIsSearching(true);

    try {
      if (!formData.from.trim() || !formData.to.trim() || !formData.date) {
        throw new Error("Please select from, to, and date before searching.");
      }

      await runTrainSearch();
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const swapStations = () => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      from: currentFormData.to,
      to: currentFormData.from,
    }));
  };

  const quickFilters = [
    { id: "all" as const, label: "All Trains", icon: TrendingUp },
    { id: "tatkal" as const, label: "Cheapest", icon: Zap },
    { id: "premium" as const, label: "Fastest", icon: Star },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 backdrop-blur-sm">
              <Clock className="w-4 h-4" />
              <span className="font-mono">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Booking</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent"
            style={{ letterSpacing: "-0.02em" }}
          >
            Book Your Journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-muted-foreground/70"
          >
            Search manually or ask the assistant in plain English.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <FloatingCard className="p-4 bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Try: I want to go from Delhi to Varanasi tomorrow at 15:00
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Ask AI fills the form first. Search Trains stays a separate action.
                </p>
              </div>
            </div>
          </FloatingCard>
        </motion.div>

        <FloatingCard className="p-8 mb-8" delay={0.2}>
          <div className="flex justify-end mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold"
            >
              <Mic className="w-4 h-4" />
              Voice Search
            </motion.button>
          </div>

          <div className="mb-8">
            <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-semibold">
              <Bot className="w-4 h-4" />
              Ask AI
            </label>
            <textarea
              value={aiQuery}
              onChange={(event) => {
                setAiQuery(event.target.value);
                setAiError("");
              }}
              placeholder="Describe your trip in natural language..."
              className="w-full min-h-28 px-4 py-4 rounded-2xl bg-muted/30 border-2 border-border/30 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              This only updates the AI query text. It will not overwrite the form until you click Ask AI.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <GlowButton
                onClick={handleAskAi}
                disabled={isAskingAi}
                className="sm:w-auto flex items-center justify-center gap-3"
              >
                <Bot className="w-5 h-5" />
                {isAskingAi ? "Parsing Query..." : "Ask AI"}
              </GlowButton>

              {parsedIntent && !aiError && (
                <div className="flex items-center px-4 py-3 rounded-2xl bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300 text-sm">
                  Form filled from AI query.
                </div>
              )}
            </div>

            {aiError && (
              <div className="mt-4 px-4 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300">
                {aiError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6 items-end">
            <div className="lg:col-span-2 space-y-2 relative">
              <label className="text-sm text-muted-foreground flex items-center gap-2 font-semibold">
                <Users className="w-4 h-4" />
                From
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.from}
                  onChange={(event) => {
                    updateFormField("from", event.target.value);
                    setShowFromSuggestions(true);
                    setSearchError("");
                  }}
                  onFocus={() => setShowFromSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                  placeholder="Enter departure station"
                  className="w-full px-4 py-4 rounded-2xl bg-muted/30 border-2 border-border/30 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
                {showFromSuggestions && formData.from && filteredFromCities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-50 backdrop-blur-xl"
                  >
                    {filteredFromCities.slice(0, 5).map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          updateFormField("from", city);
                          setShowFromSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        {city}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex items-end justify-center pb-2">
              <motion.button
                whileHover={{ scale: 1.2, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={swapStations}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl"
                style={{
                  boxShadow: "0 0 30px rgba(139, 92, 246, 0.4)",
                }}
              >
                <ArrowRightLeft className="w-6 h-6 text-white" />
              </motion.button>
            </div>

            <div className="lg:col-span-2 space-y-2 relative">
              <label className="text-sm text-muted-foreground flex items-center gap-2 font-semibold">
                <Users className="w-4 h-4" />
                To
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.to}
                  onChange={(event) => {
                    updateFormField("to", event.target.value);
                    setShowToSuggestions(true);
                    setSearchError("");
                  }}
                  onFocus={() => setShowToSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                  placeholder="Enter destination station"
                  className="w-full px-4 py-4 rounded-2xl bg-muted/30 border-2 border-border/30 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                />
                {showToSuggestions && formData.to && filteredToCities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-50 backdrop-blur-xl"
                  >
                    {filteredToCities.slice(0, 5).map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          updateFormField("to", city);
                          setShowToSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        {city}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-3 flex items-center gap-2 font-semibold">
              <Calendar className="w-4 h-4" />
              Journey Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(event) => {
                updateFormField("date", event.target.value);
                setSearchError("");
              }}
              min={getTodayInputValue()}
              className="w-full px-4 py-4 rounded-2xl bg-muted/30 border-2 border-border/30 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-3 block font-semibold">Travel Class</label>
            <div className="flex flex-wrap gap-3">
              {["General", "3A", "2A", "1A", "CC", "EC"].map((cls) => (
                <motion.button
                  key={cls}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateFormField("trainClass", cls)}
                  className={`px-6 py-3 rounded-full transition-all font-semibold ${
                    formData.trainClass === cls
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "bg-muted/30 text-foreground hover:bg-muted/50 border border-border/30"
                  }`}
                  style={formData.trainClass === cls ? {
                    boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
                  } : {}}
                >
                  {cls}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-3 block font-semibold">Search Preference</label>
            <div className="flex flex-wrap gap-3">
              {quickFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <motion.button
                    key={filter.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateFormField("quickFilter", filter.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-semibold ${
                      formData.quickFilter === filter.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                        : "bg-muted/30 text-foreground hover:bg-muted/50 border border-border/30"
                    }`}
                    style={formData.quickFilter === filter.id ? {
                      boxShadow: "0 0 20px rgba(236, 72, 153, 0.3)",
                    } : {}}
                  >
                    <Icon className="w-5 h-5" />
                    {filter.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {searchError && (
            <div className="mb-6 px-4 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300">
              {searchError}
            </div>
          )}

          <GlowButton
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-3 text-lg"
          >
            <Search className="w-6 h-6" />
            {isSearching ? "Searching..." : "Search Trains"}
          </GlowButton>
        </FloatingCard>

        {recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Searches
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentSearches.map((search, index) => (
                <FloatingCard
                  key={index}
                  className="p-4 cursor-pointer flex-shrink-0 min-w-[200px]"
                  onClick={() => {
                    updateFormField("from", search.from);
                    updateFormField("to", search.to);
                    setAiQuery("");
                    setAiError("");
                  }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span>{search.from}</span>
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <span>{search.to}</span>
                  </div>
                </FloatingCard>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Popular Routes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularRoutes.map((route, index) => (
              <FloatingCard key={index} className="p-5 cursor-pointer group" delay={0.6 + index * 0.1}>
                <div
                  onClick={() => {
                    updateFormField("from", route.from);
                    updateFormField("to", route.to);
                    setAiQuery("");
                    setAiError("");
                  }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="text-blue-600 dark:text-blue-400">{route.from}</span>
                    </div>
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-purple-600 dark:text-purple-400">{route.to}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>Live backend search available for this route</span>
                  </div>
                </div>
              </FloatingCard>
            ))}
          </div>
        </motion.div>
      </div>

      <FloatingChatbot
        currentForm={{
          source: formData.from.trim(),
          destination: formData.to.trim(),
          date: formData.date,
          time_preference: formData.timePreference,
          class_type: formData.trainClass,
          preference: mapQuickFilterToPreference(formData.quickFilter),
        }}
        onFillForm={applyAssistantFormPayload}
        onSearchResults={handleAssistantSearchResults}
      />
    </div>
  );
}
