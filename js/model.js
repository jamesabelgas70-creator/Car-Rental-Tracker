export const state = {
    cars: [],
    rentals: [],
};

const saveState = function() {
    localStorage.setItem('carRental', JSON.stringify(state));
};

export const loadState = function() {
    const stored = localStorage.getItem('carRental');
    if (!stored) return;
    const data = JSON.parse(stored);
    state.cars = data.cars || [];
    state.rentals = data.rentals || [];
}

export const addCar = function(name, dailyRate) {
    const car = { id : Date.now(), name, dailyRate, available: true };
    state.cars.push(car);
    saveState();
}

export const addRental = function(rentalData) {
    const rental = { id: Date.now(), ...rentalData };
    state.rentals.push(rental);
    saveState();
}