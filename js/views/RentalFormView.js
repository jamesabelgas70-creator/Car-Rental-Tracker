// Owner: KINLEE - RentalFormView

class RentalFormView {
    _form;
    _cars = [];
    _submitHandler;

    render(cars = []) {
        this._cars = cars;

        if (!this._form) {
            const carList = document.querySelector('.car-list');
            if(!carList) {
                throw new Error('Car list element not found in the DOM.');
            }

            carlist.insertAdjacentHTML('afterend', this._generateFormMarkup());
            this._form = document.querySelector('.rental-form');
            this._form.addEventListener('submit', this._handleSubmit.bind(this));
            this._form.addEventListener('input', this._handleInput.bind(this));
            this._form.addEventListener('change', this._handleInput.bind(this));
        }

        this.renderCarOptions();
        this.updateRate();
        this.updateTotal();
    }    

    addHandlerSubmit(handler) {
        this._submitHandler = handler;
    }

    clearForm() {
    if (!this._form) return;

    this._form.reset();
    this._clearErrors();
    this._updateRate();
    this._updateTotal();
    }

    _generateMarkup() {
    const fields = [
        ['customerName', 'Customer Name', 'rental-customer-name', 'text', 'customer-name-error', 'autocomplete="name"'],
        ['carId', 'Select Car', 'rental-car', 'select', 'car-error'],
        ['startDate', 'Rental Start Date', 'rental-start-date', 'date', 'start-date-error'],
        ['endDate', 'Rental End Date', 'rental-end-date', 'date', 'end-date-error'],
        ['dailyRate', 'Daily Rental Rate', 'rental-daily-rate', 'number', 'daily-rate-error', 'min="0" step="any" readonly'],
    ];

    const inputs = fields.map(([name, label, id, type, errorId, attributes = '']) => `
        <div class="rental-field">
            <label for="${id}">${label}</label>
             ${type === 'select'
                ? `<select id="${id}" name="${name}" required aria-describedby="${errorId}">
                        <option value="">Select a car</option>
                    </select>`
                : `<input id="${id}" name="${name}" type="${type}" ${attributes}
                        required aria-describedby="${errorId}">`}
             <small id="${errorId}" class="field-error" aria-live="polite"></small>
            </div>`).join('');

    return `
        <form class="rental-form" novalidate>
            ${inputs}
            <p class="rental-total" aria-live="polite">
                Total Rental Fee:
                <output name="total" for="rental-start-date rental-end-date rental-daily-rate">₱0.00</output>
            </p>
            <button type="submit">Save Rental</button>
        </form>`;
    }

    _renderCarOptions() {
        const select = this._form.elements['carId'];
        const selectedCarId = select.value;
        select.replaceChildren(new Option('Select a car', ''));

        this._cars.forEach(car => {
            const option = new Option(`${car.name} - ₱${car.dailyRate}/day`, car.id);
            select.add(option);
        });

        if (this._cars.some(car => car.id === selectedCarId)) {
            select.value = selectedCarId;
        } else if (this._cars.length > 0) {
            select.value = this._cars[0].id;
        }

    }

    _handleFieldChange(event) {
        if (event.target.name === 'carId') this._updateRate
        if (event.target.name === 'startDate' || event.target.name === 'endDate') {
            this._form.elements.endDate.min = this._form.elements.startDate.value;
        }

        this.updateTotal();
        if (event.target.name) this.validateField(event.target.name);

    }

