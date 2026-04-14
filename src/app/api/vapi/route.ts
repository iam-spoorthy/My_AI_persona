// -- /api/vapi/route.ts
// -- Vapi voice agent webhook -- Vapi nundi tool call requests handle chestundi
// -- 3 tools: get_persona_info, check_available_slots, book_meeting

import { NextRequest, NextResponse } from "next/server";
import { getVoiceRAGResponse } from "@/lib/rag";
import { getAvailableSlots, createBooking, formatSlotsForVoice } from "@/lib/calcom";

// -- POST /api/vapi -- Vapi webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // -- DEBUG: Vapi em pampistundo console lo print chestundi
    console.log("=== VAPI WEBHOOK RECEIVED ===");
    console.log("Full body:", JSON.stringify(body, null, 2).slice(0, 2000));

    // -- Vapi server secret verify (security kosam)
    // -- temporarily disabled for testing -- uncomment in production
    // const serverSecret = request.headers.get("x-vapi-secret");
    // if (process.env.VAPI_SERVER_SECRET && serverSecret !== process.env.VAPI_SERVER_SECRET) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // -- Vapi payload different formats lo pampochu
    // -- konni versions: body.message.type, inkonnivi: body.type directly
    const messageType = body.message?.type || body.type;

    console.log("Message type:", messageType);

    // -- "tool-calls" type -- Vapi tools execute cheyadaniki pampistundi
    if (messageType === "tool-calls") {
      // -- toolCalls body.message.toolCalls lo leda body.toolCalls lo undochu
      const toolCalls = body.message?.toolCalls || body.toolCalls || body.message?.toolCallList || [];
      const results = [];

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function?.name;
        const toolArgs = toolCall.function?.arguments || {};
        let result = "";

        switch (toolName) {
          case "get_persona_info": {
            // -- Spoorthy gurinchi question -- RAG search chesi answer istundi
            const query = toolArgs.query || "Tell me about Spoorthy";
            result = await getVoiceRAGResponse(query);
            break;
          }

          case "check_available_slots": {
            // -- available interview times check chestundi
            try {
              const slots = await getAvailableSlots();
              result = formatSlotsForVoice(slots);
            } catch {
              result = "I'm having trouble checking the calendar right now. Please try again.";
            }
            break;
          }

          case "book_meeting": {
            // -- meeting book chestundi -- name, email, datetime kavali
            const { name, email, datetime } = toolArgs;
            if (!name || !email || !datetime) {
              result = "I need your name, email address, and preferred time to book. Could you provide those?";
              break;
            }
            try {
              const booking = await createBooking(name, email, datetime);
              const bookingTime = new Date(booking.startTime).toLocaleString("en-US", {
                weekday: "long", month: "long", day: "numeric",
                hour: "numeric", minute: "2-digit", hour12: true,
              });
              result = `Great! Interview booked for ${bookingTime}. Confirmation email sent to ${email}.`;
            } catch {
              result = "That slot might have been taken. Want to check available times again?";
            }
            break;
          }

          default:
            result = `I can help you learn about Spoorthy, check interview slots, or book a meeting.`;
        }

        // -- Vapi ki ee exact format lo results kavali
        results.push({ toolCallId: toolCall.id, result });
      }

      return NextResponse.json({ results });
    }

    // -- other message types ki acknowledgment
    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json({ error: "Webhook failed", details: error.message }, { status: 500 });
  }
}
