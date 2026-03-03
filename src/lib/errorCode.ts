/**
 * Generates a short unique error code like "ERR-A3F2"
 * and logs the full error details to console for debugging.
 */
export function generateErrorCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ERR-${code}`;
}

/**
 * Logs the error with its code to the console for debugging,
 * and returns the code for display to the user.
 */
export function logErrorWithCode(
  error: unknown,
  context?: string
): string {
  const code = generateErrorCode();
  const timestamp = new Date().toISOString();
  
  console.error(
    `[${code}] ${timestamp}${context ? ` | ${context}` : ''}`,
    error
  );

  return code;
}
