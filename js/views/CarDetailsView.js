// CarDetailsView: one car's photo, details, status for the chosen dates and its renters, in a <dialog>.
// Edit and Delete for the car live here (not on the cards).
import View from './View.js';
import { formatDate, formatPeso } from '../helpers/format.js';

const PLACEHOLDER = 'images/cars/placeholder.jpg';

class CarDetailsView extends View {
  _parentElement = document.querySelector('.details-dialog');

  constructor() {
    super();
    const dialog = this._parentElement;
    dialog.addEventListener('click', e => {
      if (e.target.closest('.btn-close')) this.close();
    });
    // Missing photo -> placeholder (capture phase, because image 'error' events don't bubble)
    dialog.addEventListener(
      'error',
      e => {
        const img = e.target;
        if (img.tagName !== 'IMG' || img.src.endsWith(PLACEHOLDER)) return;
        img.src = PLACEHOLDER;
      },
      true
    );
  }

  // car = the car from model.getCarDetails: status fields plus its renters
  open(car) {
    this.render(car);
    this._parentElement.showModal();
  }

  close() {
    this._parentElement.close();
  }

  addHandlerEdit(handler) {
    this._parentElement.addEventListener('click', e => {
      if (e.target.closest('.btn-edit')) handler(this._data.id);
    });
  }

  addHandlerDelete(handler) {
    this._parentElement.addEventListener('click', e => {
      if (!e.target.closest('.btn-delete')) return;
      if (!confirm(`Delete ${this._data.name}? This cannot be undone.`)) return;
      handler(this._data.id);
    });
  }

  // e.g. "This car has renters, so it cannot be deleted."
  renderError(message) {
    this._parentElement.querySelector('.details-error').textContent = message;
  }

  _generateStatus() {
    const car = this._data;
    if (car.needsDates) return '<span class="badge badge-returned">Pick valid dates to check</span>';
    if (!car.booked) return '<span class="badge badge-available">Available for the chosen dates</span>';
    return `<span class="badge badge-booked">Booked · available again on ${formatDate(car.availableAgain)}</span>`;
  }

  _generateRenters() {
    const { renters } = this._data;
    if (renters.length === 0) return '<p class="details-empty">No renters for this car yet.</p>';
    return `<ul class="details-renters">${renters
      .map(
        r => `
        <li>
          <div>
            <strong>${r.name}</strong>
            <span>${r.hasDates ? `${formatDate(r.startDate)} – ${formatDate(r.endDate)}` : 'No dates'}</span>
          </div>
          <div class="details-renter-end">
            <span class="badge badge-${r.status.toLowerCase()}">${r.status}</span>
            <span class="details-fee">${formatPeso(r.fee)}</span>
          </div>
        </li>`
      )
      .join('')}</ul>`;
  }

  _generateMarkup() {
    const car = this._data;
    return `
      <div class="details">
        <img class="details-photo" src="${car.image || PLACEHOLDER}" alt="${car.name}" />
        <div class="details-head">
          <h2 id="details-title">${car.name}</h2>
          ${this._generateStatus()}
        </div>
        <dl class="details-facts">
          <div><dt>Type</dt><dd>${car.type || '—'}</dd></div>
          <div><dt>Plate</dt><dd>${car.plate || 'No plate'}</dd></div>
          <div><dt>Daily rate</dt><dd class="details-rate">${formatPeso(car.dailyRate)}</dd></div>
        </dl>
        <h3 class="details-subtitle">Renters</h3>
        ${this._generateRenters()}
        <p class="details-error error" role="alert"></p>
        <div class="form-actions">
          <button type="button" class="btn btn-outline btn-close">Close</button>
          <button type="button" class="btn btn-outline btn-edit">Edit</button>
          <button type="button" class="btn btn-danger btn-delete">Delete</button>
        </div>
      </div>`;
  }
}

export default new CarDetailsView();
