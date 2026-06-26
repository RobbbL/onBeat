class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.profileImage = data.profileImage;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.phone = data.phone;
        this.shippingAddress = data.shippingAddress;
        this.role = data.role;
    }
}

module.exports = User;