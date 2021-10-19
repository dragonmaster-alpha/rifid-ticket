var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create a schema
var uploadsSchema = new Schema({
    name: { type:String, required: true },
    location: { type:String, required: true },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    deal: { type: Schema.Types.ObjectId, ref: 'Deal' },
});


var Upload = mongoose.model('Upload', uploadsSchema);
module.exports = Upload



