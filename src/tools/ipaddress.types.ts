import { z } from "zod";

/**
 * Zod schema for the IP address tool arguments.
 */
export const IpAddressToolArgs = z
  .object({
    // Note: The ipAddress itself is handled as a separate optional positional argument in the tool/CLI,
    // not as part of the options object validated by this schema.
    includeExtendedData: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to include extended data (ASN, host, organization, etc.). Requires API token."),
    useHttps: z.boolean().optional().default(true).describe("Whether to use HTTPS for the API call (recommended)."),
  })
  .strict();

/**
 * TypeScript type inferred from the IpAddressToolArgs Zod schema.
 * This represents the optional arguments passed to the tool handler and controller.
 */
export type IpAddressToolArgsType = z.infer<typeof IpAddressToolArgs>;
