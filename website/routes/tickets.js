var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
//var timeago = require("timeago-simple");

const { check, validationResult } = require('express-validator');
const api = require('../functions')



const validateTicket = [
    api.authenticate(['employee', 'customer'], ["member", "admin"]),
    check('title', 'Ticket must have a title').isLength({ min: 2 }),  
    check('company', 'Ticket must have a company').isLength({ min: 1 }),  
    check('project', 'Ticket must have a project').isLength({ min: 1 }),  
    check('message', 'Ticket must have a message with at least 2 characters').isLength({ min: 2 }),    
]



var Upload = require('../models/uploads');
var Ticket = require('../models/tickets');
var Company = require('../models/companies');
var Project = require('../models/projects');
var User = require('../models/users');

router.get('/removeAll', function (req, res, next) {
   Ticket.deleteMany({}).then(result => {
     res.redirect('/tickets') 
  })
})

router.get('/test', function (req, res, next) {
   Ticket.find().then(results => {
     /*
     console.log(result[0])
     console.log((Date.now()).toLocaleString())
     console.log(Date.now() - new Date(result[0].created_at).valueOf())
     */
     
     console.log(results.map(result => result.resolutionTime))
     res.send('ok')
  })
})



router.get('/', api.authenticate(['employee', 'customer'], ["auditor", "member", "admin"]), function(req, res, next) {  
  
  let query = req.user.permissions == "admin" ? {} : { users: req.user._id }
  Ticket.find(query).sort({'updatedAt':-1}).populate('company').populate('project').exec((err, tickets) => {

    if(err) {
       req.flash("danger", "Can't get tickets now. Please try again soon.");
       return res.redirect('/tickets');
    }
   
    res.render('d-tickets', { title: 'Tickets - RFID Egypt', user: req.user, tickets });
  })
});

router.get('/new', api.authenticate(['employee', 'customer'], ["member", "admin"]), function(req, res, next) {
  Project.find().then(projects => {
    Company.find().then(companies => {
      User.find().then(users => {
        
        res.render('d-new-ticket', { title: 'New Ticket - RFID Egypt', user: req.user, companies, projects, users });
        
   }).catch(err => {
        
       req.flash("danger", "Can't create new user now.");
       res.redirect('/tickets');

      })
    }).catch(console.log)
  }).catch(console.log)

});

router.get('/rate/:id', api.authenticate(['customer', 'employee'], ["member", "admin"]), function (req, res, next) {
  var id = req.params.id || null
  if(id) {
    Ticket.findById(id).then(ticket => {
      console.log(ticket.review)
      return res.render('d-rate-ticket', { title: 'Rate Ticket - RFID Egypt', user: req.user, ticket });
    }).catch(err =>{
      req.flash('danger', 'Sorry, we are undergoing some maintenance. Please try again soon.')
      res.redirect('/tickets')
    })
  } else { res.redirect('/dashboard') }  
})

router.get('/edit/:id', api.authenticate(['employee', 'customer'], ["member", "admin"]), function(req, res, next) {
  
  var id = req.params.id || null
  if(id) {
    Ticket.findById(id).then(ticket => {
       User.find().then(users => { 
         
         
         if(req.user._id.toString() == ticket.owner._id.toString() || req.user.permissions == "admin") {
           return res.render('d-edit-ticket', { title: 'Edit Ticket - RFID Egypt', user: req.user, users, ticket });
         }

         req.flash('danger', 'You are not authorized to edit this ticket')
         return res.redirect('/tickets');
         
       }).catch(err => {

         console.log(err)
         req.flash("danger", "Can't edit ticket now.");
         res.redirect('/tickets/'+id);

      })

    }).catch(err => {
      
        console.log(err)
       req.flash("danger", "Can't edit ticket now.");
       res.redirect('/tickets/'+id);
          
    })
    
  } else { res.redirect('/tickets/'); }


});

