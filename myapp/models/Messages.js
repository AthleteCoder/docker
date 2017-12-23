var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Messages', new Schema({
    ChatText:String
}));
