class Order {
    constructor(data) {
        this.id = data.id;
        this.total = data.total;
        this.created_at = data.created_at;
        this.products = (data.products || []).map(p => ({
            product_name: p.product_name,
            price: p.price
        }));
    }
}

module.exports = Order;