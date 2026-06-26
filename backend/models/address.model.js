class Address {
    constructor(data) {
        this.street = data.street;
        this.streetNumber = data.streetNumber;
        this.city = data.city;
        this.provinceCode = data.provinceCode;
        this.zipcode = data.zipcode;
        this.country = data.country;
    }
}

module.exports = Address;