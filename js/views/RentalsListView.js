import View from './View.js';

class RentalsListView extends View {
  _parentElement;

  render(data = []) {
    if (typeof document !== 'undefined') {
      this._parentElement ??= document.querySelector('.rental-list');
    }

    if (!this._parentElement) return;
    super.render(data);
  }

  _generateMarkup() {
    if (!this._data || this._data.length === 0) {
      return '<li class="rental-empty">No rentals recorded yet.</li>';
    }

    return this._data
      .map(rental => {
        const carName = rental.carName || rental.car?.name || `Car #${rental.carId ?? 'Unknown'}`;
        const totalFee = Number(rental.totalFee ?? 0);

        return `
          <li class="rental" data-id="${rental.id}">
            <strong>${rental.customerName || 'Unknown customer'}</strong>
            <span> - ${carName}</span>
            <span> | ${rental.startDate || 'N/A'} to ${rental.endDate || 'N/A'}</span>
            <span> | ₱${totalFee.toFixed(2)}</span>
          </li>
        `;
      })
      .join('');
  }
}

export default new RentalsListView();