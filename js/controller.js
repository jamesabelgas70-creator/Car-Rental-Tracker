import * as model from './model.js';
import carListView from './views/CarListView.js';
import addCarView from './views/AddCarView.js';
import rentalFormView from './views/RentalFormView.js';

const controlAddCar = function (name, dailyRate) {
  if (!name.trim()) return addCarView.renderError('Please enter a car name.');
  if (!(dailyRate > 0))
    return addCarView.renderError('Daily rate must be more than 0.');

  addCarView.renderError('');
  model.addCar(name.trim(), dailyRate);
  carListView.render(model.state.cars);
  addCarView.clearForm();
};

const controlAddRental = function (rentalData) {
  model.addRental(rentalData);
  rentalFormView.clearForm();
  rentalFormView.renderSuccess('Successfully rented!');
};

const init = function () {
  model.loadState();
  carListView.render(model.state.cars);
  rentalFormView.render(model.state.cars);
  addCarView.addHandlerAdd(controlAddCar);
  rentalFormView.addHandlerSubmit(controlAddRental);
  carListView.addHandlerDelete(controlDeleteCar);
};

const controlDeleteCar = function (id) {
  model.deleteCar(id);
  carListView.render(model.state.cars);
};

init();