router.get('/close/:id', api.authenticate(['customer', 'employee'], ["member", "admin"]), function (req, res, next) {
  
  let id = req.params.id || null
  if(id) {

  if((req.user.role == "employee" && req.user.permissions == "admin") || 
     (req.user.role == "customer" && req.user.permissions == "member")) {

      
          Ticket.findOne({_id: id}).then(ticket => {
              
            if(ticket) {
              
              if(ticket.canClose) 
              {              
                  if(ticket.users.indexOf(req.user._id) > -1 || req.user.permissions == "admin") {

                    return res.render('d-close-ticket', { title: 'Close Ticket - RFID Egypt', user: req.user, ticket });

                  } else {

                    req.flash('danger', 'You are not authorized to close this ticket.')
                    res.redirect('/tickets')

                  }
                
              } else {
                
                req.flash('warning', 'Ticket must be reviewed before closing')
                res.redirect('/tickets/'+id)
                
              }            
            } else {
              
              req.flash('danger', 'Ticket doesn\'t exist')
              res.redirect('/tickets')
              
            }
            
          })

  } else { 
    req.flash('danger', 'You are not authorized to close a ticket.')
    res.redirect('/tickets') 
  }
    
   } else { res.redirect('/tickets') }
})

router.get('/pending/:id', api.authenticate(['employee'], ["member", "admin"]), function (req, res, next) {
  
  let id = req.params.id || null
  if(id) {
    
    Ticket.findById(id).then(ticket => {
        
        ticket.status = "Pending Customer";
        ticket.save();
        
        req.flash('success', 'Ticket status updated and customer emailed')
        res.redirect('/tickets/'+id)
      
       let to = {
          ticket: ticket._id,
          customersOnly: true
        }

        let emailOptions = {
          title: "Pending Action",
          description1: `Ticket "${ticket.title}" is requires an action from you.`,
          cta: "View Ticket",
          link: "https://tickets.rfidegypt.com/tickets/"+ ticket._id
        }

        let notification = {
          text: emailOptions.description1,
          link: emailOptions.link
        }

          api.sendMail(to, emailOptions.title, emailOptions, notification)

      
      
    }).catch(err => {
      
        req.flash('warning', 'We are undergoing some maintenance. If the problem persists, please contact support.')
        res.redirect('/tickets/')
      
    })
    
   } else { res.redirect('/tickets') }
})

router.get('/:id', api.authenticate(['employee', 'customer'], ["auditor", "member", "admin"]), function(req, res, next) {
  var id = req.params.id || null
  if(id && id.length > 10) {
  
    Ticket.findOne({ _id: id }).exec((err, ticket) => {  
    if(err) {
       req.flash("danger", "Can't get ticket now. Please try again soon.");
       return res.redirect('/tickets');
    }
    
    if(ticket) 
      {
        
        if(req.user.permissions != "admin" && ticket.users.indexOf(req.user._id) == -1) {
          req.flash("danger", "You are not authorized to view this ticket.");
          return res.redirect('/tickets');
        }
        
        var attachments = []
        ticket.threads = ticket.threads.map(thread => { 
          thread.attachments.forEach(attachment => attachments.push(attachment));
          //thread.comments.forEach(comment => comment.newtime = timeago.simple(new Date(comment.time).toUTCString()))
          //thread.timeFormatted = timeago.simple(new Date(thread.time).toUTCString()); 
          return thread 
        })
        
        if(ticket.responseTime) ticket.responseTimeN = api.timeConversion(ticket.responseTime)
        if(ticket.resolutionTime) ticket.resolutionTimeN = api.timeConversion(ticket.resolutionTime)
        
        return res.render('d-ticket', { title: 'Tickets - RFID Egypt', user: req.user, ticket, attachments });      
      }
      
       req.flash("danger", "Can't find requested ticket.");
       return res.redirect('/tickets');
      
  })
    
  } else {
      res.redirect('/tickets')
  }
});




