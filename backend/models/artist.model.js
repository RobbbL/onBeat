class Artist {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.image = data.image;
        this.description = data.description;
        this.biography = data.biography;
        this.awards = data.awards;
        this.politica = data.politica;
        this.genre = data.genre;
        this.decade = data.decade;
        this.titleimg = data.titleimg;
        this.likeCount = data.likeCount || 0;
    }
}

module.exports = Artist;