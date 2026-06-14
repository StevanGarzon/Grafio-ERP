/**
 * GRAFIO ERP - Security and Threat Mitigation Utility Module
 * 
 * Provides robust client-side sanitization, pattern detection, and cleaning
 * methods to neutralize malicious SQL syntax injections and Cross-Site Scripting (XSS)
 * payloads before queries are transmitted or values are saved.
 */

// Common SQL Injection payload regex patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|UNION|MERGE|GRANT|REVOKE)\b)/i,
  /('\s*OR\s*'\s*\d+\s*=\s*\d+)/i, // ' OR '1'='1
  /("\s*OR\s*"\s*\d+\s*=\s*\d+)/i, // " OR "1"="1
  /(\bOR\s+\d+\s*=\s*\d+)/i,       // OR 1=1
  /(--\s*$)/,                       // SQL single line comments --
  /(\/\*[\s\S]*?\*\/)/,             // SQL multi-line comments /* */
  /(UNION\s+(ALL\s+)?SELECT)/i,     // UNION SELECT statements
  /(\b(AND|OR)\b\s+\w+\s*=\s*['"]?\w+['"]?)/i,
  /(;\s*(DROP|DELETE|UPDATE|INSERT|TRUNCATE)\b)/i, // Stacked queries
  /(\b(XP_CMDSHELL|EXEC|EXECUTE)\b)/i // Executing shell commands / procedures
];

// Common Cross-Site Scripting (XSS) payload regex patterns
const XSS_PATTERNS = [
  /<\s*script[^>]*>[\s\S]*?<\s*\/script\s*>/i,            // <script>...</script>
  /<\s*iframe[^>]*>[\s\S]*?<\s*\/iframe\s*>/i,            // <iframe>...</iframe>
  /<\s*object[^>]*>[\s\S]*?<\s*\/object\s*>/i,            // <object>...</object>
  /<\s*embed[^>]*>[\s\S]*?<\s*\/embed\s*>/i,              // <embed>...</embed>
  /javascript\s*:/i,                                      // javascript:
  /vbscript\s*:/i,                                        // vbscript:
  /on\w+\s*=\s*['"][^'"]*['"]/i,                          // inline handlers onload="...", onerror="..."
  /on\w+\s*=\s*[^\s>]+/i,                                 // inline handlers onload=alert(...)
  /<\s*img[^>]*\b(onerror|onload)\b[^>]*>/i,             // img with onerror/onload
  /<\s*body[^>]*\b(onload)\b[^>]*>/i                     // body onload
];

/**
 * Detects whether a string input contains potential SQL injection signatures.
 */
export function detectSqlInjection(input: any): boolean {
  if (typeof input !== 'string') return false;
  const decodedInput = decodeURIComponent(input).trim();
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(decodedInput)) {
      console.warn(`[SECURITY ALERT] SQL Injection signature matched for input: "${decodedInput}"`);
      return true;
    }
  }
  return false;
}

/**
 * Detects whether a string input contains potential XSS signatures.
 */
export function detectXss(input: any): boolean {
  if (typeof input !== 'string') return false;
  const decodedInput = decodeURIComponent(input).trim();
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(decodedInput)) {
      console.warn(`[SECURITY ALERT] XSS threat signature matched for input: "${decodedInput}"`);
      return true;
    }
  }
  return false;
}

/**
 * Sanitizes a string input by stripping dangerous SQL command characters.
 */
export function sanitizeSqlInput(input: any): string {
  if (typeof input !== 'string') return input;
  let sanitized = input;
  sanitized = sanitized.replace(/--+/g, '');
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');
  sanitized = sanitized.replace(/'/g, "''");
  sanitized = sanitized.replace(/"/g, '""');
  sanitized = sanitized.replace(/;\s*(drop|delete|update|insert|truncate|alter|select)/gi, '');
  return sanitized;
}

/**
 * Sanitizes a string input by neutralizing HTML injection, dangerous tags, and JavaScript event handlers.
 */
export function sanitizeXssInput(input: any): string {
  if (typeof input !== 'string') return input;
  let sanitized = input;
  
  // 1. Remove script tags and contents completely
  sanitized = sanitized.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/script\s*>/gi, '');
  
  // 2. Remove other executable visual wrapper tags
  sanitized = sanitized.replace(/<\s*(iframe|object|embed|meta|link|style)[^>]*>[\s\S]*?<\s*\/\1\s*>/gi, '');
  sanitized = sanitized.replace(/<\s*(iframe|object|embed|meta|link|style)[^>]*>/gi, '');
  
  // 3. Prevent javascript protocols inside URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, 'no-javascript:');
  sanitized = sanitized.replace(/vbscript\s*:/gi, 'no-vbscript:');
  
  // 4. Remove inline HTML event handlers (onerror, onload, onclick, onmouseover...)
  sanitized = sanitized.replace(/\bon\w+\s*=\s*['"][^'"]*['"]/gi, '');
  sanitized = sanitized.replace(/\bon\w+\s*=\s*[^\s>]+/gi, '');
  
  return sanitized;
}

/**
 * Recursively scans and deep-sanitizes all string properties inside an object.
 * Protects forms from both SQL Injection and XSS before database transmissions.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeXssInput(sanitizeSqlInput(obj)) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizePayload(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const sanitizedObj = { ...obj } as any;
    for (const key in sanitizedObj) {
      if (Object.prototype.hasOwnProperty.call(sanitizedObj, key)) {
        sanitizedObj[key] = sanitizePayload(sanitizedObj[key]);
      }
    }
    return sanitizedObj as T;
  }
  
  return obj;
}
