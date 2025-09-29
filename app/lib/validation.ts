export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitized?: any
}

/**
 * Sanitizes a string by trimming whitespace, replacing multiple spaces with a single space,
 * escaping HTML special characters, and limiting the length.
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") return ""

  return input
    .trim()
    .replace(/[<>'"&]/g, (char) => {
      const entities: { [key: string]: string } = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      }
      return entities[char] || char
    })
    .replace(/\s+/g, " ")
    .substring(0, 500) // Max length limit
}

/**
 * Validates a search query, ensuring it's a non-empty string and meets length requirements.
 * @param query The search query string.
 * @returns A ValidationResult object.
 */
export function validateSearchQuery(query: string): ValidationResult {
  if (!query || typeof query !== "string") {
    return { isValid: false, error: "Search query is required" }
  }

  const sanitized = sanitizeString(query)

  if (sanitized.length < 2) {
    return { isValid: false, error: "Search query must be at least 2 characters" }
  }

  if (sanitized.length > 100) {
    return { isValid: false, error: "Search query too long (max 100 characters)" }
  }

  return { isValid: true, sanitized }
}

/**
 * Validates a file code by sanitizing it to only allow alphanumeric, hyphens, and underscores,
 * then checks if it meets length requirements.
 * @param fileCode The file code string.
 * @returns A ValidationResult object.
 */
export function validateFileCode(fileCode: string): ValidationResult {
  if (!fileCode || typeof fileCode !== "string") {
    return { isValid: false, error: "file_code is required" }
  }

  // Remove any characters that are NOT alphanumeric, hyphens, or underscores.
  const sanitized = fileCode.replace(/[^a-zA-Z0-9_-]/g, "")

  if (sanitized.length < 3) {
    return { isValid: false, error: "file_code must be at least 3 characters after sanitization" }
  }

  if (sanitized.length > 50) {
    return { isValid: false, error: "file_code too long (max 50 characters)" }
  }

  return { isValid: true, sanitized }
}

/**
 * Validates pagination parameters, ensuring they are valid numbers within a specified range.
 * @param page The page number as a string or null.
 * @param perPage The items per page count as a string or null.
 * @returns A ValidationResult object.
 */
export function validatePagination(page: string | null, perPage: string | null): ValidationResult {
  const pageNum = Number.parseInt(page || "1")
  const perPageNum = Number.parseInt(perPage || "50")

  if (isNaN(pageNum) || pageNum < 1 || pageNum > 10000) {
    return { isValid: false, error: "Invalid page number (1-10000)" }
  }

  if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 1000) {
    return { isValid: false, error: "Invalid per_page value (1-1000)" }
  }

  return {
    isValid: true,
    sanitized: { page: pageNum, perPage: perPageNum },
  }
}

/**
 * Validates a URL to block specific problematic URLs.
 * @param url The URL string.
 * @returns True if the URL is valid, otherwise false.
 */
export function validateUrl(url: string): boolean {
  // Block specific problematic URLs
  const blockedUrls = ["apikaya.pages.dev/api/search?q=janda%20ngewe", "apikaya.pages.dev/api/Search?q=jANDA%20nGEWE"]

  const urlLower = url.toLowerCase()
  return !blockedUrls.some((blocked) => urlLower.includes(blocked.toLowerCase()))
}
