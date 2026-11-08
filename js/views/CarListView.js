import View from './View.js';

class CarListView extends View {
  _parentElement = document.querySelector('.car-list');

  addHandlerDelete(handler) {
    this._parentElement.addEventListener('click', e => {
      const btn = e.target.closest('.btn-delete');
      if (!btn) return;
      handler(Number(btn.closest('.car').dataset.id));
    });
  }

  _generateMarkup() {
    return this._data
      .map(
        car => `
        <li class="car" data-id="${car.id}">
          ${car.name} - ₱${car.dailyRate}/day
          <button class="btn-delete">Delete</button>
        </li>`
      )
      .join('');
  }
}

export default new CarListView();