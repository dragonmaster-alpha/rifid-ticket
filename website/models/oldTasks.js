var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//var User = require('./users')
//var Project = require('./projects')


// create a schema
var tasksSchema = new Schema({
    from: { type: 'ObjectId', ref: 'User' },
    to: { type: 'ObjectId', ref: 'User' },
    time: Date,
    project: { type: 'ObjectId', ref: 'Project' },
    status: String,
    details: {
      description: String,
      attachments: [String]
    }
  
});

//var Task = mongoose.model('Task', tasksSchema);
//module.exports = Task

module.exports = tasksSchema;
