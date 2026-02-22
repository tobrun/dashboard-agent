/**
 * Deep merge two ECharts option objects.
 * Arrays are merged element-by-element (objects within arrays are merged recursively).
 * This ensures fetched data (e.g. series[0].data) overlays the stored template option.
 */
export function deepMerge(base: unknown, override: unknown): unknown {
  if (Array.isArray(base) && Array.isArray(override)) {
    const result = [...base]
    for (let i = 0; i < override.length; i++) {
      if (
        i < base.length &&
        base[i] !== null &&
        typeof base[i] === 'object' &&
        !Array.isArray(base[i]) &&
        override[i] !== null &&
        typeof override[i] === 'object' &&
        !Array.isArray(override[i])
      ) {
        result[i] = deepMerge(base[i], override[i])
      } else {
        result[i] = override[i]
      }
    }
    return result
  }

  if (
    base !== null &&
    override !== null &&
    typeof base === 'object' &&
    typeof override === 'object' &&
    !Array.isArray(base) &&
    !Array.isArray(override)
  ) {
    const result = { ...(base as Record<string, unknown>) }
    for (const key of Object.keys(override as Record<string, unknown>)) {
      result[key] = deepMerge(
        (base as Record<string, unknown>)[key],
        (override as Record<string, unknown>)[key]
      )
    }
    return result
  }

  return override !== undefined ? override : base
}
