# Vapi Voice Agent Configuration

## Account
- **Email:** openclawace@gmail.com
- **Org ID:** 759c09d2-3df8-45c1-8f69-aa287ff1ee62
- **Public Key:** 5809d611-635d-4094-bf57-0036e902d1f6
- **Private Key:** c1924f22-6ccd-4a19-8174-1072ee8d5bc8

## Assistant
- **Name:** AI Tools NZ Voice Receptionist
- **ID:** 652504ee-f927-49d2-be6a-b58e498f28aa
- **Model:** gpt-4o-mini (OpenAI)
- **Voice:** ElevenLabs (Lily - pFZP5JQG7iQjIQuC4Bku)
- **Transcriber:** Deepgram Nova 3 (en-NZ)

## Phone Numbers
- **Free US Number:** +1 (775) 540-0608
  - ID: 36940b14-7f4b-434c-b672-f5399e28cc5d
  - Provider: vapi
  - Status: activating → active
  - Linked to assistant: 652504ee-f927-49d2-be6a-b58e498f28aa

## NZ Number Setup
- Anthony's spare NZ number: +64 21 039 0602
- This is a regular mobile SIM — cannot be imported into Vapi/Twilio directly
- **Option 1:** Set up unconditional call forwarding from NZ mobile to US Vapi number
  - Vodafone NZ: Dial *21*+17755400608# to enable forwarding
  - 2degrees: Dial **21*+17755400608# to enable forwarding
- **Option 2:** Buy a Twilio NZ number (~$1/mo) and import to Vapi
  - Requires Twilio account, regulatory bundle, 2-3 days approval
- **Option 3:** Use US number directly on website (international call charges for NZ callers)

## API Examples
```bash
# List assistants
curl -s https://api.vapi.ai/assistant -H "Authorization: Bearer c1924f22-6ccd-4a19-8174-1072ee8d5bc8"

# List phone numbers
curl -s https://api.vapi.ai/phone-number -H "Authorization: Bearer c1924f22-6ccd-4a19-8174-1072ee8d5bc8"

# Update assistant
curl -s -X PATCH https://api.vapi.ai/assistant/652504ee-f927-49d2-be6a-b58e498f28aa \
  -H "Authorization: Bearer c1924f22-6ccd-4a19-8174-1072ee8d5bc8" \
  -H "Content-Type: application/json" \
  -d '{"firstMessage": "New greeting"}'
```
