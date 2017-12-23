var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
    username:String,
    lastname:String,
    Email:String,
    name: String,
    password: String,
    admin: Boolean
}));
