import View from './View.js';

class CarListView extends View {
  _parentElement = document.querySelector('.car-list');

  _generateMarkup() {
    return this._data
      .map(
        car => `
        <li class="car" data-id="${car.id}">
          ${car.name} - ₱${car.dailyRate}/day
        </li>`
      )
      .join('');
  }
}

export default new CarListView();