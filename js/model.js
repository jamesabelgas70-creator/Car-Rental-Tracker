import { catalog } from './data/catalog.js';

const STORAGE_KEY = 'carRental';
const IMAGE_DIR = 'images/cars/';
const PLACEHOLDER = IMAGE_DIR + 'placeholder.jpg';
const DAY_MS = 24 * 60 * 60 * 1000;
const CONTACT_PATTERN = /^09\d{9}$/; // PH mobile, saved form: 11 digits starting with 09
const MAX_IMAGE_LENGTH = 300 * 1024; // a data URL over ~300 KB is too big to keep in localStorage

// The options for "Type of car"; the controller passes them to the car form
export const CAR_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Pickup', 'Van'];

export const STORAGE_FULL = 'Storage is full. Remove some photos or cars and try again.';

export const state = {
  cars: [],
  renters: [],
  seeded: false, // true once the catalog cars were added, so deleted ones never come back
};

// Returns true when saved. localStorage throws (QuotaExceededError) when it is full.
const saveState = function () {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

// Makes a change and saves it. If saving fails, the old cars and renters are put back,
// so the screen always matches what is really saved. Returns true when saved.
const commit = function (change) {
  const backup = { cars: [...state.cars], renters: [...state.renters] };
  change();
  if (saveState()) return true;
  state.cars = backup.cars;
  state.renters = backup.renters;
  return false;
};

// ===== Dates =====
// Dates are 'YYYY-MM-DD' strings everywhere. In this format they sort like the dates they stand for,
// so they are compared with < and <= directly. new Date('YYYY-MM-DD') is never used for comparing:
// it reads the date as UTC and can shift it by a day.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const pad = number => String(number).padStart(2, '0');

// Today from LOCAL date parts (toISOString() would give yesterday before 8 AM in the Philippines).
// Always called at the moment of checking, so a dialog left open past midnight uses the new day.
export const today = function () {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// 'YYYY-MM-DD' -> milliseconds at UTC midnight. No time zone is involved, so no day can shift.
const toUTC = function (date) {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

// Milliseconds at UTC midnight -> 'YYYY-MM-DD'
const fromUTC = function (ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

// A complete, real date. '' or a half-typed date is missing, and 2026-02-30 is not a real date.
const isValidDate = date => DATE_PATTERN.test(date) && fromUTC(toUTC(date)) === date;

// 'YYYY-MM-DD' plus a whole number of days (negative goes back). UTC math, so no daylight-saving or time-zone shift.
export const addDays = (date, days) => fromUTC(toUTC(date) + days * DAY_MS);

// Latest date anyone can book: one year from today
const maxDate = () => addDays(today(), 365);

// THE counting rule: both dates count. 10 Nov to 13 Nov = 4 days, a same-day rental = 1 day.
export const getDays = (startDate, endDate) => (toUTC(endDate) - toUTC(startDate)) / DAY_MS + 1;

// Two date ranges share at least one day (both ends count)
export const overlaps = (startA, endA, startB, endB) => startA <= endB && startB <= endA;

// 'Nov 10, 2026' for the model's own error messages (views format dates with helpers/format.js).
// timeZone UTC matches toUTC, so the day never shifts.
const formatDate = date =>
  new Date(toUTC(date)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

const hasErrors = errors => Object.keys(errors).length > 0;

// Checks a pick-up/return pair for the date filter and the renter form. Returns { field: message }.
// renterId (editing): a pick-up date that was NOT changed may be in the past (the rental already started).
export const validateDates = function (startDate, endDate, renterId = null) {
  const errors = {};
  const now = today();
  const max = maxDate();
  const original = state.renters.find(r => r.id === renterId);
  const startChanged = !original || startDate !== original.startDate;

  if (!isValidDate(startDate)) errors.startDate = 'Pick-up date is required.';
  else if (startChanged && startDate < now) errors.startDate = 'Pick-up date cannot be in the past.';
  else if (startDate > max) errors.startDate = 'Dates must be within the next year.';

  if (!isValidDate(endDate)) errors.endDate = 'Return date is required.';
  else if (isValidDate(startDate) && endDate < startDate) {
    errors.endDate = 'Return date cannot be before the pick-up date.';
  } else if (endDate > max) errors.endDate = 'Dates must be within the next year.';

  return errors;
};

// Quick chip "N days": both dates count, so return = pick-up + (N - 1). A missing pick-up date becomes today.
export const getQuickRange = function (startDate, days) {
  const start = isValidDate(startDate) ? startDate : today();
  return { startDate: start, endDate: addDays(start, days - 1) };
};

// When the pick-up date moves after the return date, the return date is cleared
export const clearEarlyReturn = ({ startDate, endDate }) => ({
  startDate,
  endDate: isValidDate(startDate) && isValidDate(endDate) && endDate < startDate ? '' : endDate,
});

// min/max for the date inputs: no past pick-up, return not before pick-up, nothing after one year
export const getDateLimits = function (startDate) {
  const now = today();
  const max = maxDate();
  return { startMin: now, startMax: max, endMin: isValidDate(startDate) ? startDate : now, endMax: max };
};

// The filter starts at today -> tomorrow on every page load (it is never saved)
export const getDefaultRange = function () {
  const now = today();
  return { startDate: now, endDate: addDays(now, 1) };
};

// Dates for a new renter, copied from the filter. A past (or missing) pick-up date becomes today.
export const getPrefillRange = function ({ startDate, endDate }) {
  const now = today();
  const start = isValidDate(startDate) && startDate >= now ? startDate : now;
  return { startDate: start, endDate: isValidDate(endDate) && endDate >= start ? endDate : '' };
};

// ===== Load / save =====

// One-time data fix for cars saved before `type` and `plate` existed.
// Only runs on loaded data; cars added through the form always need a typed type and plate.
const migrateOldCars = function () {
  const usedPlates = new Set(state.cars.map(car => car.plate).filter(Boolean));
  let next = 1001;

  state.cars.forEach(car => {
    // Same name as a catalog car = use its type (e.g. "Toyota Vios" -> Sedan), otherwise Sedan
    if (!car.type) car.type = catalog.find(item => item.name === car.name)?.type ?? 'Sedan';

    if (!car.plate) {
      while (usedPlates.has(`OLD ${next}`)) next++; // skip numbers another car already has
      car.plate = `OLD ${next}`;
      usedPlates.add(car.plate);
    }
  });
};

export const loadState = function () {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

  // Old saved cars may have no image, type or plate
  state.cars = (data.cars || []).map(car => ({ ...car, image: car.image || PLACEHOLDER }));
  migrateOldCars();

  // Older versions saved "rentals" with different field names; convert them to renters
  state.renters = (data.renters || data.rentals || []).map(r => ({
    id: r.id,
    name: r.name ?? r.customer ?? r.customerName ?? 'Unknown',
    contact: r.contact ?? '',
    carId: Number(r.carId),
    startDate: r.startDate ?? '',
    endDate: r.endDate ?? '',
    days: r.days ?? r.rentalDays ?? 0,
    dailyRate: Number(r.dailyRate ?? 0),
    fee: Number(r.fee ?? r.totalFee ?? 0),
  }));

  // Add the catalog cars once, even when older saved cars exist (skips names already saved).
  // Date.now() + i keeps every id different.
  if (!data.seeded) {
    const missing = catalog.filter(item => !state.cars.some(car => car.name === item.name));
    state.cars.push(...missing.map((car, i) => ({ id: Date.now() + i, ...car })));
  }
  state.seeded = true;

  saveState();
};

// ===== Cars =====

const normalizePlate = plate => plate.trim().toUpperCase();

// A real photo is an uploaded data URL or a catalog file path (the placeholder does not count)
const isRealPhoto = image =>
  image.startsWith('data:image/') || (image.startsWith(IMAGE_DIR) && image !== PLACEHOLDER);

// Returns an error message for the car photo, or '' when it is fine
export const validateImage = function (image = '') {
  if (!isRealPhoto(image)) return 'Please upload a photo of the car.';
  if (image.startsWith('data:') && image.length > MAX_IMAGE_LENGTH) {
    return 'Photo is still too large after resizing. Please choose another one.';
  }
  return '';
};

// Returns { field: message } for every problem; {} means valid. id is set only when editing.
export const validateCar = function ({ id, type, name, plate, dailyRate, image }) {
  const errors = {};
  if (!CAR_TYPES.includes(type)) errors.type = 'Please choose a type of car.';
  if (!name.trim()) errors.name = 'Model is required.';

  if (!plate.trim()) {
    errors.plate = 'Plate number is required.';
  } else if (state.cars.some(car => car.id !== id && normalizePlate(car.plate ?? '') === normalizePlate(plate))) {
    errors.plate = 'Another car already has this plate number.';
  }

  if (!(dailyRate > 0)) errors.dailyRate = 'Daily rate must be more than 0.';

  const imageError = validateImage(image);
  if (imageError) errors.image = imageError;
  return errors;
};

// Builds the saved car. Call only after validateCar returned {}.
const buildCar = ({ id, type, name, plate, dailyRate, image }) => ({
  id,
  name: name.trim(),
  type,
  plate: normalizePlate(plate),
  dailyRate,
  image,
});

// Both return false when storage is full (nothing is changed then)
export const addCar = data => commit(() => state.cars.push(buildCar({ ...data, id: Date.now() })));

export const editCar = function (data) {
  const index = state.cars.findIndex(car => car.id === data.id);
  if (index === -1) return false;
  return commit(() => {
    state.cars[index] = buildCar(data);
  });
};

// Values for the Edit form. image is '' when the car has no real photo yet, so the form asks for one.
export const getCarFormData = function (id) {
  const car = state.cars.find(car => car.id === id);
  if (!car) return {};
  return {
    id: car.id,
    type: car.type,
    name: car.name,
    plate: car.plate,
    dailyRate: car.dailyRate,
    image: isRealPhoto(car.image) ? car.image : '',
  };
};

// Returns false (and deletes nothing) when the car still has renters
export const deleteCar = function (id) {
  if (state.renters.some(renter => renter.carId === id)) return false;
  state.cars = state.cars.filter(car => car.id !== id);
  saveState();
  return true;
};

// ===== Availability =====

// The renter that blocks this car on any day of the range, or undefined. ignoreId skips the renter
// being edited. Stored dates count as inclusive for every renter; old renters without dates never block.
const findConflict = (carId, startDate, endDate, ignoreId = null) =>
  state.renters.find(
    r =>
      r.carId === carId &&
      r.id !== ignoreId &&
      r.startDate &&
      r.endDate &&
      overlaps(startDate, endDate, r.startDate, r.endDate)
  );

export const getAvailableCars = (startDate, endDate) =>
  state.cars.filter(car => !findConflict(car.id, startDate, endDate));

// First free day after a booking. Back-to-back bookings are skipped, so the date is really free.
const getAvailableAgain = function (carId, conflict) {
  let day = addDays(conflict.endDate, 1);
  let next;
  while ((next = findConflict(carId, day, day))) day = addDays(next.endDate, 1);
  return day;
};

// Every car with its status for the filter dates. Invalid dates: status for today, and no booking allowed.
export const getCarsWithStatus = function (startDate, endDate) {
  const datesValid = !hasErrors(validateDates(startDate, endDate));
  const from = datesValid ? startDate : today();
  const to = datesValid ? endDate : from;

  return state.cars.map(car => {
    const conflict = findConflict(car.id, from, to);
    return {
      ...car,
      booked: Boolean(conflict),
      availableAgain: conflict ? getAvailableAgain(car.id, conflict) : '', // 'YYYY-MM-DD' or ''
      needsDates: !datesValid,
      canBook: datesValid && !conflict,
    };
  });
};

// The line under the quick chips: { startDate, endDate, days, available, total, noneAvailable },
// or null while the filter dates are not valid
export const getAvailabilitySummary = function (startDate, endDate) {
  if (hasErrors(validateDates(startDate, endDate))) return null;
  const available = getAvailableCars(startDate, endDate).length;
  const total = state.cars.length;
  return { startDate, endDate, days: getDays(startDate, endDate), available, total, noneAvailable: total > 0 && available === 0 };
};

// One car for the details dialog: its status for the filter dates plus its renters (latest pick-up first)
export const getCarDetails = function (id, startDate, endDate) {
  const car = getCarsWithStatus(startDate, endDate).find(car => car.id === id);
  if (!car) return null;
  return { ...car, renters: getRenterList().filter(r => r.carId === id) };
};

// ===== Fees =====

// Days, rate and fee for a booking.
// Editing with the same car and dates: the stored values stay exactly as booked (old renters keep their count).
// Otherwise the days are recounted, using the stored booking-time rate for the same car,
// or the car's current rate for a new renter or a different car.
const priceFor = function ({ id, carId, startDate, endDate }) {
  const old = state.renters.find(r => r.id === id);
  const sameCar = old && old.carId === carId;
  if (sameCar && old.startDate === startDate && old.endDate === endDate) {
    return { days: old.days, dailyRate: old.dailyRate, fee: old.fee };
  }
  const dailyRate = sameCar && old.dailyRate ? old.dailyRate : state.cars.find(car => car.id === carId)?.dailyRate;
  const days = getDays(startDate, endDate);
  return { days, dailyRate, fee: days * dailyRate };
};

// { days, dailyRate, fee } for the live preview, or null while the car or dates are missing or invalid
export const getQuote = function (carId, startDate, endDate, renterId = null) {
  if (!state.cars.some(car => car.id === carId)) return null;
  if (hasErrors(validateDates(startDate, endDate, renterId))) return null;
  return priceFor({ id: renterId, carId, startDate, endDate });
};

// ===== Renters =====

// The ways people really type a PH mobile number -> one saved form '09XXXXXXXXX'.
// '0917 123 4567', '0917-123-4567', '(0917) 123.4567', '+63 917 123 4567', '639171234567', '9171234567'
// all become '09171234567'. Anything else is returned cleaned but unchanged, so validation rejects it.
export const normalizeContact = function (contact) {
  const digits = contact.trim().replace(/[\s().-]/g, '').replace(/^\+/, '');
  if (/^639\d{9}$/.test(digits)) return '0' + digits.slice(2);
  if (/^9\d{9}$/.test(digits)) return '0' + digits;
  return digits;
};

// Returns { field: message } for every problem; {} means valid. id is set only when editing.
export const validateRenter = function ({ id, name, contact, carId, startDate, endDate }) {
  const errors = validateDates(startDate, endDate, id);
  if (!name.trim()) errors.name = 'Renter name cannot be empty.';
  if (!contact.trim()) errors.contact = 'Contact number is required.';
  else if (!CONTACT_PATTERN.test(normalizeContact(contact))) {
    errors.contact = 'Enter a PH mobile number, e.g. 0917 123 4567 or +63 917 123 4567.';
  }

  if (!carId) {
    errors.carId = 'Please select a car.';
  } else if (!errors.startDate && !errors.endDate) {
    const conflict = findConflict(carId, startDate, endDate, id);
    if (conflict) {
      errors.carId = `This car is already booked from ${formatDate(conflict.startDate)} to ${formatDate(conflict.endDate)}.`;
    }
  }
  return errors;
};

// Builds the saved record. Call only after validateRenter returned {}.
const buildRenter = function ({ id, name, contact, carId, startDate, endDate }) {
  const { days, dailyRate, fee } = priceFor({ id, carId, startDate, endDate });
  return { id, name, contact: normalizeContact(contact), carId, startDate, endDate, days, dailyRate, fee };
};

// Both return false when storage is full (nothing is changed then)
export const addRenter = data => commit(() => state.renters.push(buildRenter({ ...data, id: Date.now() })));

export const editRenter = function (data) {
  const index = state.renters.findIndex(r => r.id === data.id);
  if (index === -1) return false;
  return commit(() => {
    state.renters[index] = buildRenter(data);
  });
};

export const deleteRenter = function (id) {
  state.renters = state.renters.filter(r => r.id !== id);
  saveState();
};

export const getRenter = id => state.renters.find(r => r.id === id);

// Computed from today's date every time, never stored.
// Upcoming = before pick-up, Active = pick-up to return (both days count), Returned = after return.
export const getRenterStatus = function (renter, day = today()) {
  if (day < renter.startDate) return 'Upcoming';
  if (day <= renter.endDate) return 'Active';
  return 'Returned';
};

// Renters ready for the list: car name, plate, hasDates and status added, latest pick-up first
export const getRenterList = () =>
  state.renters
    .map(r => {
      const car = state.cars.find(car => car.id === r.carId);
      return {
        ...r,
        carName: car?.name ?? 'Unknown car',
        carPlate: car?.plate ?? '',
        hasDates: isValidDate(r.startDate) && isValidDate(r.endDate), // old saved renters may have none
        status: getRenterStatus(r),
      };
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

// ===== Summary =====

// Numbers for the three summary cards. nextPickup is the earliest upcoming pick-up date, or ''.
export const getSummary = function () {
  const day = today();
  const withStatus = status => state.renters.filter(r => getRenterStatus(r, day) === status);
  const upcoming = withStatus('Upcoming');
  const carsOut = new Set(withStatus('Active').map(r => r.carId)).size; // each car counts once
  return {
    earnings: state.renters.reduce((sum, r) => sum + r.fee, 0),
    rentals: state.renters.length,
    carsOut,
    fleet: state.cars.length,
    utilization: state.cars.length ? Math.round((carsOut / state.cars.length) * 100) : 0, // 0 when there are no cars
    upcoming: upcoming.length,
    nextPickup: upcoming.map(r => r.startDate).sort()[0] ?? '',
  };
};

