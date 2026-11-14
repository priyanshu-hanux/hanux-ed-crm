/** The API server. Today one server hosts every module. */
export const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// Per-module overrides, in case a module moves to its own service later.
export const identityUrl = import.meta.env.VITE_IDENTITY_URL ?? apiUrl;
export const notificationUrl = import.meta.env.VITE_NOTIFICATION_URL ?? apiUrl;
export const crmUrl = import.meta.env.VITE_CRM_URL ?? apiUrl;
export const billingUrl = import.meta.env.VITE_BILLING_URL ?? apiUrl;
export const platformUrl = import.meta.env.VITE_PLATFORM_URL ?? apiUrl;
