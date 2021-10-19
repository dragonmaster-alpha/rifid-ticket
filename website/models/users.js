var mongoose = require('mongoose'), 
     Schema = mongoose.Schema//,
     //passportLocalMongooseEmail = require('passport-local-mongoose-email');


// create a schema
var userSchema = new Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  title: { type: String },
  active: Boolean,
  phone: String,
  role: String,
  permissions: String,
  companies: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
  projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  notifications: [{
    text: String,
    link: String,
    active: Boolean,
    time: Date
  }]
}, { timestamps: { createdAt: 'created_at' } });


//userSchema.plugin(passportLocalMongooseEmail);
var User = mongoose.model('User', userSchema);

module.exports = User
