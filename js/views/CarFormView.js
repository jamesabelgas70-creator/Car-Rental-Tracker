// CarFormView: add AND edit a car, shown in a <dialog> (same pattern as RenterFormView)
import View from './View.js';

const FIELDS = ['type', 'name', 'plate', 'dailyRate', 'image'];
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB, checked before resizing
const MAX_WIDTH = 800;
const READ_ERROR = 'Could not read this image. Try another file.';
const DROP_ERROR = 'Drop an image file, or paste a copied image.';

// Reads the chosen file and shrinks it: max 800 px wide (same shape), saved as JPEG at 80% quality.
// Resolves with the data URL (usually under 100 KB) or rejects with a message for the user.
const resizePhoto = function (file) {
  if (!PHOTO_TYPES.includes(file.type)) {
    return Promise.reject(new Error('Please choose a JPG, PNG or WebP image.'));
  }
  if (file.size > MAX_FILE_SIZE) {
    return Promise.reject(new Error('Photo is too large. Please choose one under 5 MB.'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(new Error(READ_ERROR)));
    reader.addEventListener('load', () => {
      const img = new Image();
      img.addEventListener('error', () => reject(new Error(READ_ERROR)));
      img.addEventListener('load', () => {
        const scale = Math.min(1, MAX_WIDTH / img.width); // never make small photos bigger
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; // JPEG has no transparency, so see-through PNG parts become white, not black
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      });
      img.src = reader.result;
    });
    reader.readAsDataURL(file);
  });
};

class CarFormView extends View {
  _parentElement = document.querySelector('.car-dialog');
  _image = ''; // the photo that will be saved: the car's current photo, or the newly resized one
  _photoHandler = null; // the controller's function for a resized photo (set by addHandlerPhoto)
  _dragDepth = 0; // counts dragenter/dragleave so moving over the zone's children doesn't flicker

  constructor() {
    super();
    const dialog = this._parentElement;

    dialog.addEventListener('click', e => {
      // Cancel just closes the dialog (Esc also closes it, built into <dialog>)
      if (e.target.closest('.btn-cancel')) this.close();
      // "Browse photos" / "Change photo" opens the hidden file input's picker
      if (e.target.closest('.btn-browse')) dialog.querySelector('input[type="file"]').click();
    });

    // A file was chosen in the picker. Cancelling the picker gives no file, so the current photo stays.
    dialog.addEventListener('change', e => {
      if (e.target.name !== 'image') return;
      const file = e.target.files[0];
      e.target.value = ''; // empty the input so picking the same file again still counts as a change
      if (file) this._handleFile(file);
    });

    // A file dropped anywhere in the dialog (or on its dark backdrop) must not open in the browser tab
    ['dragover', 'drop'].forEach(type => dialog.addEventListener(type, e => e.preventDefault()));

    // The paste listener only lives while the dialog is open ('close' also fires when Esc closes it)
    dialog.addEventListener('close', () => dialog.removeEventListener('paste', this._onPaste));
  }

  // data = { types, car }. car holds the prefilled values; it has an id only when editing.
  // car.image is '' when the car has no real photo yet. Re-rendering clears any old photo or error.
  open(data) {
    this._image = data.car.image || '';
    this.render(data);
    this._bindDropZone();
    this._parentElement.addEventListener('paste', this._onPaste);
    this._parentElement.showModal();
  }

  close() {
    this._parentElement.close();
  }

  // Form values (id is null for a new car). image is a data URL or the car's existing photo path.
  getData() {
    const data = Object.fromEntries(new FormData(this._parentElement.querySelector('form')));
    return {
      id: Number(data.id) || null,
      type: data.type,
      name: data.name.trim(),
      plate: data.plate.trim(),
      dailyRate: Number(data.dailyRate),
      image: this._image,
    };
  }

  // The controller's handler receives { image } (a resized data URL) or { error }
  addHandlerPhoto(handler) {
    this._photoHandler = handler;
  }

  addHandlerSubmit(handler) {
    this._parentElement.addEventListener('submit', e => {
      e.preventDefault();
      handler(this.getData());
    });
  }

