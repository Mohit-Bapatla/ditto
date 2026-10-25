# Voiceover timing

Silent master: 180 seconds. Start narration at 00:00. No sentences omitted or rewritten. Record each section separately, leaving a short breath at its end. The total script is 447 words (149 wpm overall). Sections 2, 5 and 7 need a clear, moderately brisk delivery. No music or audio is embedded.

## 0:00–0:30 · Problem
71 words · 142 words/minute

Everyone knows how this goes. You and your friends want to hang out, but nobody knows what to do. Someone suggests food, someone else wants to go bowling, and eventually the group chat goes quiet.

The problem isn't that we don't want to spend time together. It's that actually making plans takes way too much effort.

That's why we built Ditto, essentially Tinder for discovering activities and making plans with friends.

## 0:30–0:55 · Discover
68 words · 163 words/minute

First, there's Discover. Whether you're looking for something to do yourself or with friends, Ditto lets you explore activities around you, from pickleball and bouldering to restaurants and arcade nights.

You can filter by interests, check details like location and cost, and simply swipe right to Ditto something you like or left to pass.

Activities you're interested in are saved so you can come back to them later.

## 0:55–1:20 · AI group planning
63 words · 151 words/minute

But Ditto really comes together when you bring your friends in.

Create a Circle, invite your friends, and start talking about what everyone wants to do.

Using Meta's Muse Spark, Ditto understands the conversation, identifies preferences, and turns everyone's scattered ideas into activities the group can actually consider.

Instead of spending forever debating in a group chat, you've got options ready to go.

## 1:20–1:45 · Multiplayer consensus
60 words · 144 words/minute

Now everyone gets to vote independently. Maybe I want to go bouldering, Edwin prefers pickleball, and Paxton's open to both.

We swipe through the suggestions, and Ditto brings our decisions together to find activities we all agree on.

Once there's a match, we can turn that shared interest into a proposed plan instead of leaving it buried in the chat.

## 1:45–2:00 · Confirming the plan
42 words · 168 words/minute

From there, everyone can review and approve the plan, coordinate the details, and see what's coming up in the weekly calendar.

You can even add confirmed plans to your personal calendar.

What started as 'we should hang out' becomes an actual plan.

## 2:00–2:30 · AI architecture
63 words · 126 words/minute

AI isn't just a chatbot attached to Ditto. It's part of how the planning experience works.

Meta's Muse Spark interprets natural conversations, understands different preferences, and transforms unstructured discussions into actionable activity suggestions.

We also integrated SerpApi to retrieve real-world venue and location information, helping connect those recommendations to actual places nearby.

Together, they make finding something everyone wants to do much easier.

## 2:30–3:00 · Technology and closing
80 words · 160 words/minute

We built Ditto using Next.js, React, TypeScript, and SQLite, with Railway hosting, Meta's Muse Spark for AI-powered planning, and SerpApi for location-based discovery.

We developed persistent Circles, multiplayer voting, swipe gestures across mobile and desktop, and a complete workflow from activity discovery to group approvals and calendar integration.

Our goal wasn't to create another app that keeps people scrolling.

It was to help people put their phones down and actually spend time together.

This is Ditto. Less scrolling. More doing.

## Revised visual alignment

The narration above is unchanged. Keep its original approximate section boundaries; the connected UI leads some lines by a few seconds rather than cutting away from navigation. Discover begins at 0:20 under the product introduction. Filters appear around 0:30; the left/right swipes follow, then details and the actual Circles tap. Weekend Crew opens at 0:50, the Muse request at about 1:03, independent votes at 1:14, consensus at 1:32, final approval at 1:49, calendar at 1:54, and export at 2:01. Architecture appears alongside the calendar at 2:03, technology at 2:30, and the final logo at 2:55.

For recording, let the AI explanation begin over the final calendar/export before the diagram appears. This keeps the full navigation legible without rushing the spoken section. The final five seconds remain reserved for “This is Ditto. Less scrolling. More doing.”

For a narration WAV exactly aligned from zero: `ffmpeg -i ditto-demo-silent.mp4 -i narration.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t 180 -movflags +faststart ditto-demo-narrated.mp4`. Record and review before publication.
