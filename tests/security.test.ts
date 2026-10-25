import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin, secureCookie } from "../lib/security";
test("production CSRF origin is exact and independent of an internal proxy host", () => {
  assert.equal(
    isAllowedOrigin(
      "https://ditto.example",
      "internal:3000",
      "https://ditto.example",
    ),
    true,
  );
  for (const origin of [
    null,
    "null",
    "https://evil.example",
    "http://ditto.example",
    "https://ditto.example.evil.test",
    "https://ditto.example/path",
  ])
    assert.equal(
      isAllowedOrigin(origin, "ditto.example", "https://ditto.example"),
      false,
    );
  assert.equal(
    isAllowedOrigin("http://localhost:3000", "localhost:3000"),
    true,
  );
  assert.equal(isAllowedOrigin("http://evil.test", "localhost:3000"), false);
});
test("secure cookies default on in production and remain configurable for local HTTP", () => {
  const saved = {
    NODE_ENV: process.env.NODE_ENV,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
  };
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.COOKIE_SECURE;
    assert.equal(secureCookie(), true);
    process.env.COOKIE_SECURE = "false";
    assert.equal(secureCookie(), false);
    (process.env as Record<string, string | undefined>).NODE_ENV =
      "development";
    process.env.COOKIE_SECURE = "true";
    assert.equal(secureCookie(), true);
    delete process.env.COOKIE_SECURE;
    assert.equal(secureCookie(), false);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
