var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var errorsSchema = new Schema({
    title: String,
    time: Date,
    err: String
});


//var Error = mongoose.model('Error', errorsSchema);
//module.exports = Error

module.exports = errorsSchema;
