export const getTierNumber = (tier: unknown): number => {
  if (typeof tier === 'number') {
    return Number.isFinite(tier) ? tier : 0;
  }

  if (typeof tier === 'string') {
    const normalized = tier.trim().toLowerCase().replace(/^tier[_\s-]?/, '');

    if (normalized === 'zero') return 0;
    if (normalized === 'one') return 1;
    if (normalized === 'two') return 2;

    if (normalized !== '' && !Number.isNaN(Number(normalized))) {
      return Number(normalized);
    }
  }

  return 0;
};

export const isTierOneOrAbove = (tier: unknown): boolean => getTierNumber(tier) >= 1;
