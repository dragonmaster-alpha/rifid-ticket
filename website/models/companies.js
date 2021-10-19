var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create a schema
var companiesSchema = new Schema({
    name: { type:String, required: true, unique: true},
    projects: [{
      project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, autopopulate: true },
      type: { type: String, required: true },
      start: { type: String, required: true },
      expiration: { type: String, required: true },
      hold: { type: String },
      contact:{ type: Schema.Types.ObjectId, ref: 'User' },
    }],
});

companiesSchema.plugin(require('mongoose-autopopulate'));
var Company = mongoose.model('Company', companiesSchema);
module.exports = Company






