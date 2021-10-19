var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create a schema
var leadsSchema = new Schema({
  
    contact: { type: Schema.Types.ObjectId, ref: 'Contact',  autopopulate: true },
    source: {
      name: { type: String, required: true },
      other: String,
    },
    company: { type: Schema.Types.ObjectId, ref: 'Company',  autopopulate: true },
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project',  autopopulate: true }],
    added_by: { 
      name: { type: String, required: true },
      id: { type: Schema.Types.ObjectId, ref: 'User' } 
    },
  
  
}, { timestamps: { createdAt: 'created_at' } });


leadsSchema.plugin(require('mongoose-autopopulate'));
var Lead = mongoose.model('Lead', leadsSchema);
module.exports = Lead