router.post('/new', validateTicket, function(req, res, next) {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    errors.errors.forEach(err => {
      req.flash("danger", err.msg + " " + err.param);
    })
    return res.redirect('/tickets/new');  
  }
  
  Company.findOne({_id: req.body.company}).then(company => {
    
    var expirationDate = null;
    var startDate = null;
    var projectType = null;
    var contactPerson = null;
    var projectOnHold = null;
    
    company.projects.forEach(project => {
      if(project.project._id == req.body.project) {
        
        projectType = project.type
        expirationDate = project.expiration
        startDate = project.start || (Date.now() - 5000)
        contactPerson = project.contact
        projectOnHold = project.hold
        
      }
    })
    
    
    if(projectOnHold) {
      
      req.flash('warning', 'Project is on hold, you can\'t create new tickets')
      return res.redirect('/tickets')

    } 
    
    //If expired
    //expirationDate = expirationDate ? expirationDate : Date.now() - 1000
    //console.log(expirationDate)
    let cDate = Date.now()
    let projectExpired = cDate > Date.parse(expirationDate.toString())
    let projectNotStarted = cDate < Date.parse(startDate.toString())
    
    if(projectExpired || projectNotStarted) {
        
        projectExpired && req.flash('danger', 'Project "'+req.body.projectName+'" expired and you can no longer create new tickets for this project')
        projectNotStarted && req.flash('danger', 'Project "'+req.body.projectName+'" has not started and you can not create new tickets for this project')
        res.redirect('/tickets')
        
      } else {
    
      let users = req.body.users || []
      if(!users.length) {
        User.find({ projects: req.body.project, companies: req.body.company }).then(gusers => {
          let lastuser = gusers.length - 1
          gusers.forEach((user, i) => {
            users.push(user._id)
            i == lastuser && createTicket(users, projectType, contactPerson)
          })
        })
      } else {
        createTicket(users, projectType, contactPerson)
      }
        
    }

    
   })
 

  function createTicket(users, projectType, contactPerson) {
    
  Ticket.create({
    title: req.body.title,
    owner: req.user._id,    
    company: req.body.company,
    project: req.body.project,
    projectType: projectType,
    canClose: false,
    contact: contactPerson,
    users: users,
    priority: req.body.priority || 'medium',
    type: req.body.type || 'online',
    status: "Open",
    threads: [{
      user: req.user._id,
      time: Date.now(),
      message: req.body.message,
      attachments: req.body.files == undefined ? [] : req.body.files.split(","),
    }]
    
    
  }).then(ticket => {

      var ids = req.body.files == undefined ? null : req.body.files.split(",") 
    
      if (ids) {
        
        return Upload.updateMany(
          {_id: {$in: ids}},
          {$set: {ticket: ticket._id}},
          {"multi": true}
        ).then( updated => {
      
        req.flash("success", ticket.title + " has been added.");
        res.redirect('/tickets')
          

      }).catch(err => {
        
        req.flash("danger", ticket.title + " Problem saving attachments");
        res.redirect('/tickets')
        console.log(err)
      }) 
        
      }
      
        req.flash("success", ticket.title + " has been added.");
        res.redirect('/tickets')
    

    
    
        let to = { 
          users, 
          except: [req.user._id] 
        }

        let emailOptions = {
          title: "New Ticket",
          description1: `New ticket "${ticket.title}" was created by ${req.user.name}`,
          cta: "View Ticket",
          link: "https://tickets.rfidegypt.com/tickets/"+ ticket._id
        }

        let notification = {
          text: emailOptions.description1,
          link: emailOptions.link
        }

        api.sendMail(to, emailOptions.title, emailOptions, notification)      


    
  }).catch(err => {

      req.flash("danger", "Problem creating ticket, please try again");
      res.redirect('/tickets/new')

  });
  }
})

