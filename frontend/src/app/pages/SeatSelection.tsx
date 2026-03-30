import { Fragment, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Check } from "lucide-react";

import { FloatingCard } from "../components/ui/FloatingCard";
import { useBookingStore } from "../utils/bookingStore";

const ROWS = 18;
const SEATS_PER_ROW = 6;

type SeatStatus = "available" | "booked" | "selected";

function buildSeatMap(availableSeats: number) {
  const initial: Record<string, SeatStatus> = {};
  let remainingAvailableSeats = Math.max(0, Math.min(availableSeats, ROWS * SEATS_PER_ROW));

  for (let row = 1; row <= ROWS; row++) {
    for (let col = 1; col <= SEATS_PER_ROW; col++) {
      const seatId = `${row}${String.fromCharCode(64 + col)}`;
      initial[seatId] = remainingAvailableSeats > 0 ? "available" : "booked";
      remainingAvailableSeats -= 1;
    }
  }

  return initial;
}

export function SeatSelection() {
  const navigate = useNavigate();
  const { selectedTrain, selectedSeats, updateBooking } = useBookingStore();
  const [seats, setSeats] = useState<Record<string, SeatStatus>>(() => {
    const initial = buildSeatMap(selectedTrain?.available_seats ?? 0);
    selectedSeats.forEach((seatId) => {
      initial[seatId] = "selected";
    });
    return initial;
  });

  const handleSeatClick = (seatId: string) => {
    if (seats[seatId] === "booked") {
      return;
    }

    setSeats((previousSeats) => {
      const nextSeats: Record<string, SeatStatus> = {};

      Object.entries(previousSeats).forEach(([existingSeatId, status]) => {
        nextSeats[existingSeatId] = status === "selected" ? "available" : status;
      });

      nextSeats[seatId] = previousSeats[seatId] === "selected" ? "available" : "selected";
      return nextSeats;
    });
  };

  const handleContinue = () => {
    const selected = Object.keys(seats).filter((id) => seats[id] === "selected");
    updateBooking({ selectedSeats: selected });
    navigate("/passengers");
  };

  const selectedCount = Object.values(seats).filter((status) => status === "selected").length;
  const totalPrice = selectedTrain ? selectedTrain.price * selectedCount : 0;

  const getSeatColor = (status: SeatStatus) => {
    switch (status) {
      case "available":
        return "bg-muted/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-border/50";
      case "booked":
        return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800 cursor-not-allowed";
      case "selected":
        return "bg-gradient-to-br from-blue-500 to-purple-600 border-blue-500 text-white";
      default:
        return "";
    }
  };

  if (!selectedTrain) {
    navigate("/trains");
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">Select Your Seat</h2>
          <p className="text-muted-foreground">
            {selectedTrain.train_name} | Train #{selectedTrain.train_id} | Class {selectedTrain.class_type}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FloatingCard className="p-8">
              <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-muted/50 border border-border/50" />
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600" />
                  <span className="text-sm">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800" />
                  <span className="text-sm">Booked</span>
                </div>
              </div>

              <div className="space-y-3">
                {Array.from({ length: ROWS }).map((_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-3">
                    <span className="w-8 text-sm text-muted-foreground text-center">
                      {rowIndex + 1}
                    </span>
                    <div className="flex gap-2">
                      {Array.from({ length: SEATS_PER_ROW }).map((_, colIndex) => {
                        const seatId = `${rowIndex + 1}${String.fromCharCode(65 + colIndex)}`;
                        const status = seats[seatId];
                        const isMiddleAisle = colIndex === 2;

                        return (
                          <Fragment key={colIndex}>
                            <motion.button
                              whileHover={status !== "booked" ? { scale: 1.1 } : {}}
                              whileTap={status !== "booked" ? { scale: 0.95 } : {}}
                              onClick={() => handleSeatClick(seatId)}
                              className={`
                                w-12 h-12 rounded-xl border-2 transition-all relative
                                ${getSeatColor(status)}
                              `}
                              disabled={status === "booked"}
                            >
                              <span className="text-xs font-semibold">
                                {String.fromCharCode(65 + colIndex)}
                              </span>
                              {status === "selected" && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute inset-0 flex items-center justify-center"
                                >
                                  <Check className="w-5 h-5" />
                                </motion.div>
                              )}
                            </motion.button>
                            {isMiddleAisle && <div className="w-4" />}
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </FloatingCard>
          </div>

          <div className="lg:col-span-1">
            <FloatingCard className="p-6 sticky top-24">
              <h3 className="font-semibold mb-6">Booking Summary</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Selected Seats</p>
                  <p className="text-2xl font-bold">{selectedCount}</p>
                </div>

                {selectedCount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Seat Number</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(seats)
                        .filter((id) => seats[id] === "selected")
                        .map((seatId) => (
                          <span
                            key={seatId}
                            className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm"
                          >
                            {seatId}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Price per seat</span>
                    <span className="font-semibold">Rs {selectedTrain.price}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Class</span>
                    <span className="font-semibold">{selectedTrain.class_type}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border/50">
                    <span>Total</span>
                    <span>Rs {totalPrice}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Current backend booking creates one confirmed booking per API call, so seat selection is limited to one seat here.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinue}
                disabled={selectedCount === 0}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              {selectedCount === 0 && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Please select one seat to continue
                </p>
              )}
            </FloatingCard>
          </div>
        </div>
      </div>
    </div>
  );
}
