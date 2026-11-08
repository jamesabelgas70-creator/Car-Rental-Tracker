import * as model from './model.js';
import carDetailsView from './views/CarDetailsView.js';
import carFormView from './views/CarFormView.js';
import carListView from './views/CarListView.js';
import dateFilterView from './views/DateFilterView.js';
import renterFormView from './views/RenterFormView.js';
import rentersListView from './views/RentersListView.js';
import summaryView from './views/SummaryView.js';

// ===== Shared refresh =====

// Filter dates changed: fix the range, update limits, errors, chips and the summary line, then refresh the cards
const controlFilter = function () {
  const { startDate, endDate } = model.clearEarlyReturn(dateFilterView.getDates());
  const summary = model.getAvailabilitySummary(startDate, endDate);
  dateFilterView.setDates({ startDate, endDate });
  dateFilterView.setLimits(model.getDateLimits(startDate));
  dateFilterView.renderErrors(model.validateDates(startDate, endDate));
  dateFilterView.renderRange(summary);
  carListView.render({
    cars: model.getCarsWithStatus(startDate, endDate),
    noneAvailable: summary?.noneAvailable ?? false,
  });
};

// Quick chip "N days": the model works out the new range from the current pick-up date
const controlQuickRange = function (days) {
  dateFilterView.setDates(model.getQuickRange(dateFilterView.getDates().startDate, days));
  controlFilter();
};

// Everything that depends on cars or renters
const renderAll = function () {
  controlFilter();
  rentersListView.render(model.getRenterList());
  summaryView.render(model.getSummary());
  summaryView.renderDate(model.today());
};

// ===== Cars =====

// "+ Add car": empty form
const controlNewCar = function () {
  carFormView.open({ types: model.CAR_TYPES, car: {} });
};

// "View Details" on a card: that car with its status for the filter dates and its renters
const controlCarDetails = function (id) {
  const { startDate, endDate } = dateFilterView.getDates();
  const car = model.getCarDetails(id, startDate, endDate);
  if (car) carDetailsView.open(car);
};

// Edit in the details dialog: swap to the car form, prefilled with that car
const controlEditCar = function (id) {
  carDetailsView.close();
  carFormView.open({ types: model.CAR_TYPES, car: model.getCarFormData(id) });
};

// A photo was chosen and resized by the view: check it with the model, then show it or the error
const controlPhoto = function ({ image, error }) {
  carFormView.renderPhoto({ image, error: error || model.validateImage(image) });
};

const controlSaveCar = function (data) {
  const errors = model.validateCar(data);
  carFormView.renderErrors(errors);
  if (Object.keys(errors).length) return;

  const saved = data.id ? model.editCar(data) : model.addCar(data);
  if (!saved) return carFormView.renderErrors({ image: model.STORAGE_FULL });

  carFormView.close();
  renderAll();
};

// Delete in the details dialog: blocked (with a message in the dialog) while the car has renters
const controlDeleteCar = function (id) {
  if (!model.deleteCar(id)) {
    return carDetailsView.renderError('This car has renters, so it cannot be deleted.');
  }
  carDetailsView.close();
  renderAll();
};

// ===== Renters =====

// "Rent Now" on a card: car prefilled, dates copied from the filter
const controlNewRenter = function (carId) {
  const { startDate, endDate } = model.getPrefillRange(dateFilterView.getDates());
  renterFormView.open({ cars: model.state.cars, renter: { carId, startDate, endDate } });
  controlRenterDates(renterFormView.getData());
};

const controlEditRenter = function (id) {
  renterFormView.open({ cars: model.state.cars, renter: model.getRenter(id) });
  controlRenterDates(renterFormView.getData());
};

// Car or dates changed in the renter form: fix the range, update the limits and the live fee preview
const controlRenterDates = function ({ id, carId, startDate, endDate }) {
  const range = model.clearEarlyReturn({ startDate, endDate });
  renterFormView.setDates(range);
  renterFormView.setLimits(model.getDateLimits(range.startDate));
  renterFormView.renderPreview(model.getQuote(carId, range.startDate, range.endDate, id));
};

const controlSaveRenter = function (data) {
  const errors = model.validateRenter(data);
  renterFormView.renderErrors(errors);
  if (Object.keys(errors).length) return;

  const saved = data.id ? model.editRenter(data) : model.addRenter(data);
  if (!saved) return renterFormView.renderErrors({ name: model.STORAGE_FULL });

  renterFormView.close();
  renderAll();
};

const controlDeleteRenter = function (id) {
  model.deleteRenter(id);
  renderAll();
};

// ===== Start =====

const init = function () {
  model.loadState();
  dateFilterView.setDates(model.getDefaultRange()); // today -> tomorrow on every load
  renderAll();

  carListView.addHandlerNew(controlNewCar);
  carListView.addHandlerDetails(controlCarDetails);
  carListView.addHandlerAddRenter(controlNewRenter);
  carDetailsView.addHandlerEdit(controlEditCar);
  carDetailsView.addHandlerDelete(controlDeleteCar);
  carFormView.addHandlerPhoto(controlPhoto);
  carFormView.addHandlerSubmit(controlSaveCar);
  dateFilterView.addHandlerChange(controlFilter);
  dateFilterView.addHandlerQuickRange(controlQuickRange);
  renterFormView.addHandlerChange(controlRenterDates);
  renterFormView.addHandlerSubmit(controlSaveRenter);
  rentersListView.addHandlerEdit(controlEditRenter);
  rentersListView.addHandlerDelete(controlDeleteRenter);
};

init();
