const USAGE_KEY = 'cb_usage_count_v1';

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Stored as { month: 'YYYY-MM', count } so the count genuinely resets each calendar month.
// Older builds stored a bare integer; it is treated as the current month's count.
export const getMonthlyUsage = (): number => {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw === null) return 0;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'number') return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    if (parsed && parsed.month === currentMonthKey() && typeof parsed.count === 'number') {
      return Math.max(0, parsed.count);
    }
    return 0;
  } catch {
    return 0;
  }
};

export const incrementMonthlyUsage = () => {
  try {
    localStorage.setItem(
      USAGE_KEY,
      JSON.stringify({ month: currentMonthKey(), count: getMonthlyUsage() + 1 }),
    );
  } catch {
    // Storage unavailable
  }
};

export const formatSavedDate = (date: Date) =>
  date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