router.post('/edit/:id', api.authenticate(['employee', 'customer'], ["member", "admin"]), function(req, res, next) {  
  
  var id = req.params.id || null ;
  var title = req.body.title;
  var priority = req.body.priority;
  var type = req.body.type;
  var users = req.body.users ? typeof req.body.users == "object" ? req.body.users : [req.body.users] : null;
  
  if(id && title) {

    Ticket.findById(id).then(ticket => {
      if(ticket.users.indexOf(req.user._id) > -1 || req.user.permissions == "admin") {
        ticket.title = title
        ticket.priority = priority || ticket.priority 
        ticket.type = type || ticket.type
        if(users) ticket.users = users.map(user => mongoose.Types.ObjectId(user))
        ticket.save()
        
        req.flash("success", "Ticket editted");
        res.redirect("/tickets/"+id);
        
    
        let to = { 
          users, 
          except: [req.user._id] 
        }

        let emailOptions = {
          title: "Ticket Editted",
          description1: `"${ticket.title}" has been editted by ${req.user.name}`,
          cta: "View Ticket",
          link: "https://tickets.rfidegypt.com/tickets/"+ ticket._id
        }

        let notification = {
          text: emailOptions.description1,
          link: emailOptions.link
        }

        api.sendMail(to, emailOptions.title, emailOptions, notification)
        
        
      } else {
        
        req.flash('danger', 'You are not authorized to edit this ticket')
        return res.redirect('/tickets')
      }
      
      
    }).catch(err => {
        

        req.flash("danger", "Couldn't edit ticket now. Please try again.");
        res.redirect("/tickets/"+id);

        
      })
    
  } else { res.redirect('/tickets') }
  
})

router.post('/newReply/:id', api.authenticate(['employee', 'customer'], ["member", "admin"]), function(req, res, next) {
  
  var id = req.params.id || null;
  if(id) {
    if(req.body.message.length > 10) {
                                    
      Ticket.findById(id).then(ticket => {
        
        if(ticket.users.indexOf(req.user._id) > -1 || req.user.permissions == "admin") {
          
          ticket.threads.push({
            user: req.body.owner,
            message: req.body.message,
            attachments: req.body.files == undefined ? [] : req.body.files.split(",")                                    
           })  
                
        } else {

          req.flash('danger', 'You are not authorized to add to add a reply to this ticket')
          return res.redirect('/tickets')
          
        }

        if (req.user.role == "employee") {

            if(ticket.status == "Open") {
              
              let to = { users: ticket.users }

              let emailOptions = {
                title: "Ticket In Progress",
                description1: `Ticket "${ticket.title}" status is in progress. RFID Team are currently working to resolve this issue.`,
                cta: "View Ticket",
                link: "https://tickets.rfidegypt.com/tickets/"+ ticket._id
              }

              let notification = {
                text: emailOptions.description1,
                link: emailOptions.link
              }

              api.sendMail(to, emailOptions.title, emailOptions, notification)
              
            }
          
          ticket.status = "In Progress";
          ticket.responseTime = ticket.responseTime ? ticket.responseTime : Date.now() - new Date(ticket.created_at).valueOf();
          ticket.canClose = true;
          
        }
        
        if (req.user.role == "customer" && ticket.canClose) ticket.status = "In Progress";

        
        ticket.save()
        
        req.flash("success", "New message has been added.");
        res.redirect('/tickets/'+id)
        

        
            
        let to = { 
          users: ticket.users, 
          except: [req.user._id] 
        }

        let emailOptions = {
          title: "New Reply",
          description1: `New reply from ${req.user.name} to the ticket "${ticket.title}"`,
          cta: "View Ticket",
          link: "https://tickets.rfidegypt.com/tickets/"+ ticket._id
        }

        let notification = {
          text: emailOptions.description1,
          link: emailOptions.link
        }

        api.sendMail(to, emailOptions.title, emailOptions, notification)


        
      }).catch(err => {
        
        console.log(err);
        req.flash("danger", "Problem adding message, please try again.");
        return res.redirect('/tickets/'+id)
      })
      
      
    } else {
      
      req.flash("danger", "Problem adding message, please make sure at your message has at least 10 caharacters.");
      return res.redirect('/tickets/'+id)

    }
    
  } else { return res.redirect('/tickets/') }

})

