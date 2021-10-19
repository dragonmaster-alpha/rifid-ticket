var express = require('express');
var router = express.Router();

const { check, validationResult } = require('express-validator');

var User = require('../models/users')
var Ticket = require('../models/tickets')
var Company = require('../models/companies')
var Project = require('../models/projects')
var Setting = require('../models/settings')


const api = require('../functions')
const validateProfile = [
  api.authenticate(['employee', 'customer'], ["admin", "member", "auditor"]),
  check('name', 'Name must be at least 3 characters').isLength({ min: 3 }),
  check('email', 'Make sure you enter a valid email').isEmail(),
  check('phone', 'Please make sure you enter a valid Egyptian mobile number').isMobilePhone('ar-EG'),  
]


/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.isAuthenticated()) return res.redirect('/dashboard')
  res.render('index', { title: 'RFID Egypt - Ticketing System', redirect: req.query.redirect || null });
});


router.get('/email', function(req, res, next) {
  var jade = require('jade')
  var options = { title: 'New Account Created', 
                              name: (req.user && req.user.name) || "Sign In",
                              description1: "It is a service provided by RFID Solutions Egypt to follow the after-sales service Our policy is not only providing you with what you need, but also following up on all your needs even after the sale in order to provide the best possible service. ",
                              description2: "RFID solutions Egypt will be with you step by step and provide you with all the support you need, In case you need any technical support or any queries, you should only click on the link below and register your login.",
                              cta: "Set Password",
                              link: "https://google.com"
                            }

  var html = jade.renderFile('/home/mak/rfid/website/views/emailTemplate.jade', options)
  
  res.send(html)
  //res.render('emailTemplate', );
  
});



router.all('/dashboard', api.authenticate(['employee', 'customer'], ["admin", "member", "auditor"]), function(req, res, next) {

  var query = req.user.permissions == "admin" ? {} : { users: req.user._id }
  
  Ticket.find(query).then(tickets => {

    var ticketStats = {
      "Open": 0,
      "Closed": 0,
      "Pending Customer": 0,
      "In Progress": 0,
      total: 0,
      responseTime: {
        count: 0,
        value: 0
      },
      resolutionTime: {
        count: 0,
        value: 0
      },
      ratings: {
        count: 0,
        value: 0
      },
      reviews: [],
      projects: {},
      companies: {}
    }
    
    tickets.forEach(ticket => {
      
      ticketStats.total++
      ticketStats[ticket.status]++
      
      
      if(!ticketStats.projects[ticket.project.name]) ticketStats.projects[ticket.project.name] = 0
      if(!ticketStats.companies[ticket.company.name]) ticketStats.companies[ticket.company.name]= 0
      
      ticketStats.projects[ticket.project.name]++
      ticketStats.companies[ticket.company.name]++

      
      if(ticket.responseTime) {

          ticketStats.responseTime.value += parseInt(ticket.responseTime)  
          ticketStats.responseTime.count++
      }

      if(ticket.resolutionTime) {
        
          ticketStats.resolutionTime.value += parseInt(ticket.resolutionTime)  
          ticketStats.resolutionTime.count++
      }
      
      if(ticket.review && ticket.review.rating) {
        
          ticketStats.ratings.value += parseInt(ticket.review.rating)  
          ticketStats.ratings.count++
          ticketStats.reviews.push({
            
            name: ticket.review.name,
            company: ticket.company.name,
            description: ticket.review,
            rating: ticket.review.rating,
            ticketId: ticket._id, 
            
          })
      }      
      
    })
    
    
    if(req.user.role == "employee") {
      var query = req.user.permissions == "admin" ? {} : { _id: req.user.companies }      
      
      Company.find(query).then(async companies => {
        
        

        var otherStats = {
          projectByType: {},
          companies: companies.length,
          projects: 0,
          customers: await User.countDocuments({role: "customer"})
        }
        
        
        await new Promise(reso => {
          for(const company of companies) {

            
            otherStats.projects += company.projects.length
            for(const project of company.projects) {

              //let projByType = otherStats[project.type]
              if(!otherStats.projectByType[project.type]) otherStats.projectByType[project.type] = 0
              otherStats.projectByType[project.type]++

            }

          }
          reso(true)
        })

                
          ticketStats.responseTime.adjusted = api.timeConversion(ticketStats.responseTime.value).split(" ")
          ticketStats.resolutionTime.adjusted = api.timeConversion(ticketStats.resolutionTime.value).split(" ")
        
          res.render('d-main', { title: 'RFID Egypt - Dashboard', user: req.user, ticketStats, otherStats} );
                  
      })
      
      
    } else {   
      
      ticketStats.responseTime.adjusted = api.timeConversion(ticketStats.responseTime.value).split(" ")
      ticketStats.resolutionTime.adjusted = api.timeConversion(ticketStats.resolutionTime.value).split(" ")

      res.render('d-main', { title: 'RFID Egypt - Welcome', user: req.user, ticketStats: ticketStats} ); 
      
    }

  }).catch(err => {
    
    console.log(err)
    
    req.flash('danger', "couldn't get stats now, we are working to fix it as soon as possible")
    res.render('d-main', { title: 'RFID Egypt - Welcome', user: req.user } );
  })
  
});

