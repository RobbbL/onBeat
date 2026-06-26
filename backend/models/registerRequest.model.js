class RegisterRequest {
    constructor(data) {
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.phone = data.phone;
        this.shippingAddress = data.shippingAddress;
    }
}

module.exports = RegisterRequest;