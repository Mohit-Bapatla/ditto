export type Person = {
  id: string;
  name: string;
  avatar: string;
  city: string;
  interests: string[];
  budget: number;
  demo: boolean;
};
export type Activity = {
  id: string;
  creator: string;
  host?: string;
  title: string;
  description: string;
  category: string;
  image: string;
  venue: string;
  city: string;
  start: string;
  capacity: number;
  budget: number;
  tags: string[];
  demo: boolean;
  attending: number;
  status?: string;
  swipe?: string;
  cancelled?: boolean;
  expired?: boolean;
};
export type Idea = {
  id: string;
  title: string;
  category: string;
  creator: string;
  image: string;
  slot?: string;
  notes?: string;
  vote?: boolean;
  yes?: number;
  unanimous?: boolean;
  matched?: boolean;
};
export type Circle = {
  id: string;
  name: string;
  description: string;
  city: string;
  budget: number;
  invite: string;
  demo: boolean;
  members: Person[];
  ideas: Idea[];
  round?: {
    id: string;
    threshold: string;
    complete: boolean;
    completed: number;
    total: number;
    ideaIds: string[];
  };
  plans: Plan[];
  messages: ChatMessage[];
  constraints: { user: string; text: string }[];
};
export type Venue = {
  id: string;
  name: string;
  address?: string;
  category?: string;
  rating?: number;
  price?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  url: string;
  hours?: string;
  source: "SerpApi" | "fixture";
};
export type Stop = {
  title: string;
  venue?: Venue;
  duration: number;
  drive?: { duration: string; distance: string; seconds?: number };
  note: string;
};
export type Plan = {
  id: string;
  circle: string;
  title: string;
  explanation: string;
  start: string;
  stops: Stop[];
  source: "demo" | "meta";
  template?: string;
  revision?: number;
  why?: string[];
  status: "proposed" | "confirmed";
  approvals: string[];
  eligible: string[];
  rsvps: string[];
};
export type State = {
  user: Person;
  demoUsers: Person[];
  activities: Activity[];
  circles: Circle[];
  integrations: { meta: boolean; serpapi: boolean; live: boolean };
};
export const categories = [
  "All vibes",
  "Outdoors",
  "Food",
  "Sports",
  "Games",
  "Arts",
  "Music",
  "Fitness",
];
export const photos: Record<string, string> = {
  Outdoors:
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85",
  Food: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85",
  Sports:
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=85",
  Games:
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=85",
  Arts: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=85",
  Music:
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=85",
  Fitness:
    "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1200&q=85",
};

export type ChatMessage = {
  id: string;
  sequence: number;
  user: string;
  name: string;
  avatar: string;
  text: string;
  createdAt: string;
};
