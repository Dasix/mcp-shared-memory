import { z } from "zod";

/**
 * Zod Schema for the core IP details returned by the ip-api.com JSON endpoint.
 * Includes common fields and optional extended fields.
 */
export const IPDetailSchema = z.object({
  status: z.string().describe('Response status, e.g., "success" or "fail"'),
  message: z.string().optional().describe('Error message if status is "fail"'),
  query: z.string().optional().describe("The IP address used for the query"),
  country: z.string().optional().describe("Country name"),
  countryCode: z.string().optional().describe("Two-letter country code (ISO 3166-1 alpha-2)"),
  region: z.string().optional().describe("Region/state short code (FIPS or ISO)"),
  regionName: z.string().optional().describe("Region/state name"),
  city: z.string().optional().describe("City name"),
  zip: z.string().optional().describe("Zip/postal code"),
  lat: z.number().optional().describe("Latitude"),
  lon: z.number().optional().describe("Longitude"),
  timezone: z.string().optional().describe("Timezone (e.g., America/New_York)"),
  isp: z.string().optional().describe("Internet Service Provider name"),
  org: z.string().optional().describe("Organization name"),
  as: z.string().optional().describe('Autonomous System number and name (e.g., "AS15169 Google LLC")'),
  asname: z.string().optional().describe('Autonomous System name (e.g., "Google LLC")'),
  reverse: z.string().optional().describe("Reverse DNS host name of the IP address"),
  mobile: z.boolean().optional().describe("Whether the IP belongs to a mobile carrier"),
  proxy: z.boolean().optional().describe("Whether the IP is identified as a proxy/VPN/Tor"),
  hosting: z.boolean().optional().describe("Whether the IP belongs to a hosting provider"),
});

/**
 * TypeScript type inferred from the IPDetailSchema.
 * Represents the expected structure of a successful ip-api.com response.
 */
export type IPDetail = z.infer<typeof IPDetailSchema>;

/**
 * Options specifically for the ip-api.com request within the service.
 * Used by the service layer when calling fetchIpApi.
 */
export type IPApiRequestOptions = {
  useHttps?: boolean; // Use HTTPS (requires paid plan)
  fields?: string[]; // Specific fields to request
  lang?: string; // Language code (e.g., 'en', 'de')
};