router.get('/setPassword/:id', function(req, res, next) {
  var id = req.params.id || null;
  if(id) {
    User.findById(id).then(user => {
      if(user) {
        if(!!user.password) {
          return res.redirect('/')
        }
        res.render('setPassword', { title: 'RFID Egypt - Welcome', user: user, id} );
       } else { return res.redirect('/') }
    }).catch(err => {
      console.log(err)
      req.flash('danger', 'Error setting password, please try visiting the link sent to your email again.')
      res.redirect('/')
    })
  } else { res.redirect('/') }
  
});

router.get('/setPassword', function(req, res, next) {
  res.redirect('/') 
});

router.post('/setPassword', function(req, res, next) {
  var id = req.body.id || null;
  var pass1 = req.body.pass1 || null;
  var pass2 = req.body.pass2 || null;
  
  if(id && pass1 && pass2)
    {
      if(pass1 === pass2 && pass1.length > 7) {
        User.findById(id).then(user => {
          
          user.password = api.encrypt(pass1)
          user.save()
          
          req.isAuthenticated() && req.logout()
          req.flash('success', 'Password set, please login')
          res.redirect('/')
          
        }).catch(err => {
            console.log(err)
            req.flash('danger', 'Error setting password, please try visiting the link sent to your email again.')
            res.redirect('/')

        })
        
      } else {
        
        req.flash('danger', 'Passowrds must be at least 8 characters and must match')
        res.redirect('/setPassword/'+id)
      }
      
    }
});

router.get('/profile', api.authenticate(['employee', 'customer'], ["admin", "member", "auditor"]),  function(req, res, next) {
    Company.find({_id: req.user.companies}).then(companies => {
      
      res.render('d-profile', { title: 'Profile - RFID Egypt', user: req.user, companies });
      
    }).catch(err => {
      
        req.flash('danger', 'We are making some adjustments, please visiting your profile later')
        res.redirect('/dashboard')    
      
    })
});

router.get('/install', async function(req, res, next) { 
/*
    await Setting.create([
        {
          name: "supportType",
          label: "Installation",
          value: "Installation"
        },
        {
          name: "supportType",
          label: "Warranty",
          value: "Warranty"
        },
        {
          name: "supportType",
          label: "Maintenance 5/8",
          value: "Maintenance 5/8"
        },
        {
          name: "supportType",
          label: "Maintenance 24/7",
          value: "Maintenance 24/7"
        },
        {
          name: "supportType",
          label: "Study Case",
          value: "Study Case"
        },
        {
          name: "supportType",
          label: "Rent",
          value: "Rent"
        },
    ])
  */
  await User.create({
      name: 'Ahmed Mohsen',
      email: 'info@rfid-in-egypt.com',
      password: api.encrypt('rfidegypt123456'),
      active: true,
      role: "employee",
      permissions: "admin",
  })
  
  res.send('ok')

})

