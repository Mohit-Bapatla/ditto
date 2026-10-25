import { AsyncLocalStorage } from "node:async_hooks";
import type { Session } from "./db";
export const demoContext = new AsyncLocalStorage<{ sandbox: string; session: Session }>();
