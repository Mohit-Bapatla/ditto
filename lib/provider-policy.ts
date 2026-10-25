import { PublicError } from "./errors";
export const liveProvidersEnabled = () =>
  process.env.ALLOW_LIVE_PROVIDERS === "true";
export function requireLiveProviders() {
  if (!liveProvidersEnabled())
    throw new PublicError(
      "Live providers are paused pending explicit activation. Use the labeled demo workflow; no API request was sent.",
    );
}
