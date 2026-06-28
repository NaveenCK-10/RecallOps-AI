export function preprocessLog(rawLog) {
  if (!rawLog) return '';

  // If the log is already small enough, return as is
  if (rawLog.length < 15000) {
    return rawLog;
  }

  const lines = rawLog.split(/\r?\n/);
  
  const keywords = ['ERROR', 'FATAL', 'EXCEPTION', 'WARN'];
  const keywordRegex = new RegExp(keywords.join('|'), 'i');
  const stackTraceRegex = /^\s*(at\s+|Traceback|java\.|Caused by:)/i;

  const extractedLines = new Set();
  
  // Always include the last 100 lines for immediate context of the crash
  const startTail = Math.max(0, lines.length - 100);
  for (let i = startTail; i < lines.length; i++) {
    extractedLines.add(i);
  }

  // Scan for keywords and stack traces
  for (let i = 0; i < lines.length - 100; i++) {
    const line = lines[i];
    if (keywordRegex.test(line) || stackTraceRegex.test(line)) {
      // Add surrounding context (+/- 2 lines)
      for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
        extractedLines.add(j);
      }
    }
  }

  // If no patterns found in the main body (set only contains the tail)
  // Let's add the first 100 lines just in case
  if (extractedLines.size <= 100) {
    for (let i = 0; i < Math.min(100, lines.length); i++) {
      extractedLines.add(i);
    }
  }

  const sortedIndices = Array.from(extractedLines).sort((a, b) => a - b);
  
  let processedLog = '';
  let lastIndex = -1;

  for (const idx of sortedIndices) {
    if (lastIndex !== -1 && idx > lastIndex + 1) {
      processedLog += '\n... [TRUNCATED] ...\n';
    }
    processedLog += lines[idx] + '\n';
    lastIndex = idx;
  }

  // Final safeguard: if it's STILL massively huge (e.g. 1M lines of errors)
  if (processedLog.length > 25000) {
    return processedLog.slice(0, 12500) + '\n\n... [MASSIVE LOG TRUNCATED] ...\n\n' + processedLog.slice(-12500);
  }

  return processedLog.trim();
}
