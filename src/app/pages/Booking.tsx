import { useEffect, useState } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Upload, CheckCircle } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface TimeSlot {
  time: string;
  totalSlots: number;
  bookedSlots: number;
}

interface Booking {
  id: string;
  date: string;
  timeSlot: string;
  verified: boolean;
  customerName: string;
  customerPhone: string;
  customerFacebook: string;
}

const TIME_SLOTS: TimeSlot[] = [
  { time: "09:00 AM", totalSlots: 3, bookedSlots: 0 },
  { time: "11:00 AM", totalSlots: 3, bookedSlots: 0 },
  { time: "01:00 PM", totalSlots: 3, bookedSlots: 0 },
  { time: "03:00 PM", totalSlots: 3, bookedSlots: 0 },
];

export default function Booking() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerFacebook: "",
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c/bookings`;
      console.log("Fetching bookings from:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Bookings data:", data);
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    }
  };

  const getTimeSlotsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dateBookings = bookings.filter(
      (b) => b.date === dateStr && b.verified
    );

    return TIME_SLOTS.map((slot) => {
      const bookedCount = dateBookings.filter((b) => b.timeSlot === slot.time).length;
      return {
        ...slot,
        bookedSlots: bookedCount,
        available: slot.totalSlots - bookedCount,
      };
    });
  };

  const isDateFullyBooked = (date: Date) => {
    const slots = getTimeSlotsForDate(date);
    return slots.every((slot) => slot.available === 0);
  };

  const handleSubmitBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !paymentFile) {
      alert("Please fill in all fields and upload payment proof");
      return;
    }

    setUploading(true);

    try {
      const bookingData = {
        date: format(selectedDate, "yyyy-MM-dd"),
        timeSlot: selectedTimeSlot,
        ...formData,
      };

      const bookingResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(bookingData),
        }
      );

      const bookingResult = await bookingResponse.json();

      if (!bookingResult.success) {
        throw new Error("Failed to create booking");
      }

      const formData2 = new FormData();
      formData2.append("file", paymentFile);
      formData2.append("bookingId", bookingResult.id);

      const uploadResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a4dcf20c/upload-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData2,
        }
      );

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error("Failed to upload payment proof");
      }

      setBookingSuccess(true);
      setShowBookingForm(false);
      setSelectedTimeSlot(null);
      setPaymentFile(null);
      setFormData({ customerName: "", customerPhone: "", customerFacebook: "" });
      fetchBookings();
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const timeSlots = selectedDate ? getTimeSlotsForDate(selectedDate) : [];

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-8 transition-colors">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Book a Tint Appointment</h1>

        {bookingSuccess && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="text-green-100">
              <p className="font-semibold">Booking submitted successfully!</p>
              <p className="text-sm text-green-200">
                Your booking will be confirmed once admin verifies your payment.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-red-600" />
                Select Date
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors text-gray-900 dark:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-gray-900 dark:text-white font-semibold min-w-[150px] text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors text-gray-900 dark:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}

              {calendarDays.map((day) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isFullyBooked = isDateFullyBooked(day);
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button
                    key={day.toString()}
                    onClick={() => {
                      if (isCurrentMonth && !isFullyBooked && !isPast) {
                        setSelectedDate(day);
                        setShowBookingForm(false);
                        setSelectedTimeSlot(null);
                      }
                    }}
                    disabled={!isCurrentMonth || isFullyBooked || isPast}
                    className={`
                      aspect-square rounded-lg text-sm transition-all
                      ${!isCurrentMonth ? "text-gray-400 dark:text-gray-700 cursor-default" : ""}
                      ${isPast && isCurrentMonth ? "text-gray-500 dark:text-gray-600 cursor-not-allowed" : ""}
                      ${isFullyBooked && isCurrentMonth && !isPast ? "bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-600 cursor-not-allowed" : ""}
                      ${isCurrentMonth && !isFullyBooked && !isPast ? "text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer" : ""}
                      ${isSelected ? "bg-red-600 text-white font-bold" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-800 rounded"></div>
                <span>Fully Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span>Selected</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-6">
            {!selectedDate ? (
              <div className="text-center py-16 text-gray-600 dark:text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p>Select a date to view available time slots</p>
              </div>
            ) : showBookingForm ? (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Booking Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-red-600"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-red-600"
                      placeholder="+63 123 456 7890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Facebook Profile Link
                    </label>
                    <input
                      type="url"
                      value={formData.customerFacebook}
                      onChange={(e) => setFormData({ ...formData, customerFacebook: e.target.value })}
                      className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2 focus:outline-none focus:border-red-600"
                      placeholder="https://facebook.com/yourname"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Upload Payment Proof (Downpayment)
                    </label>
                    <div className="border-2 border-dashed border-gray-400 dark:border-gray-700 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="payment-file"
                        accept="image/*"
                        onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label
                        htmlFor="payment-file"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {paymentFile ? paymentFile.name : "Click to upload payment proof"}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Your booking will be confirmed after admin verification
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowBookingForm(false);
                        setSelectedTimeSlot(null);
                      }}
                      className="flex-1 bg-gray-300 dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-3 rounded transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitBooking}
                      disabled={uploading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? "Submitting..." : "Confirm Booking"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Available Time Slots
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>

                <div className="space-y-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        setSelectedTimeSlot(slot.time);
                        setShowBookingForm(true);
                      }}
                      disabled={slot.available === 0}
                      className={`
                        w-full p-4 rounded-lg border transition-all text-left
                        ${slot.available === 0
                          ? "border-gray-300 dark:border-gray-800 bg-gray-200 dark:bg-gray-900/50 cursor-not-allowed opacity-50"
                          : "border-gray-400 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 hover:border-red-600 cursor-pointer"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-semibold">{slot.time}</span>
                        <span
                          className={`text-sm ${
                            slot.available === 0 ? "text-gray-500 dark:text-gray-600" : "text-red-600"
                          }`}
                        >
                          {slot.available === 0 ? "Fully Booked" : `${slot.available} spots left`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
