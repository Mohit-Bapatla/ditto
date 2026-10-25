/** Only intentional user-facing errors may cross the HTTP boundary. */
export class PublicError extends Error {}
