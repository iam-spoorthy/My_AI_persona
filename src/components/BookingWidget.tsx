// -- BookingWidget.tsx -- calendar slot picker + booking form
// -- user slot select chesi, name/email enter chesi, meeting book chestundi

"use client";

import { useState, useEffect } from "react";

interface BookingWidgetProps {
  onClose: () => void; // -- widget close cheyadaniki
}

interface SlotsByDate {
  [date: string]: { time: string }[];
}

export default function BookingWidget({ onClose }: BookingWidgetProps) {
  // -- state management
  const [slots, setSlots] = useState<SlotsByDate>({}); // -- available slots data
  const [selectedDate, setSelectedDate] = useState<string>(""); // -- user select chesina date
  const [selectedSlot, setSelectedSlot] = useState<string>(""); // -- user select chesina time slot
  const [name, setName] = useState(""); // -- user peru
  const [email, setEmail] = useState(""); // -- user email
  const [loading, setLoading] = useState(true); // -- slots loading state
  const [booking, setBooking] = useState(false); // -- booking in progress state
  const [confirmed, setConfirmed] = useState<string | null>(null); // -- booking confirmation message
  const [error, setError] = useState<string | null>(null);

  // -- component mount ayinapudu slots fetch chestundi
  useEffect(() => {
    fetchSlots();
  }, []);

  // -- /api/booking/slots nundi available times fetch chese function
  async function fetchSlots() {
    try {
      setLoading(true);
      const res = await fetch("/api/booking/slots");
      const data = await res.json();
      if (data.slots) {
        setSlots(data.slots);
        // -- first available date auto-select chestundi
        const dates = Object.keys(data.slots);
        if (dates.length > 0) setSelectedDate(dates[0]);
      }
    } catch {
      setError("Failed to load available slots");
    } finally {
      setLoading(false);
    }
  }

  // -- booking create chese function -- form submit ayinapudu call avthundi
  async function handleBooking() {
    if (!name || !email || !selectedSlot) {
      setError("Please fill all fields and select a time");
      return;
    }

    try {
      setBooking(true);
      setError(null);
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, startTime: selectedSlot }),
      });
      const data = await res.json();

      if (data.success) {
        setConfirmed(data.message);
      } else {
        setError(data.error || "Booking failed");
      }
    } catch {
      setError("Failed to create booking");
    } finally {
      setBooking(false);
    }
  }

  // -- dates list (available slots unna dates)
  const availableDates = Object.keys(slots).filter((d) => slots[d]?.length > 0);

  return (
    <div className="animate-fade-in bg-gray-800 rounded-xl p-4 mx-4 my-2 border border-gray-700">
      {/* -- header + close button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Book an Interview</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
      </div>

      {/* -- booking confirmed state */}
      {confirmed ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">&#10003;</div>
          <p className="text-green-400 font-medium">{confirmed}</p>
          <button onClick={onClose} className="mt-3 px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600">
            Close
          </button>
        </div>
      ) : loading ? (
        <p className="text-gray-400 text-center py-4">Loading available slots...</p>
      ) : (
        <>
          {/* -- date tabs -- available dates chupistundi */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {availableDates.map((date) => {
              const d = new Date(date);
              const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              return (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setSelectedSlot(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    selectedDate === date ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* -- time slots grid -- selected date ki slots chupistundi */}
          {selectedDate && slots[selectedDate] && (
            <div className="grid grid-cols-4 gap-1.5 mb-3 max-h-32 overflow-y-auto">
              {slots[selectedDate].slice(0, 16).map((slot) => {
                const time = new Date(slot.time).toLocaleTimeString("en-US", {
                  hour: "numeric", minute: "2-digit", hour12: true,
                });
                return (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`px-2 py-1.5 rounded text-xs transition-colors ${
                      selectedSlot === slot.time
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}

          {/* -- name + email form -- slot select chesaka form chupistundi */}
          {selectedSlot && (
            <div className="space-y-2 mb-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* -- error message */}
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

          {/* -- book button */}
          {selectedSlot && name && email && (
            <button
              onClick={handleBooking}
              disabled={booking}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              {booking ? "Booking..." : "Confirm Booking"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
