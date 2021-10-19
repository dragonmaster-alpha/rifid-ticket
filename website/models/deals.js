var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create a schema
var dealsSchema = new Schema({
  
    lead: { type: Schema.Types.ObjectId, ref: 'Lead',  autopopulate: true },
    deal_owner: {
      name: String,
      _id: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    probability: { type: Number, min: 0, max: 100 },
    project_type: String,
    stage: String,
    submit_time: Date,
    submit_by: Date,

    qualifications: {
      description: { type: String, required: true },
      emailed: { type: Boolean, required: true },
      replied: { type: Boolean, required: true },
      called: { type: Boolean, required: true },
      attachments: [{ type: Schema.Types.ObjectId, ref: 'Upload',  autopopulate: true }],
      submit_time: Date,
      submit_by: Date,
    },
  
    visit: {
      description: { type: String, required: true },
      
      visit_date:  { type: Date, required: true },
      visit_employees: [{
        name: String, 
        id: { type: Schema.Types.ObjectId, ref: 'User' }
      }],
      
      emailed: { type: Boolean, required: true },
      called: { type: Boolean, required: true },
      
      attachments: [{ type: Schema.Types.ObjectId, ref: 'Upload',  autopopulate: true }],
      submit_time: Date,
      submit_by: Date,    
      
    },
    offer: {
      
      description: { type: String, required: true },
      
      value: { type: String, required: true },
      emailed: { type: Boolean, required: true },
      
      attachments: [{ type: Schema.Types.ObjectId, ref: 'Upload',  autopopulate: true }],
      submit_time: Date,
      submit_by: Date,    
      
    },
    decision: {
      
      description: { type: String, required: true },
      
      emailed: { type: Boolean, required: true },
      feedback: { type: Boolean, required: true },
      
      attachments: [{ type: Schema.Types.ObjectId, ref: 'Upload',  autopopulate: true }],
      submit_time: Date,
      submit_by: Date,    
      
      
    },
    deal: {
      
      won: { type: Boolean, required: true },
      reason : String,
      notes: String,
      competitor: String,
    
    }
    
  
    
  
  
}, { timestamps: { createdAt: 'created_at' } });


dealsSchema.plugin(require('mongoose-autopopulate'));
var Deal = mongoose.model('Deal', dealsSchema);
module.exports = Deal
