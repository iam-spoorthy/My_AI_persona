// -- /api/booking/slots/route.ts
// -- Cal.com nundi available interview slots fetch chese endpoint
// -- frontend BookingWidget ee endpoint call chesi user ki slots chupistundi

import { NextResponse } from "next/server";
import { getAvailableSlots, formatSlotsForDisplay } from "@/lib/calcom";

// -- GET /api/booking/slots -- next 7 days lo available times return chestundi
export async function GET() {
  try {
    const slots = await getAvailableSlots();

    return NextResponse.json({
      slots,                                    // -- raw slots (BookingWidget kosam)
      formatted: formatSlotsForDisplay(slots),  // -- readable text (chat message kosam)
    });
  } catch (error: any) {
    console.error("Slots API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch slots", details: error.message },
      { status: 500 }
    );
  }
}
