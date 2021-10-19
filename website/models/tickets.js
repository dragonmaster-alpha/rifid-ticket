var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var ticketsSchema = new Schema({
  title: String,
  owner: { type: 'ObjectId', ref: 'User', autopopulate: true },
  users: [{ type: 'ObjectId', ref: 'User'}],
  priority: String,
  project: { type: 'ObjectId', ref: 'Project', autopopulate: true },
  company: { type: 'ObjectId', ref: 'Company', autopopulate: true },
  projectType: String,
  type: String,
  canClose: Boolean,
  contact: { type: 'ObjectId', ref: 'User', autopopulate: true },
  status: String,
  responseTime: String,
  resolutionTime: String,
  review: {
    rating: Number,
    description: String,
    name: String
  },
  threads: [{
    user: { type: 'ObjectId', ref: 'User', autopopulate: true },
    time: { type : Date, default: Date.now },
    message: String,
    attachments: [{ type: 'ObjectId', ref: 'Upload', autopopulate: true }],
    comments: [{
      user: { type: 'ObjectId', ref: 'User', autopopulate: true },
      comment: String,
      time: { type : Date, default: Date.now }
    }],
  }]
  
  
}, { timestamps: { createdAt: 'created_at' } });


ticketsSchema.plugin(require('mongoose-autopopulate'));
var Ticket = mongoose.model('Ticket', ticketsSchema);
module.exports = Ticket






