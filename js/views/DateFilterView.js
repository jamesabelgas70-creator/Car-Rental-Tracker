import View from './View.js';
import { formatDate } from '../helpers/format.js';

// The Check Availability card. All date rules and date math live in the model; this view only shows
// the values it is given and reports what was clicked.
class DateFilterView extends View {
  _parentElement = document.querySelector('.date-filter');
  _custom = false; // "Custom" was clicked: it stays highlighted until a quick chip is used

  constructor() {
    super();
    // "Custom" is screen-only: highlight it and move the cursor to the return date
    this._parentElement.querySelector('.chip-custom').addEventListener('click', () => {
      this._custom = true;
      this._setPressed(this._parentElement.querySelector('.chip-custom'));
      this._parentElement.elements.endDate.focus();
    });
  }

  // Tell the controller whenever either date changes
  addHandlerChange(handler) {
    this._parentElement.addEventListener('change', e => {
      if (e.target.type === 'date') handler();
    });
  }

  // A quick chip: the handler gets the number of days (2, 7 or 14)
  addHandlerQuickRange(handler) {
    this._parentElement.addEventListener('click', e => {
      const chip = e.target.closest('.chip[data-days]');
      if (!chip) return;
      this._custom = false;
      handler(Number(chip.dataset.days));
    });
  }

  // Current dates as 'YYYY-MM-DD' strings ('' when missing or half-typed)
  getDates() {
    const { startDate, endDate } = this._parentElement.elements;
    return { startDate: startDate.value, endDate: endDate.value };
  }

  // Only writes a value that changed, so it never interrupts someone typing a date
  setDates({ startDate, endDate }) {
    const inputs = this._parentElement.elements;
    if (inputs.startDate.value !== startDate) inputs.startDate.value = startDate;
    if (inputs.endDate.value !== endDate) inputs.endDate.value = endDate;
  }

  // min/max values come from the controller (the model decides them)
  setLimits({ startMin, startMax, endMin, endMax }) {
    const { startDate, endDate } = this._parentElement.elements;
    startDate.min = startMin;
    startDate.max = startMax;
    endDate.min = endMin;
    endDate.max = endMax;
  }

  // summary = { startDate, endDate, days, available, total } from the model, or null for invalid dates.
  // Highlights the chip that matches the day count (or Custom), and writes the line under the chips.
  renderRange(summary) {
    const chips = [...this._parentElement.querySelectorAll('.chip')];
    const match = summary && !this._custom && chips.find(chip => Number(chip.dataset.days) === summary.days);
    const custom = this._parentElement.querySelector('.chip-custom');
    this._setPressed(match || (summary || this._custom ? custom : null));

    const line = this._parentElement.querySelector('.range-summary');
    if (!summary) {
      line.textContent = 'Pick valid dates to see available cars.';
      return;
    }
    const { startDate, endDate, days, available, total } = summary;
    const range = `${formatDate(startDate, { year: false })} – ${formatDate(endDate, { year: false })}`;
    line.textContent = `${range} · ${days} ${days === 1 ? 'day' : 'days'} · ${available} of ${total} cars available`;
  }

  // Show each date error in red right under its field
  renderErrors(errors = {}) {
    ['startDate', 'endDate'].forEach(name => {
      const input = this._parentElement.elements[name];
      input.setAttribute('aria-invalid', errors[name] ? 'true' : 'false');
      input.closest('.date-field').querySelector('.field-error').textContent = errors[name] || '';
    });
  }

  // Exactly one chip (or none) shows as pressed
  _setPressed(active) {
    this._parentElement
      .querySelectorAll('.chip')
      .forEach(chip => chip.setAttribute('aria-pressed', chip === active ? 'true' : 'false'));
  }
}

export default new DateFilterView();
