import { useEffect, useState } from "react";
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
import { parseIntent, searchTrains, type ParsedIntent } from "../utils/backendApi";
import { useBookingStore } from "../utils/bookingStore";

function mapQuickFilterToPreference(quickFilter: string) {
  if (quickFilter === "tatkal") {
    return "cheapest";
  }

  if (quickFilter === "premium") {
    return "fastest";
  }

  return "balanced";
}

export function Home() {
  const navigate = useNavigate();
  const { updateBooking } = useBookingStore();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [trainClass, setTrainClass] = useState("3A");
  const [quickFilter, setQuickFilter] = useState("all");
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiQuery, setAiQuery] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const recentSearches = [
    { from: "Delhi", to: "Lucknow" },
    { from: "Delhi", to: "Mumbai" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredFromCities = cities.filter((city) =>
    city.toLowerCase().includes(from.toLowerCase()),
  );

  const filteredToCities = cities.filter((city) =>
    city.toLowerCase().includes(to.toLowerCase()),
  );

  const runTrainSearch = async (
    source: string,
    destination: string,
    journeyDate: string,
    preference: string,
    parsedIntentData: ParsedIntent | null,
    naturalLanguageQuery: string,
  ) => {
    const searchResponse = await searchTrains({
      source,
      destination,
      date: journeyDate,
      preference,
    });

    updateBooking({
      from: source,
      to: destination,
      date: journeyDate,
      trainClass,
      quickFilter,
      aiQuery: naturalLanguageQuery,
      parsedIntent: parsedIntentData,
      searchResults: searchResponse.data ?? [],
      searchError: "",
      selectedTrain: null,
      selectedSeats: [],
      passengers: [],
      bookingResult: null,
    });

    navigate("/trains");
  };

  const handleSearch = async () => {
    setSubmitError("");
    setIsSearching(true);

    try {
      if (aiQuery.trim()) {
        const parseResponse = await parseIntent({ query: aiQuery.trim() });
        const parsedIntentData = parseResponse.data;

        if (!parsedIntentData?.source || !parsedIntentData.destination || !parsedIntentData.date) {
          throw new Error("AI could not extract source, destination, and date from your request.");
        }

        setFrom(parsedIntentData.source);
        setTo(parsedIntentData.destination);
        setDate(parsedIntentData.date);

        await runTrainSearch(
          parsedIntentData.source,
          parsedIntentData.destination,
          parsedIntentData.date,
          parsedIntentData.preference || "balanced",
          parsedIntentData,
          aiQuery.trim(),
        );

        return;
      }

      if (!from || !to || !date) {
        throw new Error("Please select from, to, and date before searching.");
      }

      await runTrainSearch(
        from,
        to,
        date,
        mapQuickFilterToPreference(quickFilter),
        null,
        "",
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const swapStations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const quickFilters = [
    { id: "all", label: "All Trains", icon: TrendingUp },
    { id: "tatkal", label: "Cheapest", icon: Zap },
    { id: "premium", label: "Fastest", icon: Star },
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
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground mb-2"
          >
            Travel smarter with a live Flask, PostgreSQL, and Gemini-backed booking flow.
          </motion.p>
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
                  Try: Book the cheapest train from Delhi to Lucknow on 2026-04-02 morning
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  That will call the real <code>/ai/parse</code> and <code>/search</code> APIs.
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
              onChange={(event) => setAiQuery(event.target.value)}
              placeholder="Describe your trip in natural language..."
              className="w-full min-h-28 px-4 py-4 rounded-2xl bg-muted/30 border-2 border-border/30 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Leave this blank to use the manual form below.
            </p>
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
                  value={from}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setShowFromSuggestions(true);
                  }}
                  onFocus={() => setShowFromSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                  placeholder="Enter departure station"
                  className="w-full px-4 py-4 rounded-2xl bg-muted/30 border-2 border-border/30 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
                {showFromSuggestions && from && filteredFromCities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-50 backdrop-blur-xl"
                  >
                    {filteredFromCities.slice(0, 5).map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setFrom(city);
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
                  value={to}
                  onChange={(event) => {
                    setTo(event.target.value);
                    setShowToSuggestions(true);
                  }}
                  onFocus={() => setShowToSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                  placeholder="Enter destination station"
                  className="w-full px-4 py-4 rounded-2xl bg-muted/30 border-2 border-border/30 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                />
                {showToSuggestions && to && filteredToCities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-50 backdrop-blur-xl"
                  >
                    {filteredToCities.slice(0, 5).map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setTo(city);
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
              value={date}
              onChange={(event) => setDate(event.target.value)}
              min={new Date().toISOString().split("T")[0]}
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
                  onClick={() => setTrainClass(cls)}
                  className={`px-6 py-3 rounded-full transition-all font-semibold ${
                    trainClass === cls
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "bg-muted/30 text-foreground hover:bg-muted/50 border border-border/30"
                  }`}
                  style={trainClass === cls ? {
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
                    onClick={() => setQuickFilter(filter.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-semibold ${
                      quickFilter === filter.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                        : "bg-muted/30 text-foreground hover:bg-muted/50 border border-border/30"
                    }`}
                    style={quickFilter === filter.id ? {
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

          {submitError && (
            <div className="mb-6 px-4 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300">
              {submitError}
            </div>
          )}

          <GlowButton
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-3 text-lg"
          >
            <Search className="w-6 h-6" />
            {isSearching ? "Searching..." : aiQuery.trim() ? "Search With AI" : "Search Trains"}
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
                    setFrom(search.from);
                    setTo(search.to);
                    setAiQuery("");
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
                    setFrom(route.from);
                    setTo(route.to);
                    setAiQuery("");
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

      <FloatingChatbot />
    </div>
  );
}
