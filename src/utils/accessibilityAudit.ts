/**
 * WCAG 2.2 AA Contrast & Touch Target Verification Utilities
 */

export const DESIGN_TOKENS = {
  softSage: '#7A9A7B',
  softSageDark: '#4F6A50',
  softSageSurface: '#E4EDE4',
  warmSand: '#EFE8D8',
  warmSandLight: '#F8F5EE',
  slateBlue: '#4A6B82',
  slateBlueDark: '#2F4858',
  slateBlueSurface: '#E2EBF0',
  mutedCharcoal: '#2C3539',
  accentTerracotta: '#D97757',
  accentTerracottaDark: '#A85134',
  accentTerracottaSurface: '#F9E7E1',
  white: '#FFFFFF',
} as const;

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = getRelativeLuminance(foregroundHex);
  const l2 = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export interface ContrastAuditPair {
  name: string;
  fg: string;
  bg: string;
  minRequired: number;
  actualRatio: number;
  passes: boolean;
}

export function runPaletteContrastAudit(): ContrastAuditPair[] {
  const pairs: Array<{ name: string; fg: string; bg: string; minRequired: number }> = [
    {
      name: 'Muted Charcoal on Warm Sand (Primary Body Text)',
      fg: DESIGN_TOKENS.mutedCharcoal,
      bg: DESIGN_TOKENS.warmSand,
      minRequired: 4.5,
    },
    {
      name: 'Muted Charcoal on Warm Sand Light (Card Text)',
      fg: DESIGN_TOKENS.mutedCharcoal,
      bg: DESIGN_TOKENS.warmSandLight,
      minRequired: 4.5,
    },
    {
      name: 'Muted Charcoal on Soft Sage Surface',
      fg: DESIGN_TOKENS.mutedCharcoal,
      bg: DESIGN_TOKENS.softSageSurface,
      minRequired: 4.5,
    },
    {
      name: 'Muted Charcoal on Slate Surface',
      fg: DESIGN_TOKENS.mutedCharcoal,
      bg: DESIGN_TOKENS.slateBlueSurface,
      minRequired: 4.5,
    },
    {
      name: 'White on Muted Charcoal (Primary Action Button)',
      fg: DESIGN_TOKENS.white,
      bg: DESIGN_TOKENS.mutedCharcoal,
      minRequired: 4.5,
    },
    {
      name: 'White on Soft Sage Dark (Primary Game Action)',
      fg: DESIGN_TOKENS.white,
      bg: DESIGN_TOKENS.softSageDark,
      minRequired: 4.5,
    },
    {
      name: 'White on Slate Blue (Badge & Header Action)',
      fg: DESIGN_TOKENS.white,
      bg: DESIGN_TOKENS.slateBlue,
      minRequired: 4.5,
    },
    {
      name: 'White on Terracotta Dark (Alert/Stop Button)',
      fg: DESIGN_TOKENS.white,
      bg: DESIGN_TOKENS.accentTerracottaDark,
      minRequired: 4.5,
    },
  ];

  return pairs.map((p) => {
    const actualRatio = getContrastRatio(p.fg, p.bg);
    return {
      ...p,
      actualRatio,
      passes: actualRatio >= p.minRequired,
    };
  });
}