    handleSubmit(event) {
        event.preventDefault();
        this._clearErrors

        const customerName = this._form.elements.customerName.value.trim();
        const carId = this._form.elements.carId.value;
        const startDate = this._form.elements.startDate.value;
        const endDate = this._form.elements.endDate.value;
        const dailyRate = parseFloat(this._form.elements.dailyRate.value);
        const rentalDays = this._calculateRentalDays(startDate, endDate);
        let isValid = true;

        if (!customerName) {
            this._showError('customerName', 'Customer name is required.');
            isValid = false;
        }
        if (!carId) {
            this._showError('carId', 'Please select a car.');
            isValid = false;
        }  
        if (!startDate) {
            this._showError('startDate', 'Start date is required.');
            isValid = false;
        }
        if (!endDate) {
            this._showError('endDate', 'End date is required.');
            isValid = false;
        } else if (startDate && rentalDays === null) {
            this._showError('endDate', 'End date must be after start date.');
            isValid = false;
        }
        if (!Number.isFinite(dailyRate) || dailyRate < 0) {
            this._showError('dailyRate', 'Daily rate must be a non-negative number.');
            isValid = false;
        }
        if (rentalDays === null) isValid = false;

        this.updateTotal();
        if (!isValid) return;

        this._submitHandler?.({
            customerName,
            carId,
            startDate,
            endDate,
            dailyRate,
            rentalDays,
            totalFee: dailyRate * rentalDays,
        });

    }

    _validateField(name) {
        const value = {
            customerName: this._form.elements.customerName.value.trim(),
            carId: this._form.elements.carId.value,
            startDate: this._form.elements.startDate.value,
            endDate: this._form.elements.endDate.value,
            dailyRate: parseFloat(this._form.elements.dailyRate.value),
        };

        const errors = {
            customerName: !value.customerName ? 'Customer name is required.' : '',
            carId: !value.carId && this.cars.some(car => car.id === value.carId) ? 'Please select a car.' : '',
            startDate: !value.startDate ? 'Start date is required.' : '',
            endDate: !value.endDate ? 'End date is required.' : (value.startDate && this._calculateRentalDays(value.startDate, value.endDate) === null ? 'End date must be after start date.' : ''),
            dailyRate: !Number.isFinite(value.dailyRate) || value.dailyRate < 0 ? 'Daily rate must be a non-negative number.' : '',
        };

        if (errors[name] !== undefined) this._showError(name, errors[name]);
    
    }

    _updateRate() { 
        const car = this.cars.find(
            item => item.id === this._form.elements.carId.value
        );
        this._form.elements.dailyRate.value = car ? car.dailyRate : '';
        this.validateField('dailyRate');

    }

    _updateTotal() {
        const startDate = this._form.elements.startDate.value;
        const endDate = this._form.elements.endDate.value;
        const dailyRate = parseFloat(this._form.elements.dailyRate.value);
        const rentalDays = this._calculateRentalDays(startDate, endDate);
        const totalFee = Number.isFinite(dailyRate) && rentalDays !== null ? dailyRate * rentalDays : 0;
        this._form.querySelector('output[name="total"]').value = `₱${totalFee.toFixed(2)}`;

        totalFee.value = rentalDays !== null ? `₱${totalFee.toFixed(2)}` : '₱0.00';
        
    }

    _getRentalDays(startDate, endDate) {
        if (!startDate || !endDate) return null;
        const start = this.dateToDayNumber(startDate);
        const end = this.dateToDayNumber(endDate);
        if (start === null || end === null || end < start) return null;

        return end - start + 1;
    }

    _dateToDayNumber(dateString) {
        const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        const [_, year, month, day] = match;
        const timeStamp = Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day));
        const parseDate = new Date(timeStamp);
        if (
            parseDate.getUTCFullYear() !== parseInt(year) ||
            parseDate.getUTCMonth() + 1 !== parseInt(month) - 1 ||
            parseDate.getUTCDate() !== parseInt(day)
        ){
            return null;
        }

        return timeStamp / (1000 * 60 * 60 * 24);

    }

    showError(fieldName, message) {
        const field = this._form.elements[fieldName];
        const errorElement = this._form.querySelector(`#${this.getErrorId(fieldName)}-error`);
        field.setAttribute('aria-invalid', 'true');
        error.textContent = message;
    }

    _clearErrors() {
        [customerName, carId, startDate, endDate, dailyRate].forEach(fieldName => {
            this.showError(fieldName, '');
        });
    }

    _getErrorId(fieldName) {
        return {
            customerName: 'customer-name-error',
            carId: 'car-error',
            startDate: 'start-date-error',
            endDate: 'end-date-error',
            dailyRate: 'daily-rate-error',
        }[fieldName];
    }
}   
