var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/rfid', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true });


var userSchema = require('./users');
var ticketsSchema = require('./tickets');
var tasksSchema = require('./tasks');
var projectsSchema = require('./projects');
var actionsSchema = require('./actions');
var errorsSchema = require('./errors');


var User = mongoose.model('User', userSchema);
var Project = mongoose.model('Project', projectsSchema);
var Task = mongoose.model('Task', tasksSchema);
var Ticket = mongoose.model('Ticket', ticketsSchema);
var Error = mongoose.model('Error', errorsSchema);
var Action = mongoose.model('Action', actionsSchema);


var svd = (e) => console.log(e ? e : "saved")

console.log('there');




//mimick actions all together

/*

New User



New Ticket 




*/






var chris = new User({
  name: 'Ahmed Mohsen',
  email: 'baaaaaalako',
  password: 'waaaaalkoa',
  phone: 122211221,
  company: "RFID Egypt"
})

var john = new User({
  name: 'John',
  email: 'baaaaaalakomore',
  password: 'waaaaalkoa',
  phone: 1222112213,
  company: "AhmedCo"
})

var abenol = new Project({
    name: "abenol construction",
    customer: john,
    subscriptionType: "Normal",
    subsctiptionDuration: Date.now(),
});

var ebnol = new Ticket({
  user: chris,
  involvedUsers: [chris, john],
  priority: "High",
  projects: [abenol],
  type: "important",
  time: Date.now(),
  status: "active",
})

var make = new Action({
    action: "Added new user and record",
    time: Date.now(),
    userName: "TESTERONE"
});


(async () => {
  
/*
  
await chris.save(svd)
await john.save(svd)
await abenol.save(svd)
await ebnol.save(svd)
await make.save(svd)
*/
  
    User.findById("5dbda2ce24ee2a417743a4ba", (err, user) => {
       
       if(err) console.log(err)
      
        let thread = {
            user: mongoose.Types.ObjectId("5dbda2ce24ee2a417743a4ba"),
            time: Date.now(),
            details: "Hello there ",
          }
        
        
        var ticket = {
              priority: "high",
              type: "page",
              time: Date.now(),
              status: "open",
               threads: (user.threads ? user.threads.push(thread) : user.threads = thread)
            }
         
        var tm = new Ticket(ticket)
        
        tm.save((err, data) => {
          
          console.log(data._id)
          user.tickets = user.tickets.push(mongoose.Types.ObjectId(data._id))
          user.save(svd)
          
        })
      


        
        
      /*
        ttickets.push()
      */
      
        
      
      
      

      
        

      
       console.log("done")
      
  }) 
 
  
  /*
  
  User.findByIdAndUpdate("5dbda2ce24ee2a417743a4ba", { $set: {"$push": { "tickets": {
      priority: "high",
      type: "page",
      time: Date.now(),
      status: "open",
     threads: { $set: {"$push": {
        user: "5dbda2ce24ee2a417743a4ba",
        time: Date.now(),
        details: "Hello there ",
        comments: [{
            from: "5dbda2ce24ee2a417743a4ba",
            comment: "Hey there",
            time: Date.now()
        }]
      }}} 
    }}}}, (err, data) => {
    console.log(err, data)
  })
  */
 // mongoose.connection.close()
})()



