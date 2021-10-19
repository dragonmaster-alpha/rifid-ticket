var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create a schema
var tasksSchema = new Schema({
  
    type: { type:String, required: true },
    description: { type:String, required: true },
    contact: { type: Schema.Types.ObjectId, ref: 'Contact', autopopulate: true },
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    employee: { type: Schema.Types.ObjectId, ref: 'User', autopopulate: true },
    completedTime: String,
    status: String,
    uploads: [{ type: Schema.Types.ObjectId, ref: 'Upload', autopopulate: true }],
    comments: [{
      user: { 
        _id: { type: Schema.Types.ObjectId, ref: 'User' },
        name: String,
      },
      comment: String,
      time: Date
    }]
  
}, { timestamps: { createdAt: 'created_at' } });

tasksSchema.plugin(require('mongoose-autopopulate'));
var Task = mongoose.model('Task', tasksSchema);
module.exports = Task


