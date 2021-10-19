const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = "a8hea9k218dh4l3Na9381J3n4ac9fe75";
const iv = "ia0d5g3k2l4oc6Gr";
const nodemailer = require("nodemailer");
const jade = require('jade')

const Users = require('./models/users');
const Tickets = require('./models/tickets');
const Tasks = require('./models/tasks');
const Trace = require('./models/trace');


function arrify(val) {
  var values = typeof val == 'object' ? val : [ val ? val : []];
  return values.map( item => item.toString() )
}


async function findUsers(to) {
  
  
  
  let mails =  arrify(to.emails)
  let users = arrify(to.users) 
  let except = arrify(to.except) 
  let query = {};
  

  
  if("ticket" in to) {
    let ticket = await Tickets.findById(to.ticket).catch(console.log)
    ticket.users.forEach(user => users.push(user))     
  }
  
  if("task" in to) {
    let task = await Tasks.findById(to.ticket).catch(console.log)
    users.push(task.employee._id)
    task.from && users.push(task.from)
  }
  
  if(to.employeesOnly) query.role = "employee";
  if(to.customersOnly) query.role = "customer";
  
  if(to.adminsOnly) query.permissions = "admin";
  if(to.membersOnly) query.permissions = "member";
  
  if(to.company) query.companies = to.company;
  if(to.project) query.projects = to.project;
  
  if(except.length) {
    let tempUsers = users;
    
    users = [];
    tempUsers.forEach(user => { except.indexOf(user) == -1 && users.push(user) })
  }
  
  if(users.length) {
    
    let dbUsers = await Users.find(query).where('_id').in(users).exec()
    dbUsers.forEach(user => { mails.push(user.email) })
    
  }
  
  console.log(to)
  
  return {ids: users, mails}
  
}

async function sendMail(to, subject, message, notification) {
  "use strict";

  /*
    
    emailto = {
          ticket: "ID",
          task: "ID",
          company: "ID",
          project: "ID",
          users: ['ID1', 'ID2', ...],
          emails: ['mah@ma.com', ...],
          except: ['USER IDs', ...],
          employeesOnly: true,
          customersOnly: true,
          adminsOnly: true,
          membersOnly: true,
        }

    emailoptions = { title, name, description1, description2, cta, link }
    notification: { text, link }
    api.sendEmail(emailTo, subject, emailoptions, notification)

  */

  let users = await findUsers(to)

  console.log('users: ')
  console.log(users)

  
  if(notification) {
    Users.find({ _id: users.ids }).then(async toupdate => {
      for(const user of toupdate) {
        
        user.notifications.push({ text: notification.text, link: notification.link, time: Date.now(), active: true })
        user.save()

      }
    })
  }
  
  let transporter = nodemailer.createTransport({
    host: "mail.rfid-in-egypt.com",
    port: 8889,
    secure: false,  // true for 465, false for other ports
    auth: {
      user: "tickets@rfid-in-egypt.com", 
      pass: "T@12345678" 
    }
  });


  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"RFID Egypt - Ticketing System" <tickets@rfid-in-egypt.com>', // sender address
    to:  "support@rfid-in-egypt.com, " + users.mails.join(', '), // list of receivers
    subject: subject, // Subject line
    html: jade.renderFile('/home/mak/rfid/website/views/emailTemplate.jade', message) // html body
  });


  if(info.response == "250 OK")
    {
        console.log('email sent')
        return true

    } else {

        console.log(JSON.stringify(info))
    }

  
}

const authenticate = (roles, permissions) => {
  return function (req, res, next) {
    if(req.isAuthenticated()) {
      if(roles.indexOf(req.user.role) != -1 && permissions.indexOf(req.user.permissions) != -1) {
        console.log(req.user.notifications)
        return next()          
      }

      req.flash('danger', 'you are not authorized to view this page')
      return res.redirect('/dashboard')
      
    } else {
      
      res.redirect('/'+"?redirect="+req.originalUrl)
    }    
  }
}

const encrypt = (pass) => {
   let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
   let encrypted = cipher.update(pass);
   encrypted = Buffer.concat([encrypted, cipher.final()]);
   return encrypted.toString('hex');  
} 

const decrypt = (pass) => {
 let encryptedText = Buffer.from(pass, 'hex');
 let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
 let decrypted = decipher.update(encryptedText);
 decrypted = Buffer.concat([decrypted, decipher.final()]);
 return decrypted.toString();
}

const timeConversion = (millisec) => {

        var seconds = (millisec / 1000).toFixed(0);

        var minutes = (millisec / (1000 * 60)).toFixed(0);

        var hours = (millisec / (1000 * 60 * 60)).toFixed(0);

        var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(0);
    
    
        //return (days > 0 ? days : "00")+":"+(hours > 0 ? hours : "00")+":"+(minutes > 0 ? minutes : "00")+":"+(seconds > 0 ? seconds : "00")

        if (seconds < 60) {
            return seconds + " Seconds";
        } else if (minutes < 60) {
            return minutes + " Minutes";
        } else if (hours < 24) {
            return hours + " Hours";
        } else {
            return days + " Days"
        }
    }

const notify = async (users, text, link) => {

  let usersToNotify = await Users.find({ _id: users})
  usersToNotify.forEach(user => {
  
    user.notifications.push({ text, link, time: Date.now(), active: true })
    user.save()
  
  })

}

const trace = async (action, user) => {

  if(!action || !user) return
  Trace.create({
    
    action: action,
    user: { name: user.name, id: user.id },
    time: Date.now()
    
  }).then(cs => console.log(cs)).catch(cs => console.log(cs))
  
}

module.exports = { sendMail, authenticate, encrypt, decrypt, timeConversion, notify, trace }
