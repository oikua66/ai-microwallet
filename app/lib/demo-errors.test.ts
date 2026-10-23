import { equal, match } from "node:assert/strict";
import { test } from "node:test";
import { userFacingError } from "./demo-errors";

test("API error details are replaced with concise purchase and PayPal messages", () => {
  const diagnostic = "SUPABASE_SERVICE_ROLE_KEY=secret; internal stack trace";
  const cases = [
    ["purchase", "Purchase couldn’t be completed. Please try again."],
    ["paypal-order", "Couldn’t start PayPal Sandbox funding. Please try again."],
    ["paypal-capture", "PayPal funding couldn’t be verified. Please try again."],
  ] as const;

  for (const [kind, expected] of cases) {
    const displayed = userFacingError(kind, { error: diagnostic });
    equal(displayed, expected);
    match(displayed, /Please try again\./);
    equal(displayed.includes(diagnostic), false);
  }
});
