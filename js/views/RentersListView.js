import View from './View.js';
import { formatDate, formatPeso } from '../helpers/format.js';

const svg = paths =>
  `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const CAR_ICON = svg(
  '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>'
);
const CALENDAR_ICON = svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>');
const PENCIL_ICON = svg('<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>');
const TRASH_ICON = svg('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>');

// "Leandro Lolo" -> "LL", "Ana" -> "A" (first and last word only; text formatting, no photo)
const initials = name => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return (words[0][0] + (words.length > 1 ? words.at(-1)[0] : '')).toUpperCase();
};

class RentersListView extends View {
  _parentElement = document.querySelector('.renter-list');

  addHandlerEdit(handler) {
    this._parentElement.addEventListener('click', e => {
      const btn = e.target.closest('.btn-edit');
      if (!btn) return;
      handler(Number(btn.closest('.renter').dataset.id));
    });
  }

  addHandlerDelete(handler) {
    this._parentElement.addEventListener('click', e => {
      const btn = e.target.closest('.btn-delete');
      if (!btn) return;
      if (!confirm('Are you sure you want to delete this renter?')) return;
      handler(Number(btn.closest('.renter').dataset.id));
    });
  }

  // data = renters from model.getRenterList(), already sorted (latest pick-up first),
  // each with carName, carPlate, hasDates and status
  _generateMarkup() {
    if (this._data.length === 0) {
      return '<li class="empty">No renters yet. Click Rent Now on a car to add one.</li>';
    }

    return this._data
      .map(renter => {
        // Old saved renters may have no day count, so only show it when there is one
        const days = renter.days ? ` (${renter.days} ${renter.days === 1 ? 'day' : 'days'})` : '';
        const dates = renter.hasDates
          ? `${formatDate(renter.startDate)} – ${formatDate(renter.endDate)}${days}`
          : 'No dates';

        return `
          <li class="renter" data-id="${renter.id}">
            <span class="avatar" aria-hidden="true">${initials(renter.name)}</span>
            <div class="renter-body">
              <div class="renter-top">
                <strong class="renter-name">${renter.name}</strong>
                <span class="badge badge-${renter.status.toLowerCase()}">${renter.status}</span>
              </div>
              <span class="renter-meta">${CAR_ICON} ${renter.carName}${renter.carPlate ? ` (${renter.carPlate})` : ''}</span>
              <span class="renter-meta">${CALENDAR_ICON} ${dates}</span>
              <div class="renter-bottom">
                <span class="renter-fee">${formatPeso(renter.fee)}</span>
                <div class="renter-actions">
                  <button type="button" class="btn btn-outline btn-sm btn-edit">${PENCIL_ICON} Edit</button>
                  <button type="button" class="btn btn-danger btn-sm btn-delete">${TRASH_ICON} Delete</button>
                </div>
              </div>
            </div>
          </li>`;
      })
      .join('');
  }
}

export default new RentersListView();
