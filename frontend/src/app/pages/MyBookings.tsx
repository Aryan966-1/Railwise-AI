import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Calendar, Clock3, MapPin, Receipt, Ticket } from "lucide-react";

import { FloatingCard } from "../components/ui/FloatingCard";
import { fetchMyBookings, type BookingPayload } from "../utils/backendApi";
import { currentUser } from "../utils/currentUser";

function formatReadableDate(value: string) {
  if (!value) {
    return "Date unavailable";
  }

  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatReadableDateTime(value: string) {
  if (!value) {
    return "Time unavailable";
  }

  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MyBookings() {
  const [bookings, setBookings] = useState<BookingPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetchMyBookings();
        if (!active) {
          return;
        }

        setBookings(response.data ?? []);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Failed to load bookings.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">My Bookings</h2>
          <p className="text-muted-foreground">
            Showing database-backed bookings for {currentUser.name}.
          </p>
        </motion.div>

        {loading && (
          <FloatingCard className="p-6 text-muted-foreground">
            Loading your bookings...
          </FloatingCard>
        )}

        {!loading && error && (
          <FloatingCard className="p-6 border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300">
            {error}
          </FloatingCard>
        )}

        {!loading && !error && bookings.length === 0 && (
          <FloatingCard className="p-10 text-center">
            <Ticket className="w-10 h-10 mx-auto mb-4 text-blue-500" />
            <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground">
              Your confirmed train bookings will appear here once you complete a payment.
            </p>
          </FloatingCard>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <FloatingCard
                key={booking.booking_reference}
                delay={index * 0.06}
                className="overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Booking Reference</p>
                        <h3 className="text-2xl font-bold">{booking.booking_reference}</h3>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                          {booking.status}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-muted/50 text-sm font-semibold">
                          {booking.class_type}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="text-sm text-muted-foreground">Route</p>
                            <p className="font-semibold">{booking.source} to {booking.destination}</p>
                            <p className="text-xs text-muted-foreground">{booking.train_name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="text-sm text-muted-foreground">Journey Date</p>
                            <p className="font-semibold">{formatReadableDate(booking.journey_date)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock3 className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="text-sm text-muted-foreground">Booked On</p>
                            <p className="font-semibold">{formatReadableDateTime(booking.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Receipt className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="text-sm text-muted-foreground">Fare Snapshot</p>
                            <p className="font-semibold">Rs {booking.fare}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:text-right">
                      <p className="text-sm text-muted-foreground">Booking ID</p>
                      <p className="text-lg font-semibold">{booking.booking_id}</p>
                    </div>
                  </div>
                </div>
              </FloatingCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
