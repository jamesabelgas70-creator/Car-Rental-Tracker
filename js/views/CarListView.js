import View from './View.js';
import { formatDate, formatPeso } from '../helpers/format.js';

const PLACEHOLDER = 'images/cars/placeholder.jpg';

const svg = (paths, size) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const CAR_ICON = svg(
  '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  15
);
const EYE_ICON = svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', 16);
const CALENDAR_ICON = svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', 16);

class CarListView extends View {
  _parentElement = document.querySelector('.car-list');

  constructor() {
    super();
    // Image 'error' events don't bubble, so listen in the capture phase (true) to catch every photo.
    // The endsWith check stops an endless loop if placeholder.jpg itself is missing.
    this._parentElement.addEventListener(
      'error',
      e => {
        const img = e.target;
        if (img.tagName !== 'IMG' || img.src.endsWith(PLACEHOLDER)) return;
        img.src = PLACEHOLDER;
      },
      true
    );
  }

  // The "+ Add car" button in the panel header
  addHandlerNew(handler) {
    document.querySelector('.btn-new-car').addEventListener('click', () => handler());
  }

  // "Rent Now": the handler gets the car id
  addHandlerAddRenter(handler) {
    this._addCardHandler('.btn-add-renter', handler);
  }

  // "View Details": the handler gets the car id
  addHandlerDetails(handler) {
    this._addCardHandler('.btn-details', handler);
  }

  _addCardHandler(selector, handler) {
    this._parentElement.addEventListener('click', e => {
      const btn = e.target.closest(selector);
      if (!btn) return;
      handler(Number(btn.closest('.car').dataset.id));
    });
  }

  // data = { cars, noneAvailable }. Each car has booked, availableAgain ('YYYY-MM-DD' or ''), needsDates and canBook.
  _generateMarkup() {
    const { cars, noneAvailable } = this._data;
    if (cars.length === 0) return '<li class="empty">No cars yet. Add your first car.</li>';

    const noMatch = noneAvailable ? '<li class="empty">No cars match these dates. Try other dates.</li>' : '';
    return noMatch + cars.map(car => this._generateCard(car)).join('');
  }

  _generateCard(car) {
    // Why Rent Now is disabled: no valid filter dates, or the car is taken on those dates
    const reason = car.needsDates ? 'Pick valid dates first' : 'Booked for these dates';
    const disabled = car.canBook ? '' : `disabled title="${reason}"`;

    return `
      <li class="car ${car.booked ? 'is-booked' : ''}" data-id="${car.id}">
        <div class="car-media">
          <img class="car-photo" src="${car.image || PLACEHOLDER}" alt="${car.name}" loading="lazy" />
          <span class="badge ${car.booked ? 'badge-booked' : 'badge-available'}">${car.booked ? 'Booked' : 'Available'}</span>
        </div>
        <div class="car-body">
          <h3 class="car-name">${car.name}</h3>
          <p class="car-meta">${CAR_ICON} ${[car.type, car.plate || 'No plate'].filter(Boolean).join(' • ')}</p>
          <p class="car-rate"><strong>${formatPeso(car.dailyRate)}</strong> /day</p>
          ${car.availableAgain ? `<p class="car-again">Available again on ${formatDate(car.availableAgain)}</p>` : ''}
          <div class="car-actions">
            <button type="button" class="btn btn-outline btn-details">${EYE_ICON} View Details</button>
            <button type="button" class="btn btn-primary btn-add-renter" ${disabled}>${CALENDAR_ICON} Rent Now</button>
          </div>
        </div>
      </li>`;
  }
}

export default new CarListView();
