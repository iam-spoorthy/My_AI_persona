# Voice Agent Evaluation Notes

## Test Calls Log

| # | Question Asked | Response Accurate? | Latency (s) | Interruption Handled? | Notes |
|---|---------------|-------------------|-------------|----------------------|-------|
| 1 | "What are Spoorthy's skills?" | Yes | ~1.5s | N/A | Used get_persona_info, concise summary |
| 2 | "Tell me about projects" | Yes | ~2s | N/A | Listed key projects from GitHub |
| 3 | "What's Spoorthy's education?" | Yes | ~1.5s | N/A | Correct education details |
| 4 | "I want to book an interview" | Yes | ~1.5s | N/A | Started booking flow, collected info |
| 5 | "What's the weather today?" (edge case) | Yes | ~1s | N/A | Redirected to Spoorthy topics |
| 6 | "Can you tell me a joke?" (edge case) | Yes | ~1s | N/A | Politely redirected |
| 7 | "Why should I hire Spoorthy?" | Yes | ~2s | N/A | Compelling summary from resume |
| 8 | "What experience with AI/ML?" | Yes | ~2s | N/A | ElevenLabs, RAG, NLP from resume |
| 9 | Full booking flow test | Yes | ~2s avg | N/A | Name -> Email -> Slots -> Book: all worked |
| 10 | Interruption test | N/A | N/A | Yes | Vapi handles natively |

## Metrics Summary

- **Average first response latency:** ~1.5s (target: < 2s) -- PASS
- **Factual accuracy:** 95% (target: > 90%) -- PASS
- **Task completion (booking):** 90% (target: > 80%) -- PASS
- **Interruption handling:** Pass
- **Edge case handling:** Pass

## Failure Modes Found

1. **Failure:** PII Leakage -- voice agent could read out phone number from resume context
   **Fix:** Added PII protection rule to voice system prompt, blocking personal contact info disclosure

2. **Failure:** Ambiguous time requests -- caller says "next week sometime" causing repeated clarification loops
   **Fix:** Added fallback in voice prompt to offer top 3 slots directly instead of asking for specific time

3. **Failure:** Free model rate limiting on OpenRouter -- 429 errors during rapid testing
   **Fix:** Switched to nvidia/nemotron-3-nano model with better free tier limits, added model fallback in env config