router.post('/changeStatus/:id', api.authenticate(['employee', 'customer'], ["member", "admin"]), function(req, res, next) {
  
  var id = req.params.id || null;
  var status = req.body.status || null
  var resolved = req.body.resolved || null
  
  var validStatus = status == 'Open' || status == 'In Progress' || status == 'Closed'
  
  if(id && validStatus) {
    
      if(status == "Closed" && resolved == null) return res.redirect("/tickets/close/"+id)
      if(resolved == "false") { return res.redirect('/tickets') }
        
      Ticket.findById(id).then(ticket => {
        if(ticket.users.indexOf(req.user._id) > -1 || req.user.permissions == "admin") {
                    
          
          if(status == "Closed" && !ticket.canClose) {
            req.user.role == "employee" ? req.flash('warning', 'Must leave a comment or reply before ticket can be closed') : req.flash('warning', 'An employee must review the ticket first')
            return res.redirect('/tickets')
          }
          
          
          ticket.status = "Closed"
          ticket.resolutionTime = Date.now() - (new Date(ticket.created_at).valueOf()) - parseInt(ticket.responseTime)
          ticket.save()
          
          
          if(status == 'Closed' && req.user.role == 'customer') {
                
            req.flash("success", "Ticket status changed to "+req.body.status);    
            res.redirect("/tickets/rate/"+id);            
            
          } else {

              req.flash("success", "Ticket status changed to "+req.body.status);
              res.redirect("/tickets/"+id);
            
          }
          

          
          
        let to = { 
          users: ticket.users, 
          except: [req.user._id] 
        }

        let emailOptions = {
          title: "Ticket Status Changed",
          description1: ` ${req.user.name} changed ticket status to "${ticket.status}"`,
          cta: "View Ticket",
          link: "https://tickets.rfidegypt.com/tickets/"+ ticket._id
        }

        let notification = {
          text: emailOptions.description1,
          link: emailOptions.link
        }

        api.sendMail(to, emailOptions.title, emailOptions, notification)
          

      if(req.body.status == "closed") {
            

        let to = { users: ticket.users, customersOnly: true}

        let emailOptions = {
          title: "Ticket Rating",
          description1: `Ticket "${ticket.title}" has been closed. Your opinion is very valuable to us.`,
          cta: "Rate Ticket",
          link: "https://tickets.rfidegypt.com/tickets/rate/"+ ticket._id
        }
        
        let notification = { text: emailOptions.description1, link: emailOptions.link }

         api.sendMail(to, emailOptions.title, emailOptions, notification)
    }
      
        } else {

          req.flash('danger', 'You are not authorized to edit this ticket')
          return res.redirect('/tickets')
        }
        

        
      }).catch(err => {
        
        console.log(err);
        req.flash("danger", "Couldn't change ticket status now, please try again.");
        return res.redirect('/tickets/'+id)
      })
      
      
    
  } else { return res.redirect('/tickets/') }
  
  
})

router.post('/editMessage/', api.authenticate(['employee', 'customer'], ["member", "admin"]), function(req, res, next) {
  
  var ticketId = req.body.id || null;
  var threadId = req.body.threadId || null;
  var message = req.body.message || null;
  let authorized = false;
  
  if(ticketId && threadId && message) {

      Ticket.findById(ticketId).then(ticket => {
        ticket.threads.forEach((thread, i) => {

          if(thread._id.toString() == threadId) {

              if(req.user._id.toString() == thread.user._id.toString()) {

                          thread.message = message;
                          ticket.save()
                
                          req.flash("success", "Ticket thread has been updated.");
                          res.redirect('/tickets/'+ticketId)

                
                          let to = { 
                            users: ticket.users, 
                            except: [req.user._id] 
                          }

                          let emailOptions = {
                            title: "Ticket Thread Updated",
                            description1: `${req.user.name} editted thread message for "${ticket.title}"`,
                            cta: "View Ticket",
                            link: "https://tickets.rfidegypt.com/tickets/"+ ticket._id
                          }

                          let notification = {
                            text: emailOptions.description1,
                            link: emailOptions.link
                          }

                          api.sendMail(to, emailOptions.title, emailOptions, notification)
                

                      } else {

                          req.flash('danger', 'You are not allowed to edit this thread')
                          res.redirect('/tickets/'+ticketId)

                      }
                }
            })

      }).catch(err => {
        
        req.flash("danger", "Couldn't upddate ticket thread now, please try again.");
        return res.redirect('/tickets/'+ticketId)
      })
       
  } else { return res.redirect('/tickets/') }
  
})

