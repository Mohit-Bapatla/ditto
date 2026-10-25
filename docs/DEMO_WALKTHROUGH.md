# 2–3 minute Ditto demo

Public app: https://ditto-production.up.railway.app/

Prepare four independent browsers/private profiles named Alex, Jordan, Maya and Sam. Separate tabs in one browser normally share a session; they do **not** represent separate people. Keep the local fixture demo separate from the live production demo.

## Setup before recording

1. Each browser: **Profile → Create your personal profile**. Enter name and Austin, TX; optional interests/budget may be skipped. There is no personality quiz.
2. Alex: **Circles → Create a Circle**, name it Saturday Crew, city Austin, budget $30. **Copy invite link** and open it in each other browser. Save personal profile if prompted, then **Join Circle**.
3. Add **Korean BBQ** (Food) and **Bowling** (Games) as separate members. Under **Chat & AI**, Sam saves “Prefer under $30; flag any combined cost above this.” Maya saves “Available after 5 PM; confirm the date.”
4. Start a **Go with the majority** round. All four vote Ditto for Korean BBQ. Alex, Jordan, Maya vote Ditto for Bowling; Sam passes. Results must be 4/4 dinner and 3/4 bowling, never falsely unanimous bowling.
5. Prepare chat messages: Alex “Anyone down for volleyball Saturday?”; Jordan “I'm down.”; Maya “I can't until 5.”; Sam “Works for me.” No test auto-confirms attendance.

## Recording sequence

**0:00–0:25 — Problem.** “Our group chats are full of intentions. Ditto helps those intentions become time together.” Show Discover and a right swipe. Interest is separate from joining. Public activities are user-created; venue search results are not meetups. Demo seed activities are visibly fictional.

**0:25–1:05 — Everyone has a voice.** Show the four sessions and completed round. Click **Reveal your matches**. Explain the difference between 4/4 agreement and a 3/4 majority.

**1:05–1:35 — AI in the conversation.** **Chat & AI**: select the four messages, check the consent box, then **Suggest with Muse Spark**. Wait for a real result. Show its cited evidence and missing details. Edit the title/timing if needed; choose **Approve adding to Ideas**. This adds an idea for the next round, never an event or RSVP. The sample-extraction button is an explicitly labeled fixed fixture, not live AI.

**1:35–2:10 — A real-world plan.** Go back to **Matches → Plan our hangout**. Set a sensible future local date/time. Select **Dinner + Activity** and check Korean BBQ and Bowling. Click **Plan with Meta AI + real places**. Explain that real SerpApi IDs/addresses and any returned driving durations ground the output. Open **Why this plan?** to show stored vote counts. Acknowledge budget/hour uncertainties. If needed, use **Edit plan**; all approvals must be renewed afterward.

**2:10–2:35 — Human commitment.** Approve from all four browsers. After three approvals, it remains proposed. After four, it says Group approved. Each person chooses **RSVP · I'm going**. Download **Add to Calendar**. No invitation or reservation is sent automatically.

**2:35–2:50 — Technical explanation.** “Muse Spark handles intent and planning, SerpApi supplies real places and travel, SQLite persists the collaboration, and five-second polling keeps separate people in sync. AI proposes; the group decides.”

## Reliable fallback

If live providers fail, state that clearly and choose **Create a labeled demo draft**. For Autopilot, the fixed sample button requires the exact sample volleyball message above; select it plus Maya's exact “I can't until 5.” message. The UI says no AI. Do not edit a recording to imply this was live inference.

## Before submission

Confirm the public URL loads, repository visibility is public after the user changes it, and no secrets/private session snapshots are included. Keep the provider call budget bounded; reuse the completed Circle for rehearsal rather than generating repeated paid plans. Record the final video manually and truthfully.
