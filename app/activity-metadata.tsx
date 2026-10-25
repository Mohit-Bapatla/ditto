import type { Activity } from "@/lib/types";
import { activityMetadata } from "@/lib/activity-metadata";
export function ActivityMetadata({activity}: {activity: Activity}) {
  const {place, date, cost} = activityMetadata(activity);
  return <div className="activity-metadata">{place && <p>{place}</p>}<p>{[date, cost].filter(Boolean).join(" · ")}</p></div>;
}
