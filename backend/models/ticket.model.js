class Ticket {
    constructor(data) {
        this.id = data.id;
        this.id_artista = data.id_artista;
        this.type = data.type;
        this.event_name = data.event_name;
        this.place = data.place;
        this.date = data.date;
        this.price = data.price;
        this.artist_name = data.artist_name;
    }
}

module.exports = Ticket;