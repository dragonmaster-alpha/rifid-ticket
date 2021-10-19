var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var actionsSchema = new Schema({
    action: String,
    time: Date,
    userName: String
});


//var Action = mongoose.model('Action', actionsSchema);
//module.exports = Action

module.exports = actionsSchema
