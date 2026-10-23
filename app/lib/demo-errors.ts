export type DemoErrorKind = "history" | "purchase" | "demo-purchases" | "paypal-order" | "paypal-capture";

const messages: Record<DemoErrorKind, string> = {
  history: "Wallet history couldn’t load. Please try again.",
  purchase: "Purchase couldn’t be completed. Please try again.",
  "demo-purchases": "A purchase couldn’t be completed. Please try again.",
  "paypal-order": "Couldn’t start PayPal Sandbox funding. Please try again.",
  "paypal-capture": "PayPal funding couldn’t be verified. Please try again.",
};

// API and runtime details are intentionally ignored so they cannot reach browser output.
export function userFacingError(kind: DemoErrorKind, _detail?: unknown): string {
  return messages[kind];
}