router.get('/notifications/add', api.authenticate(['employee', 'customer'], ["admin", "member", "auditor"]), async function(req, res, next) { 
    
    api.notify([req.user._id], "Let's go to tickets", "/tickets")
    res.send('ok')  
    
})

router.get('/notifications/read/all', api.authenticate(['employee', 'customer'], ["admin", "member", "auditor"]), async function(req, res, next) {
  
  
  let notifications = req.user.notifications
  for (let notification of notifications) {
    notification.active = false
  }
  
  req.user.save()    
  return res.send('ok') 
  
})

router.get('/notifications/clear/all', api.authenticate(['employee', 'customer'], ["admin", "member", "auditor"]), async function(req, res, next) {
  
  req.user.notifications = []
  req.user.save()    
  return res.send('ok') 
  
})

router.get('/notifications/read/:id', api.authenticate(['employee', 'customer'], ["admin", "member", "auditor"]), async function(req, res, next) {
  
  
  let id = req.params.id
  let notifications = req.user.notifications
  let notificationIndex = notifications.map(noti => noti._id).indexOf(id)
 
  if(notificationIndex == -1) return res.send('Notification not found')
  
  //notifications.splice(notificationIndex, 1)
  notifications[notificationIndex].active = false
  req.user.notifications = notifications
  req.user.save()
      
  return res.send('ok') 
  
})



router.post('/profile', validateProfile,  function(req, res, next) {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    errors.errors.forEach(err => {
      req.flash("danger", err.msg + " " + err.param);
    })

    return res.redirect('/profile');
    
  }
  
  let name = req.body.name || null
  let email = req.body.email || null
  let phone = req.body.phone || null
  
  if(name && email && phone) {
    
    User.findById(req.user._id).then(user => {
      
      user.name = name
      user.email = email
      user. phone = phone
      user.save().then(user => {
        
        req.flash('success', "Profile updated successfully")
        res.redirect('/profile')          
          
      }).catch(err => {
        
          req.flash('danger', "Email exists, please choose another one")
          res.redirect('/profile')          
      })
      
      
    
    }).catch(err => {
      
      req.flash('danger', "Couldn't update profile now. Please try again later")
      res.redirect('/dashboard')
      
    })

  } else { res.redirect('/profile') } 
      
});

router.get('/resetPassword/:id', api.authenticate(['employee', 'customer'], ["admin", "member", "auditor"]),  function(req, res, next) {
  
  var id = req.params.id || null
  if(id) {
    User.findById(id).then(user => {
      
      
      
      user.password = "",
      user.save();
      if(id == req.user._id) {
        
        var uid = req.user._id
        req.flash('warning', 'Please set your new password')
        req.logout();
        res.redirect('/setPassword/'+uid);
        
        
      } else {
        
        if(req.user.permissions == "admin") {
          
            let emailoptions = { title: 'Reset Password Request', 
                              name: user.name,
                              description1: "You have requested to reset your password. Please click on the link below to reset your password.",
                              description2: "Your old password is now ineffective.",
                              cta: "Set Password",
                              link: `https://tickets.rfidegypt.com/setPassword/${user._id}`
                            }

          
          api.sendMail({ emails: [user.email]}, "Reset Password", emailoptions).then(console.log).catch(console.log)

          req.flash("success", "Reset password link sent for " + user.name);
          res.redirect('/users')

          
        } else { res.redirect('/dashboard') }
      }
      
    }).catch(err => {
      console.log(err)
      req.flash('danger', "couldn't set password now")
      res.redirect("/dashboard")
    })
  } else {  res.redirect('/dashboard')  }
  
  
})



module.exports = router;
