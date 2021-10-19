var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create a schema
var contactsSchema = new Schema({
  
    name: { type: String, required: true, unique: true },
    mobile: String,
    email: String,
    title: String,
    company: String, //{ type: Schema.Types.ObjectId, ref: 'Company' },
    city: String,
  
}, { timestamps: { createdAt: 'created_at' } });


var Contact = mongoose.model('Contact', contactsSchema);
module.exports = Contact

