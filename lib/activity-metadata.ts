import type { Activity } from "./types";

/** Existing facts only; no inferred address, price, travel time or invented date. */
export function activityMetadata(activity: Activity) {
  const place = activity.venueData?.name || activity.fixture?.area || activity.venue || activity.city;
  const date = activity.discovery ? (activity.discovery.timing ? `Suggested: ${activity.discovery.timing}` : undefined) : activity.start && !Number.isNaN(Date.parse(activity.start))
    ? new Intl.DateTimeFormat("en-US", {timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"}).format(new Date(activity.start))
    : undefined;
  const cost = activity.discovery ? activity.venueData?.price : activity.budgetKnown === false ? undefined : activity.venueData?.price || (activity.budget ? `Est. $${activity.budget} / person` : "Free");
  return {place, date, cost, address: activity.venueData?.address};
}
