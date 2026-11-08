// Display formatting for the views only. No state and no rental rules live here.

// 1500 -> '₱1,500'
export const formatPeso = amount => `₱${Number(amount).toLocaleString('en-PH')}`;

// 'YYYY-MM-DD' -> 'Nov 10, 2026' (year: false -> 'Nov 10', weekday: true -> 'Mon, Nov 10, 2026').
// The date is read as UTC and shown in UTC, so the day never shifts with the computer's time zone.
export const formatDate = function (date, { year = true, weekday = false } = {}) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: weekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: year ? 'numeric' : undefined,
    timeZone: 'UTC',
  });
};