  // Accepted photo: keep it and show it in the zone. Rejected: show the error and keep the old photo.
  renderPhoto({ image, error = '' }) {
    const form = this._parentElement.querySelector('form');
    const input = form.elements.image;
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    input.nextElementSibling.textContent = error;
    if (error) return;

    this._image = image;
    const zone = form.querySelector('.drop-zone');
    zone.classList.add('is-filled');
    zone.querySelector('.photo-preview').src = image;
    zone.querySelector('.btn-browse').textContent = 'Change photo';
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

  // The ONE pipeline for chosen, dropped and pasted files: check, read, resize, then hand to the controller
  async _handleFile(file) {
    if (!file) return this._photoHandler?.({ error: READ_ERROR });
    try {
      this._photoHandler?.({ image: await resizePhoto(file) });
    } catch (err) {
      this._photoHandler?.({ error: err.message });
    }
  }

  // Paste: only take over when the clipboard holds an image; plain text pastes normally into the fields.
  // Arrow function, so `this` is the view and the same function can be removed again on close.
  _onPaste = e => {
    const item = [...e.clipboardData.items].find(item => item.type.startsWith('image/'));
    if (!item) return;
    e.preventDefault();
    this._handleFile(item.getAsFile());
  };

  // Drag and drop on the zone. The zone is re-created on every open, so its old listeners disappear with it.
  _bindDropZone() {
    const zone = this._parentElement.querySelector('.drop-zone');
    this._dragDepth = 0;

    // Entering the zone or one of its children: +1. Leaving one: -1. Only 0 means really outside.
    zone.addEventListener('dragenter', e => {
      e.preventDefault();
      this._dragDepth++;
      zone.classList.add('is-dragover');
    });
    zone.addEventListener('dragleave', () => {
      this._dragDepth--;
      if (this._dragDepth === 0) zone.classList.remove('is-dragover');
    });
    zone.addEventListener('dragover', e => e.preventDefault()); // needed, or the drop is not allowed
    zone.addEventListener('drop', e => {
      e.preventDefault();
      this._dragDepth = 0;
      zone.classList.remove('is-dragover');
      // Several files: only the first is used. A picture dragged from a website is a link, not a file.
      const file = e.dataTransfer.files[0];
      if (file) this._handleFile(file);
      else this._photoHandler?.({ error: DROP_ERROR });
    });
  }

  _generateMarkup() {
    const { types, car } = this._data;
    const isEdit = Boolean(car.id);
    const typeOptions = types
      .map(type => `<option value="${type}" ${type === car.type ? 'selected' : ''}>${type}</option>`)
      .join('');

    return `
      <form class="car-form" novalidate>
        <h2 id="car-form-title">${isEdit ? 'Edit car' : 'Add car'}</h2>
        <input type="hidden" name="id" value="${car.id ?? ''}" />

        <div class="field">
          <label for="car-type">Type of car</label>
          <select id="car-type" name="type">
            <option value="">Select a type</option>
            ${typeOptions}
          </select>
          <small class="field-error" aria-live="polite"></small>
        </div>

        <div class="field">
          <label for="car-name">Model</label>
          <input id="car-name" name="name" type="text" placeholder="Toyota Raize" value="${car.name ?? ''}" />
          <small class="field-error" aria-live="polite"></small>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="car-plate">Plate number</label>
            <input id="car-plate" name="plate" type="text" class="input-plate" placeholder="ABC 1234"
              value="${car.plate ?? ''}" />
            <small class="field-error" aria-live="polite"></small>
          </div>
          <div class="field">
            <label for="car-rate">Daily rate (₱)</label>
            <input id="car-rate" name="dailyRate" type="number" min="1" placeholder="1500"
              value="${car.dailyRate ?? ''}" />
            <small class="field-error" aria-live="polite"></small>
          </div>
        </div>

        <div class="field">
          <label for="car-photo">Upload photo</label>
          <div class="drop-zone ${car.image ? 'is-filled' : ''}">
            <div class="drop-empty">
              <svg class="drop-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20.4 18.4A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 3 16.3" />
                <path d="M12 12v9" />
                <path d="M8 16l4-4 4 4" />
              </svg>
              <p class="drop-text">
                <span class="drop-text-normal">Drag &amp; drop a photo here</span>
                <span class="drop-text-over">Drop the photo to upload</span>
              </p>
              <p class="drop-or">or</p>
            </div>
            <img class="photo-preview" ${car.image ? `src="${car.image}"` : ''} alt="Selected car photo" />
            <button type="button" class="btn btn-browse">${car.image ? 'Change photo' : 'Browse photos'}</button>
            <p id="car-photo-hint" class="drop-hint">You can also paste an image with Ctrl+V.</p>
          </div>
          <!-- Hidden but still in the page; the Browse button is the keyboard way in -->
          <input id="car-photo" name="image" type="file" accept="image/jpeg,image/png,image/webp"
            class="visually-hidden" tabindex="-1" aria-describedby="car-photo-hint" />
          <small class="field-error" aria-live="polite"></small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-edit btn-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save changes' : 'Add car'}</button>
        </div>
      </form>`;
  }
}

export default new CarFormView();
