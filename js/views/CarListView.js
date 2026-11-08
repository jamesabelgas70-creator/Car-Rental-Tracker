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

  addHandlerEdit(handler) {
  this._parentElement.addEventListener('click', e => {
    const btn = e.target.closest('.btn-edit');
    if (!btn) return;
    const id = Number(btn.closest('.car').dataset.id);
    const car = this._data.find(car => car.id === id);
    const name = prompt('Car name:', car.name);
    if (name === null) return;
    const rate = prompt('Daily rate:', car.dailyRate);
    if (rate === null) return;
    handler(id, name, Number(rate));
  });
}

  _generateMarkup() {
    return this._data
      .map(
        car => `
        <li class="car" data-id="${car.id}">
          ${car.name} - ₱${car.dailyRate}/day
          <button class="btn-edit">Edit</button>
          <button class="btn-delete">Delete</button>
        </li>`
      )
      .join('');
  }
}

export default new CarListView();