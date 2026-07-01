/**
 * Strips characters not valid in entity names (item names, customer names,
 * event titles, location names, category names, etc.).
 *
 * Allows: letters (any case), digits, spaces, hyphen, apostrophe,
 *         ampersand, period, comma, parentheses.
 */
export function filterName(value: string): string {
  return value.replace(/[^a-zA-Z0-9 \-'&.,()]/g, "");
}

/**
 * Strips characters not valid in inventory tag / SKU codes.
 * Allows: uppercase letters, digits, hyphens. Auto-uppercases the result.
 */
export function filterTag(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}