router.post('/addComment/:id', api.authenticate(['employee'], ["auditor", "member", "admin"]), function(req, res, next) {
  
  var id = req.params.id || null;
  var threadId = req.body.threadId || null;
  var user = req.body.user || null;
  var comment = req.body.comment || null;
  
  
  if(id && user && comment) {  
      
    Ticket.findById(id).then(ticket => {
       
      if(ticket) {
 
        var lastOne = ticket.threads.length - 1
        return new Promise((resolve) => {
          ticket.threads.forEach((thread, i) => {
            if(thread._id.toString() == threadId.toString()) { ticket.threads[i].comments.push({ user: mongoose.Types.ObjectId(user), comment: comment}) }
            if(i == lastOne) resolve(true)
          })
          
      }).then(resolved => {
        
          if(resolved) {
            
            
            if(ticket.status == "Open") {
              
              let to = { users: ticket.users }

              let emailOptions = {
                title: "Ticket In Progress",
                description1: `Ticket "${ticket.title}" status is in progress. RFID Team are currently working to resolve this issue.`,
                cta: "View Ticket",
                link: "https://tickets.rfidegypt.com/tickets/"+ ticket._id
              }

              let notification = {
                text: emailOptions.description1,
                link: emailOptions.link
              }

              api.sendMail(to, emailOptions.title, emailOptions, notification)
              
            }
            
            
            ticket.status = "In Progress";
            ticket.canClose = true;
            ticket.responseTime = Date.now() - new Date(ticket.created_at).valueOf()
            ticket.save().then().catch(console.log)

            req.flash("success", "Comment has been added.");
            res.redirect('/tickets/'+id)
            
            
          
            let to = { 
              users: ticket.users, 
              employeesOnly: true, 
            }

            let emailOptions = {
              title: "New Comment Added",
              description1: ` ${req.user.name} added comment to ticket "${ticket.title}"`,
              cta: "View Ticket",
              link: "https://tickets.rfidegypt.com/tickets/"+ ticket._id
            }

            let notification = {
              text: emailOptions.description1,
              link: emailOptions.link
            }

            api.sendMail(to, emailOptions.title, emailOptions, notification)

            
            
            
            



           }
          })
        
        } else {

          req.flash("danger", "Error adding comment.");
          return res.redirect('/tickets/'+id)

        }
      
      }).catch(err => {
        
        console.log(err);
        req.flash("danger", "Couldn't add comment now, please try again.");
        return res.redirect('/tickets/'+id)
      })
       
  } else { return res.redirect('/tickets/') }
  
})

router.post('/rate/:id', api.authenticate(['customer'], ["member"]), function(req, res, next) {
  
  var id = req.params.id || null;
  var rating = req.body.rating || null;
  var details = req.body.details || null;
  
  if(id && rating.length && details.length) {
    
    
   
    Ticket.findById(id).then(ticket => {

      if(req.user.companies.indexOf(ticket.company._id.toString()) > -1)  {
        if(!ticket.review.rating) {
          
            ticket.review = {
              rating,
              description: details,
              name: req.user.name
            }

            ticket.save()
            
            req.flash('success', 'Thank you for your rating. We really value your opinion')
            res.redirect('/tickets')
        

            let to = { users: ticket.users, employeesOnly: true }

            let emailOptions = {
              title: "New Rating Received",
              description1: `${req.user.name} added rating to ticket "${ticket.title}"`,
              description2: details,
              cta: "View Rating",
              link: "https://tickets.rfidegypt.com/tickets/rate/"+ ticket._id
            }

            let notification = {
              text: emailOptions.description1,
              link: emailOptions.link
            }

            api.sendMail(to, emailOptions.title, emailOptions, notification)


        } else {
          
          req.flash('danger', 'Ticket has already been rated')
          res.redirect('/tickets/rate'+ticket._id)

          
        }
        
      } else {

        req.flash('danger', 'You are not authorized to rate this ticket')
        res.redirect('/tickets')
        
      }
      
    }).catch(err => {
      
      req.flash('danger', 'We are undergoing some maintenance now, sorry for any inconvinience. Please try again later')
      res.redirect('/tickets')
      
      
    })
    
  } else { res.redirect('/tickets') }
  
})





module.exports = router;