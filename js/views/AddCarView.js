import View from './View.js';

class AddCarView extends View {
  _parentElement = document.querySelector('.add-car-form');

  addHandlerAdd(handler) {
    this._parentElement.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this._parentElement));
      handler(data.name, Number(data.dailyRate));
    });
  }

  renderError(message) {
    this._parentElement.querySelector('.error').textContent = message;
  }

  clearForm() {
    this._parentElement.reset();
  }
}

export default new AddCarView();