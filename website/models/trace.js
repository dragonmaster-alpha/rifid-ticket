var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// create a schema
var traceSchema = new Schema({
    action: { type: String, required: true },
    user: {
      id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: String,
    },
    time: Date,
});

var Trace = mongoose.model('Trace', traceSchema);
module.exports = Trace






