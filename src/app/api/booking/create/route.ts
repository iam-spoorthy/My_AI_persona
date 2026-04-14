// -- /api/booking/create/route.ts
// -- Cal.com lo meeting book chese endpoint
// -- user name, email, time select chesaka ee endpoint call avthundi

import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/calcom";

// -- POST /api/booking/create -- meeting book chestundi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, startTime } = body;

    // -- required fields validate
    if (!name || !email || !startTime) {
      return NextResponse.json({ error: "name, email, and startTime required" }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // -- Cal.com lo booking create
    const booking = await createBooking(name, email, startTime);

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        uid: booking.uid,
        title: booking.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        meetingUrl: booking.meetingUrl,
        status: booking.status,
      },
      message: `Interview booked! Confirmation email sent to ${email}.`,
    });
  } catch (error: any) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: "Failed to create booking", details: error.message },
      { status: 500 }
    );
  }
}
