import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Download,
  Share2,
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
} from "lucide-react";

import { FloatingCard } from "../components/ui/FloatingCard";
import { useBookingStore } from "../utils/bookingStore";

function formatReadableDate(value: string) {
  if (!value) {
    return "Date unavailable";
  }

  return new Date(value).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function Confirmation() {
  const navigate = useNavigate();
  const {
    selectedTrain,
    selectedSeats,
    passengers,
    from,
    to,
    date,
    bookingResult,
    resetBooking,
  } = useBookingStore();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCanvasRef.current) {
      const ctx = qrCanvasRef.current.getContext("2d");
      if (ctx) {
        const size = 200;
        const blocks = 10;
        const blockSize = size / blocks;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = "#000000";
        for (let i = 0; i < blocks; i++) {
          for (let j = 0; j < blocks; j++) {
            if ((i + j) % 2 === 0 || Math.random() > 0.65) {
              ctx.fillRect(i * blockSize, j * blockSize, blockSize, blockSize);
            }
          }
        }
      }
    }
  }, []);

  const handleDownload = () => {
    alert("Ticket download started! (Demo)");
  };

  const handleShare = () => {
    alert("Share ticket via email/SMS (Demo)");
  };

  const handleNewBooking = () => {
    resetBooking();
    navigate("/");
  };

  if (!selectedTrain || selectedSeats.length === 0 || !bookingResult) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="flex flex-col items-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="w-16 h-16 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-2"
          >
            Booking Confirmed!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground"
          >
            Your booking was created through the live backend booking API.
          </motion.p>
        </motion.div>

        <FloatingCard className="overflow-hidden mb-6">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex justify-between items-start mb-4 gap-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Booking Reference</p>
                <p className="text-2xl font-bold">{bookingResult.booking_reference}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90 mb-1">Status</p>
                <p className="text-xl font-bold">{bookingResult.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Ticket className="w-4 h-4" />
              <span>Booking ID {bookingResult.booking_id}</span>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-4">{selectedTrain.train_name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="font-semibold">{from} to {to}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Journey Date</p>
                    <p className="font-semibold">{formatReadableDate(date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departure</p>
                    <p className="font-semibold">{selectedTrain.departure_time.slice(0, 5)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Seat</p>
                    <p className="font-semibold">{selectedSeats.join(", ")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">Passenger Details</h4>
              <div className="space-y-2">
                {passengers.map((passenger, index) => (
                  <div
                    key={passenger.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                  >
                    <div>
                      <p className="font-semibold">{passenger.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {passenger.gender} | {passenger.age} years
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 text-sm font-semibold">
                      {selectedSeats[index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-6 border-t border-border/50">
              <div className="text-center">
                <canvas
                  ref={qrCanvasRef}
                  width={200}
                  height={200}
                  className="rounded-2xl shadow-lg mb-3 mx-auto"
                />
                <p className="text-sm text-muted-foreground">
                  Scan this QR code for quick access
                </p>
              </div>
            </div>
          </div>
        </FloatingCard>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Ticket
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="py-3 px-6 rounded-2xl border-2 border-border/50 hover:border-border font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Ticket
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewBooking}
            className="py-3 px-6 rounded-2xl border-2 border-border/50 hover:border-border font-semibold transition-all flex items-center justify-center gap-2"
          >
            Book Another
          </motion.button>
        </div>
      </div>
    </div>
  );
}
