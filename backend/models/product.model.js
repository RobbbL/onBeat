class Product {
    constructor(data) {
        this.id = data.id;
        this.id_artista = data.id_artista;
        this.name = data.name;
        this.image = data.image;
        this.price = data.price;
        this.description = data.description;
        this.stock = data.stock;
    }
}

module.exports = Product;