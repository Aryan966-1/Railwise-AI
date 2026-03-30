import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  ChevronRight,
  Lock,
  Shield,
} from "lucide-react";

import { FloatingCard } from "../components/ui/FloatingCard";
import { GlowButton } from "../components/ui/GlowButton";
import { bookTrain } from "../utils/backendApi";
import { useBookingStore } from "../utils/bookingStore";
import { currentUser } from "../utils/currentUser";

type PaymentMethod = "card" | "upi" | "netbanking" | "wallet";

export function Payment() {
  const navigate = useNavigate();
  const { selectedTrain, selectedSeats, passengers, updateBooking } = useBookingStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const totalPrice = selectedTrain ? selectedTrain.price * selectedSeats.length : 0;
  const convenienceFee = Math.round(totalPrice * 0.02);
  const finalAmount = totalPrice + convenienceFee;

  const paymentMethods = [
    { id: "card" as const, label: "Credit/Debit Card", icon: CreditCard },
    { id: "upi" as const, label: "UPI", icon: Smartphone },
    { id: "netbanking" as const, label: "Net Banking", icon: Building2 },
    { id: "wallet" as const, label: "Wallet", icon: Wallet },
  ];

  const handlePayment = async () => {
    if (!selectedTrain) {
      return;
    }

    setProcessing(true);
    setPaymentError("");

    try {
      const response = await bookTrain({
        train_id: selectedTrain.train_id,
        class_type: selectedTrain.class_type,
      });

      if (!response.booking) {
        throw new Error("Booking response did not include booking details.");
      }

      updateBooking({ bookingResult: response.booking });
      navigate("/confirmation");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!selectedTrain || selectedSeats.length === 0 || passengers.length === 0) {
    navigate("/passengers");
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">Payment</h2>
          <p className="text-muted-foreground">Secure and encrypted payment gateway</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <FloatingCard className="p-6">
              <h3 className="font-semibold mb-4">Select Payment Method</h3>
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <motion.button
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`
                        p-4 rounded-2xl border-2 transition-all text-left
                        ${paymentMethod === method.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                          : "border-border/50 hover:border-border"
                        }
                      `}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${
                        paymentMethod === method.id ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                      }`} />
                      <p className={`text-sm font-semibold ${
                        paymentMethod === method.id ? "text-blue-900 dark:text-blue-100" : ""
                      }`}>
                        {method.label}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </FloatingCard>

            <FloatingCard className="p-6">
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">Card Details</h3>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.number}
                      onChange={(event) => setCardDetails({ ...cardDetails, number: event.target.value })}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardDetails.name}
                      onChange={(event) => setCardDetails({ ...cardDetails, name: event.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiry}
                        onChange={(event) => setCardDetails({ ...cardDetails, expiry: event.target.value })}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        CVV
                      </label>
                      <input
                        type="password"
                        value={cardDetails.cvv}
                        onChange={(event) => setCardDetails({ ...cardDetails, cvv: event.target.value })}
                        placeholder="123"
                        maxLength={3}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "upi" && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">UPI Details</h3>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      placeholder="username@upi"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "netbanking" && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">Select Bank</h3>
                  <select className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                    <option>State Bank of India</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Punjab National Bank</option>
                  </select>
                </div>
              )}

              {paymentMethod === "wallet" && (
                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">Select Wallet</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {["Paytm", "PhonePe", "Google Pay", "Amazon Pay"].map((wallet) => (
                      <motion.button
                        key={wallet}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 rounded-xl border-2 border-border/50 hover:border-blue-500 transition-all text-center font-semibold"
                      >
                        {wallet}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </FloatingCard>

            {paymentError && (
              <FloatingCard className="p-4 border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300">
                {paymentError}
              </FloatingCard>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>100% Secure</span>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <FloatingCard className="p-6 sticky top-24">
              <h3 className="font-semibold mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Train</p>
                  <p className="font-semibold">{selectedTrain.train_name}</p>
                  <p className="text-xs text-muted-foreground">Train #{selectedTrain.train_id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Seat</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seat) => (
                      <span key={seat} className="px-2 py-1 rounded-lg bg-muted/50 text-sm">
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Passengers</p>
                  <p className="font-semibold">{passengers.length}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Booking API payload</p>
                  <p className="text-xs text-muted-foreground">
                    auth user: {currentUser.name} #{currentUser.id}, train_id: {selectedTrain.train_id}, class_type: {selectedTrain.class_type}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ticket Price</span>
                    <span>Rs {totalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Convenience Fee</span>
                    <span>Rs {convenienceFee}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border/50">
                    <span>Total Amount</span>
                    <span>Rs {finalAmount}</span>
                  </div>
                </div>
              </div>

              <GlowButton
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <CreditCard className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    Pay Rs {finalAmount}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </GlowButton>
            </FloatingCard>
          </div>
        </div>
      </div>
    </div>
  );
}
