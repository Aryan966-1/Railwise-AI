import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight, Plus, Trash2, User } from 'lucide-react';
import { FloatingCard } from '../components/ui/FloatingCard';
import { GlowButton } from '../components/ui/GlowButton';
import { useBookingStore } from '../utils/bookingStore';

interface Passenger {
  id: string;
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other';
}

export function PassengerDetails() {
  const navigate = useNavigate();
  const { selectedSeats, selectedTrain, updateBooking } = useBookingStore();
  
  const [passengers, setPassengers] = useState<Passenger[]>(() => 
    selectedSeats.map((_, index) => ({
      id: `p${index}`,
      name: '',
      age: '',
      gender: 'male' as const
    }))
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePassengerChange = (id: string, field: keyof Passenger, value: string) => {
    setPassengers(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
    // Clear error for this field
    setErrors(prev => ({ ...prev, [`${id}-${field}`]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    passengers.forEach(p => {
      if (!p.name.trim()) {
        newErrors[`${p.id}-name`] = 'Name is required';
      }
      if (!p.age || parseInt(p.age) < 1 || parseInt(p.age) > 120) {
        newErrors[`${p.id}-age`] = 'Valid age is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateBooking({ passengers });
      navigate('/payment');
    }
  };

  if (!selectedTrain || selectedSeats.length === 0) {
    navigate('/seats');
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">Passenger Details</h2>
          <p className="text-muted-foreground">
            Enter details for {selectedSeats.length} passenger{selectedSeats.length > 1 ? 's' : ''}
          </p>
        </motion.div>

        <FloatingCard className="p-8 mb-6">
          <div className="space-y-6">
            {passengers.map((passenger, index) => (
              <motion.div
                key={passenger.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-muted/30 border border-border/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">Passenger {index + 1}</h4>
                      <p className="text-xs text-muted-foreground">Seat: {selectedSeats[index]}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={passenger.name}
                      onChange={(e) => handlePassengerChange(passenger.id, 'name', e.target.value)}
                      placeholder="Enter full name"
                      className={`
                        w-full px-4 py-3 rounded-xl bg-background border 
                        ${errors[`${passenger.id}-name`] ? 'border-red-500' : 'border-border/50'}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                        outline-none transition-all
                      `}
                    />
                    {errors[`${passenger.id}-name`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`${passenger.id}-name`]}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Age
                    </label>
                    <input
                      type="number"
                      value={passenger.age}
                      onChange={(e) => handlePassengerChange(passenger.id, 'age', e.target.value)}
                      placeholder="Age"
                      min="1"
                      max="120"
                      className={`
                        w-full px-4 py-3 rounded-xl bg-background border 
                        ${errors[`${passenger.id}-age`] ? 'border-red-500' : 'border-border/50'}
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                        outline-none transition-all
                      `}
                    />
                    {errors[`${passenger.id}-age`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`${passenger.id}-age`]}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="md:col-span-3">
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Gender
                    </label>
                    <div className="flex gap-3">
                      {['male', 'female', 'other'].map((gender) => (
                        <motion.button
                          key={gender}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePassengerChange(passenger.id, 'gender', gender)}
                          className={`
                            flex-1 px-6 py-3 rounded-xl transition-all capitalize
                            ${passenger.gender === gender
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : 'bg-muted/50 hover:bg-muted'
                            }
                          `}
                        >
                          {gender}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Smart Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900"
          >
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Quick Tip
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Make sure all names match government-issued IDs. You'll need to show ID proof during your journey.
                </p>
              </div>
            </div>
          </motion.div>
        </FloatingCard>

        {/* Continue Button */}
        <GlowButton
          onClick={handleContinue}
          className="w-full"
        >
          <>
            Continue to Payment
            <ChevronRight className="w-5 h-5 ml-2" />
          </>
        </GlowButton>
      </div>
    </div>
  );
}