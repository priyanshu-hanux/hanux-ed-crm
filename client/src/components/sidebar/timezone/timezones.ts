export interface TimezoneOption {
  /** Unique key (two cities can share an IANA zone, e.g. New Delhi and Mumbai). */
  id: string;
  city: string;
  country: string;
  /** ISO 3166-1 alpha-2 code, used for the flag */
  countryCode: string;
  /** IANA timezone, used for all time maths. */
  timeZone: string;
}

/** Order here is the order inside each group in the picker. */
export const TIMEZONES: TimezoneOption[] = [
  { id: "new-delhi", city: "New Delhi", country: "India", countryCode: "IN", timeZone: "Asia/Kolkata" },
  { id: "mumbai", city: "Mumbai", country: "India", countryCode: "IN", timeZone: "Asia/Kolkata" },
  { id: "dubai", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", timeZone: "Asia/Dubai" },
  { id: "singapore", city: "Singapore", country: "Singapore", countryCode: "SG", timeZone: "Asia/Singapore" },
  { id: "hong-kong", city: "Hong Kong", country: "Hong Kong", countryCode: "HK", timeZone: "Asia/Hong_Kong" },
  { id: "tokyo", city: "Tokyo", country: "Japan", countryCode: "JP", timeZone: "Asia/Tokyo" },
  { id: "sydney", city: "Sydney", country: "Australia", countryCode: "AU", timeZone: "Australia/Sydney" },
  { id: "johannesburg", city: "Johannesburg", country: "South Africa", countryCode: "ZA", timeZone: "Africa/Johannesburg" },
  { id: "london", city: "London", country: "United Kingdom", countryCode: "GB", timeZone: "Europe/London" },
  { id: "berlin", city: "Berlin", country: "Germany", countryCode: "DE", timeZone: "Europe/Berlin" },
  { id: "paris", city: "Paris", country: "France", countryCode: "FR", timeZone: "Europe/Paris" },
  { id: "sao-paulo", city: "São Paulo", country: "Brazil", countryCode: "BR", timeZone: "America/Sao_Paulo" },
  { id: "new-york", city: "New York", country: "United States", countryCode: "US", timeZone: "America/New_York" },
  { id: "toronto", city: "Toronto", country: "Canada", countryCode: "CA", timeZone: "America/Toronto" },
  { id: "chicago", city: "Chicago", country: "United States", countryCode: "US", timeZone: "America/Chicago" },
  { id: "denver", city: "Denver", country: "United States", countryCode: "US", timeZone: "America/Denver" },
  { id: "los-angeles", city: "Los Angeles", country: "United States", countryCode: "US", timeZone: "America/Los_Angeles" },
];

export const DEFAULT_TIMEZONE_ID = "new-delhi";
