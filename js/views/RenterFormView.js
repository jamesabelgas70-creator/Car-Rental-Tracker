// Owner: KINLEE - RenterFormView (add AND edit a renter, shown in a <dialog>)
import View from './View.js';
import { formatPeso } from '../helpers/format.js';

const FIELDS = ['name', 'contact', 'carId', 'startDate', 'endDate'];

class RenterFormView extends View {
  _parentElement = document.querySelector('.renter-dialog');

  constructor() {
    super();
    // Cancel just closes the dialog (Esc also closes it, built into <dialog>)
    this._parentElement.addEventListener('click', e => {
      if (e.target.closest('.btn-cancel')) this.close();
    });
  }

  // data = { cars, renter }. renter holds the prefilled values; it has an id only when editing.
  open(data) {
    this.render(data);
    this._parentElement.showModal();
  }

  close() {
    this._parentElement.close();
  }

  // Form values with ids as numbers (id is null for a new renter, carId is 0 when none is picked)
  getData() {
    const data = Object.fromEntries(new FormData(this._parentElement.querySelector('form')));
    return {
      id: Number(data.id) || null,
      name: data.name.trim(),
      contact: data.contact.trim(),
      carId: Number(data.carId),
      startDate: data.startDate,
      endDate: data.endDate,
    };
  }

  // Live preview: fires while the car or dates change
  addHandlerChange(handler) {
    this._parentElement.addEventListener('input', e => {
      if (['carId', 'startDate', 'endDate'].includes(e.target.name)) handler(this.getData());
    });
  }

  addHandlerSubmit(handler) {
    this._parentElement.addEventListener('submit', e => {
      e.preventDefault();
      handler(this.getData());
    });
  }

  // Only writes a value that changed, so it never interrupts someone typing a date
  setDates({ startDate, endDate }) {
    const inputs = this._parentElement.querySelector('form').elements;
    if (inputs.startDate.value !== startDate) inputs.startDate.value = startDate;
    if (inputs.endDate.value !== endDate) inputs.endDate.value = endDate;
  }

  // min/max values come from the controller (the model decides them)
  setLimits({ startMin, startMax, endMin, endMax }) {
    const { startDate, endDate } = this._parentElement.querySelector('form').elements;
    startDate.min = startMin;
    startDate.max = startMax;
    endDate.min = endMin;
    endDate.max = endMax;
  }

  // quote = { days, dailyRate, fee } from the model, or null (invalid dates: the preview is hidden)
  renderPreview(quote) {
    const box = this._parentElement.querySelector('.renter-total');
    box.hidden = !quote;
    if (!quote) return;
    const { days, dailyRate, fee } = quote;
    box.querySelector('output').value = `${days} ${days === 1 ? 'day' : 'days'} x ${formatPeso(dailyRate)} = ${formatPeso(fee)}`;
  }

  // Show each error in the <small> right under its field
  renderErrors(errors = {}) {
    const form = this._parentElement.querySelector('form');
    FIELDS.forEach(name => {
      const field = form.elements[name];
      field.setAttribute('aria-invalid', errors[name] ? 'true' : 'false');
      field.nextElementSibling.textContent = errors[name] || '';
    });
  }

  _generateMarkup() {
    const { cars, renter } = this._data;
    const isEdit = Boolean(renter.id);
    const options = cars
      .map(
        car => `
          <option value="${car.id}" ${car.id === renter.carId ? 'selected' : ''}>
            ${car.name} - ${formatPeso(car.dailyRate)}/day
          </option>`
      )
      .join('');

    return `
      <form class="renter-form" novalidate>
        <h2 id="renter-form-title">${isEdit ? 'Edit renter' : 'Add renter'}</h2>
        <input type="hidden" name="id" value="${renter.id ?? ''}" />

        <div class="field">
          <label for="renter-name">Renter name</label>
          <input id="renter-name" name="name" type="text" value="${renter.name ?? ''}" />
          <small class="field-error" aria-live="polite"></small>
        </div>

        <div class="field">
          <label for="renter-contact">Contact number</label>
          <input id="renter-contact" name="contact" type="tel" inputmode="tel" autocomplete="tel" maxlength="20"
            placeholder="0917 123 4567" value="${renter.contact ?? ''}" />
          <small class="field-error" aria-live="polite"></small>
        </div>

        <div class="field">
          <label for="renter-car">Car</label>
          <select id="renter-car" name="carId">
            <option value="">Select a car</option>
            ${options}
          </select>
          <small class="field-error" aria-live="polite"></small>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="renter-start">Pick-up date</label>
            <input id="renter-start" name="startDate" type="date" value="${renter.startDate ?? ''}" />
            <small class="field-error" aria-live="polite"></small>
          </div>
          <div class="field">
            <label for="renter-end">Return date</label>
            <input id="renter-end" name="endDate" type="date" value="${renter.endDate ?? ''}" />
            <small class="field-error" aria-live="polite"></small>
          </div>
        </div>

        <p class="renter-total" aria-live="polite" hidden><output></output></p>
        <p class="notice">Note: Gas is not included in the rental fee.</p>

        <div class="form-actions">
          <button type="button" class="btn btn-edit btn-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save changes' : 'Add renter'}</button>
        </div>
      </form>`;
  }
}

export default new RenterFormView();
