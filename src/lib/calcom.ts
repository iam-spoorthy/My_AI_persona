// -- calcom.ts
// -- Cal.com API v2 wrapper -- slots check + meetings book cheyadaniki
// -- chat booking route and vapi webhook lo ee functions use avthay

const CALCOM_API = "https://api.cal.com/v2";

// -- Cal.com API request headers -- authorization and version
function getCalHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
    "cal-api-version": "2024-08-13",
  };
}

export interface TimeSlot {
  time: string; // -- ISO 8601 format (e.g., "2024-04-15T10:00:00Z")
}

export interface BookingConfirmation {
  id: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
  status: string;
}

// -- Next 7 days lo available interview slots fetch chestundi
export async function getAvailableSlots(
  startDate?: string,
  endDate?: string
): Promise<Record<string, TimeSlot[]>> {
  const now = new Date();
  const start = startDate || now.toISOString().split("T")[0];
  const end = endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const eventTypeId = process.env.CALCOM_EVENT_TYPE_ID;
  if (!eventTypeId) throw new Error("CALCOM_EVENT_TYPE_ID not set");

  // -- Cal.com /slots/available endpoint -- date range lo open times return chestundi
  const url = `${CALCOM_API}/slots/available?eventTypeId=${eventTypeId}&startTime=${start}T00:00:00Z&endTime=${end}T23:59:59Z`;
  const response = await fetch(url, { method: "GET", headers: getCalHeaders() });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cal.com slots error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data?.slots || {};
}

// -- Cal.com lo meeting book chestundi -- name, email, time teskuni booking create chestundi
export async function createBooking(
  name: string,
  email: string,
  startTime: string,
  notes?: string
): Promise<BookingConfirmation> {
  const eventTypeId = process.env.CALCOM_EVENT_TYPE_ID;
  if (!eventTypeId) throw new Error("CALCOM_EVENT_TYPE_ID not set");

  const response = await fetch(`${CALCOM_API}/bookings`, {
    method: "POST",
    headers: getCalHeaders(),
    body: JSON.stringify({
      eventTypeId: Number(eventTypeId),
      start: startTime,
      attendee: { name, email, timeZone: "Asia/Kolkata" },
      metadata: { source: "ai-persona", notes: notes || "Booked via AI Persona" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cal.com booking error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data;
}

// -- Slots ni readable text ga format chestundi -- chat UI kosam
export function formatSlotsForDisplay(slots: Record<string, TimeSlot[]>): string {
  const lines: string[] = [];
  for (const [date, timeSlots] of Object.entries(slots)) {
    if (timeSlots.length === 0) continue;
    const dateStr = new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const times = timeSlots.slice(0, 5).map((slot) =>
      new Date(slot.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    );
    lines.push(`${dateStr}: ${times.join(", ")}`);
  }
  return lines.length > 0 ? lines.join("\n") : "No available slots found.";
}

// -- Slots ni voice-friendly format lo -- Vapi agent kosam (speakable text)
export function formatSlotsForVoice(slots: Record<string, TimeSlot[]>): string {
  const parts: string[] = [];
  for (const [date, timeSlots] of Object.entries(slots)) {
    if (timeSlots.length === 0) continue;
    const dateStr = new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const times = timeSlots.slice(0, 3).map((slot) =>
      new Date(slot.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    );
    const timeStr = times.length > 1 ? `${times.slice(0, -1).join(", ")}, and ${times[times.length - 1]}` : times[0];
    parts.push(`${dateStr} at ${timeStr}`);
  }
  return parts.length > 0
    ? `I have openings on ${parts.slice(0, 3).join(". Also on ")}. Which time works best for you?`
    : "No available slots right now. Please try again later.";
}
