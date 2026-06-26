class ForumPost{
    constructor(data){
        this.id = data.id;
        this.category = data.category;
        this.user_id = data.user_id;
        this.username = data.username;
        this.profileImage = data.profileImage;
        this.text = data.text;
        this.date = data.date;
    }
}

module.exports = ForumPost;