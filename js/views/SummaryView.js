import View from './View.js';
import { formatDate, formatPeso } from '../helpers/format.js';

// Small line icons (inline SVG, they take the text color)
const ICONS = {
  wallet:
    '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
};

const icon = name =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

class SummaryView extends View {
  _parentElement = document.querySelector('.summary');
  _dateElement = document.querySelector('.header-date');

  // date = today as 'YYYY-MM-DD' from the model -> 'Mon, Nov 10, 2026' in the header
  renderDate(date) {
    this._dateElement.textContent = formatDate(date, { weekday: true });
  }

  // data = { earnings, rentals, carsOut, fleet, upcoming, nextPickup } from model.getSummary()
  _generateMarkup() {
    const { earnings, rentals, carsOut, fleet, upcoming, nextPickup } = this._data;
    const cards = [
      ['wallet', 'Total Earnings', formatPeso(earnings), `From ${plural(rentals, 'rental')}`],
      ['car', 'Cars Out Today', carsOut, carsOut === 0 ? 'No active rentals' : `of ${plural(fleet, 'car')} in the fleet`],
      [
        'calendar',
        'Upcoming Renters',
        upcoming,
        nextPickup ? `Next pick-up: ${formatDate(nextPickup, { year: false })}` : 'None scheduled',
      ],
    ];

    return cards
      .map(
        ([name, label, value, note]) => `
      <div class="card summary-card">
        <span class="icon-square icon-square-solid">${icon(name)}</span>
        <div class="summary-text">
          <p class="summary-label">${label}</p>
          <p class="summary-value">${value}</p>
          <p class="summary-note">${note}</p>
        </div>
      </div>`
      )
      .join('');
  }
}

export default new SummaryView();
