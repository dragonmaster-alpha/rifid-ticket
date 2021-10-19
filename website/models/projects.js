var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create a schema
var projectsSchema = new Schema({
    name: { type:String, required: true, unique: true},
    description: String,
});


var Project = mongoose.model('Project', projectsSchema);
module.exports = Project



