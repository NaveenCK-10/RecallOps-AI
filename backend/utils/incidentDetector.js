export function hasIncidentIndicators(log) {
  if (!log || typeof log !== 'string') return false;

  const keywords = ['ERROR', 'FATAL', 'EXCEPTION', 'CRITICAL', 'PANIC'];
  const keywordRegex = new RegExp(keywords.join('|'), 'i');

  const failurePhrases = [
    'out of memory',
    'connection refused',
    'connection reset',
    'timeout',
    '502 bad gateway',
    '503 service unavailable',
    '504 gateway timeout',
    'database failure'
  ];
  const phraseRegex = new RegExp(failurePhrases.join('|'), 'i');

  // Multi-line stack trace detection
  const stackTraceRegex = /^\s*(at\s+|Traceback\s*\(|java\.|Caused by:)/mi;

  if (keywordRegex.test(log)) return true;
  if (phraseRegex.test(log)) return true;
  if (stackTraceRegex.test(log)) return true;

  return false;
}
