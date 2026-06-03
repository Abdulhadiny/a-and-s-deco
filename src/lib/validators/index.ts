import * as z from "zod";

/** Normalize empty / whitespace-only strings to undefined */
const normalize = (val: unknown) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return val;
};

/** Required trimmed string with min/max */
const trimmedString = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

/** Optional trimmed string — normalizes empty to undefined */
const optionalTrimmedString = (max: number, label: string) =>
  z.preprocess(
    normalize,
    z
      .string()
      .max(max, `${label} must be at most ${max} characters`)
      .optional()
  );

/** Optional phone — strips spaces/hyphens, validates 11-digit local or +234 international */
const optionalPhone = () =>
  z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const trimmed = val.trim().replace(/[\s\-()]/g, "");
        return trimmed === "" ? null : trimmed;
      }
      return val === undefined ? null : val;
    },
    z
      .string()
      .regex(
        /^(0[7-9]\d{9}|\+?234[7-9]\d{9})$/,
        "Enter a valid phone number (e.g. 08012345678)"
      )
      .nullable()
  );

/** Optional CUID that accepts null, undefined, or "" and normalizes to null */
const optionalCuid = (msg = "Invalid selection") =>
  z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().cuid(msg).nullable()
  );

// ── Auth & Users ────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email is too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password is too long"),
});

export const userSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email is too long"),
  name: trimmedString(2, 200, "Name"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long")
    .optional(),
  roleId: z.string().cuid("Select a role"),
  locationId: z.string().cuid("Invalid location").nullable().optional(),
  isActive: z.boolean(),
});

// ── Inventory ───────────────────────────────────────────────────

export const categorySchema = z.object({
  name: trimmedString(2, 100, "Category name"),
  description: z.string().max(500, "Description is too long").optional().nullable(),
});

export const itemSchema = z.object({
  categoryId: z.string().cuid("Select a category"),
  name: trimmedString(2, 200, "Item name"),
  tag: trimmedString(2, 50, "Tag/Code"),
  rentalPrice: z.coerce.number().min(0, "Price must be positive"),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  status: z.enum(["AVAILABLE", "DAMAGED", "RETIRED"]).default("AVAILABLE"),
});

// ── Settings ────────────────────────────────────────────────────

export const locationSchema = z.object({
  name: trimmedString(2, 100, "Location name"),
  address: z.string().max(500, "Address is too long").optional().nullable(),
  isActive: z.boolean(),
});

export const systemConfigSchema = z.object({
  value: z.any(),
  description: z.string().optional(),
});
