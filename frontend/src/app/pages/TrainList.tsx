import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Clock,
  MapPin,
  IndianRupee,
  Users,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { FloatingCard } from "../components/ui/FloatingCard";
import { useBookingStore } from "../utils/bookingStore";

function formatTime(value: string) {
  return value.slice(0, 5);
}

export function TrainList() {
  const navigate = useNavigate();
  const {
    from,
    to,
    date,
    trainClass,
    searchResults,
    searchError,
    updateBooking,
  } = useBookingStore();
  const [sortBy, setSortBy] = useState<"price" | "duration" | "departure">("departure");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredTrains = useMemo(() => {
    let trains = [...searchResults];

    if (trainClass) {
      trains = trains.filter((train) => train.class_type.toLowerCase() === trainClass.toLowerCase());
    }

    trains = trains.filter((train) => train.price >= priceRange[0] && train.price <= priceRange[1]);

    trains.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "duration":
          return a.travel_hours - b.travel_hours;
        case "departure":
          return a.departure_time.localeCompare(b.departure_time);
        default:
          return 0;
      }
    });

    return trains;
  }, [priceRange, searchResults, sortBy, trainClass]);

  const handleSelectTrain = (train: (typeof filteredTrains)[number]) => {
    updateBooking({
      selectedTrain: train,
      selectedSeats: [],
      passengers: [],
      bookingResult: null,
    });
    navigate("/seats");
  };

  const lowestPrice = filteredTrains.length > 0
    ? Math.min(...filteredTrains.map((train) => train.price))
    : 0;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold mb-2"
          >
            Available Trains
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-2 text-muted-foreground"
          >
            <MapPin className="w-4 h-4" />
            <span>{from} to {to}</span>
            <span className="hidden md:inline">|</span>
            <span>{date || "No date selected"}</span>
            <span className="hidden md:inline">|</span>
            <span>Class {trainClass}</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <FloatingCard className="p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                </h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-sm text-blue-500"
                >
                  {showFilters ? "Hide" : "Show"}
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">Sort By</label>
                  <div className="space-y-2">
                    {[
                      { value: "departure", label: "Departure Time" },
                      { value: "duration", label: "Duration" },
                      { value: "price", label: "Price" },
                    ].map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ x: 4 }}
                        onClick={() => setSortBy(option.value as typeof sortBy)}
                        className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
                          sortBy === option.value
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-3 block">
                    Price Range: Rs {priceRange[0]} - Rs {priceRange[1]}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={priceRange[1]}
                    onChange={(event) => setPriceRange([0, parseInt(event.target.value, 10)])}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rows Returned</span>
                      <span className="font-semibold">{searchResults.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rows Visible</span>
                      <span className="font-semibold">{filteredTrains.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lowest Price</span>
                      <span className="font-semibold">Rs {lowestPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            </FloatingCard>
          </motion.div>

          <div className="lg:col-span-3 space-y-4">
            {searchError && (
              <FloatingCard className="p-6 border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300">
                {searchError}
              </FloatingCard>
            )}

            {!searchError && filteredTrains.length === 0 && (
              <FloatingCard className="p-8 text-center">
                <Sparkles className="w-10 h-10 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-semibold mb-2">No trains found</h3>
                <p className="text-muted-foreground mb-4">
                  The backend responded successfully, but there are no matching trains for this route, date, and class.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                >
                  Try another search
                </button>
              </FloatingCard>
            )}

            {filteredTrains.map((train, index) => (
              <FloatingCard key={`${train.train_id}-${train.class_type}`} delay={0.1 * index} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-1 h-16 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{train.train_name}</h3>
                            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                              {train.class_type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">Train #{train.train_id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mb-3">
                        <div>
                          <p className="text-2xl font-bold">{formatTime(train.departure_time)}</p>
                          <p className="text-xs text-muted-foreground">{train.source}</p>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-blue-500 to-purple-600" />
                          <div className="text-center px-3 py-1 rounded-full bg-muted/50">
                            <Clock className="w-4 h-4 inline mr-1" />
                            <span className="text-xs">{train.travel_hours.toFixed(1)}h</span>
                          </div>
                          <div className="h-px flex-1 bg-gradient-to-r from-purple-600 to-pink-600" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{formatTime(train.arrival_time)}</p>
                          <p className="text-xs text-muted-foreground">{train.destination}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${train.total_seats > 0 ? (train.available_seats / train.total_seats) * 100 : 0}%` }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                            className={`h-full ${
                              train.available_seats > 10
                                ? "bg-green-500"
                                : train.available_seats > 0
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {train.available_seats} of {train.total_seats} seats
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">{train.explanation}</p>
                    </div>

                    <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-3xl font-bold">
                          <IndianRupee className="w-6 h-6" />
                          {train.price}
                        </div>
                        <p className="text-xs text-muted-foreground">per booking</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectTrain(train)}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap"
                      >
                        Select
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
