var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create a schema
var settingsSchema = new Schema({
    name: { type:String, required: true },
    label: { type:String, required: true, unique: true },
    value: { type:String, required: true, unique: true },
});


var Setting = mongoose.model('Setting', settingsSchema);
module.exports = Setting
