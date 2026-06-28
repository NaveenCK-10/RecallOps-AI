/**
 * Centralized Severity Theme Configuration
 * 
 * Single source of truth for all severity-related styling.
 * Adding a new severity level requires only one entry here.
 */

const SEVERITY_THEMES = {
  healthy: {
    label: 'Healthy',
    gradient: 'linear-gradient(135deg, #00FF88, #00E5FF)',
    from: '#00FF88',
    to: '#00E5FF',
    primary: '#00FF88',
    badgeBg: 'rgba(0, 255, 136, 0.08)',
    badgeBorder: 'rgba(0, 255, 136, 0.35)',
    badgeText: '#00FF88',
    glowColor: 'rgba(0, 255, 136, 0.15)',
    accentHeight: '2px',
    animation: 'severity-breathe',
    animationDuration: '6s',
  },
  low: {
    label: 'Low',
    gradient: 'linear-gradient(135deg, #22C55E, #16A34A)',
    from: '#22C55E',
    to: '#16A34A',
    primary: '#22C55E',
    badgeBg: 'rgba(34, 197, 94, 0.08)',
    badgeBorder: 'rgba(34, 197, 94, 0.35)',
    badgeText: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.15)',
    accentHeight: '3px',
    animation: 'severity-shimmer',
    animationDuration: '5s',
  },
  medium: {
    label: 'Medium',
    gradient: 'linear-gradient(135deg, #FACC15, #F59E0B)',
    from: '#FACC15',
    to: '#F59E0B',
    primary: '#FACC15',
    badgeBg: 'rgba(250, 204, 21, 0.08)',
    badgeBorder: 'rgba(250, 204, 21, 0.35)',
    badgeText: '#FACC15',
    glowColor: 'rgba(250, 204, 21, 0.12)',
    accentHeight: '4px',
    animation: 'severity-sweep',
    animationDuration: '6s',
  },
  high: {
    label: 'High',
    gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
    from: '#F97316',
    to: '#EA580C',
    primary: '#F97316',
    badgeBg: 'rgba(249, 115, 22, 0.1)',
    badgeBorder: 'rgba(249, 115, 22, 0.4)',
    badgeText: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.2)',
    accentHeight: '5px',
    animation: 'severity-sweep',
    animationDuration: '4s',
  },
  critical: {
    label: 'Critical',
    gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
    from: '#EF4444',
    to: '#DC2626',
    primary: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.12)',
    badgeBorder: 'rgba(239, 68, 68, 0.5)',
    badgeText: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.25)',
    accentHeight: '6px',
    animation: 'severity-pulse',
    animationDuration: '3s',
  },
  infrastructure: {
    label: 'Infrastructure Failure',
    gradient: 'linear-gradient(135deg, #8B5CF6, #A855F7)',
    from: '#8B5CF6',
    to: '#A855F7',
    primary: '#8B5CF6',
    badgeBg: 'rgba(139, 92, 246, 0.1)',
    badgeBorder: 'rgba(139, 92, 246, 0.4)',
    badgeText: '#A78BFA',
    glowColor: 'rgba(139, 92, 246, 0.2)',
    accentHeight: '5px',
    animation: 'severity-electric',
    animationDuration: '2s',
  },
};

// Fallback for any unknown severity — uses purple (infrastructure) styling
const DEFAULT_THEME = SEVERITY_THEMES.medium;

/**
 * Resolves a backend severity string to a theme object.
 * Handles edge cases like tags indicating infrastructure failure.
 */
export function getSeverityTheme(severity, tags = []) {
  // Check for infrastructure failures first (API errors, fallbacks)
  const isInfra = tags?.some?.(t =>
    ['api-error', 'fallback', 'nvidia-error', 'timeout'].includes(t)
  );
  if (isInfra) return SEVERITY_THEMES.infrastructure;

  const key = (severity || '').toLowerCase().trim();
  return SEVERITY_THEMES[key] || DEFAULT_THEME;
}

export default SEVERITY_THEMES;
