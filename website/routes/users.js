var express = require('express');
var router = express.Router();
var passport = require('passport');

var api = require('../functions')

var User = require('../models/users')
var Ticket = require('../models/tickets')

const { check, validationResult } = require('express-validator');
const validateUsers = [
  api.authenticate(['employee'], ["admin"]),
  check('name', 'Name must be at least 3 characters').isLength({ min: 3 }),
  check('email', 'Make sure you enter a valid email').isEmail(),
  check('phone', 'Please make sure you enter a valid Egyptian mobile number').isMobilePhone('ar-EG'),
  check('type').isLength({ min: 3 }),
  check('permission').isLength({ min: 3 }),
  check('companies').isLength({ min: 3 }),  
]

var Companies = require('../models/companies');
var Projects = require('../models/projects');
var Users = require('../models/users');




router.get('/', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  Users.find().populate('companies').populate('projects').exec((err, users) => {
    if(err) {
        req.flash("danger", "Can't get users now.");
        return res.redirect('/users');
    }
    if(!users) return res.render('d-users', { title: 'Users - RFID Egypt', user: req.user, users: false} );
    var employees = users.filter(user => user.role == "employee")
    var customers = users.filter(user => user.role == "customer")
    
    res.render('d-users', { title: 'Users - RFID Egypt', user: req.user, customers, employees, users: true} );
  })
});

router.get('/new', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
   Projects.find().then(projects => {
     Companies.find().then(companies => {
      res.render('d-new-user', { title: 'New User - RFID Egypt', user: req.user, companies, projects });
    }).catch(err => {
        req.flash("danger", "Can't create new user now.");
        res.redirect('/users');
    })
  })
});


router.get('/edit/:name', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  var name = req.params.name || null
  
  if(name)
    {

    Users.findOne({name: name.replace(/\-/g, ' ')}).then(cuser => {
      
      if(!cuser) {
        req.flash("danger", "Selected user not found.");
        return res.redirect('/users');
       }
      
      Projects.find().then(projects => {
        Companies.find().then(companies => {
          res.render('d-edit-user', { title: 'Edit User - RFID Egypt', user: req.user, cuser, projects, companies } );
        })
      })
     }).catch(err => {
            req.flash("danger", "Can't edit selected user.");
            return res.redirect('/users');
      })
    } else { return res.redirect('/users') }
      
});

router.get('/pause/:id', api.authenticate(['employee'], ["admin"]), function (req, res, next) { 
  
  var id = req.params.id || null
  if(id) {
    
    User.findById(id).then(user => {
      
      user.active = false;
      user.save()
      
      req.flash('success', user.name + ' is now paused')
      res.redirect('/users')
      
      
    }).catch(err => {
      
      console.log(err)
      req.flash('danger', 'We are undergoing maintenance, please try again later.')
      res.redirect('/users')
      
    })
    
  } else { req.redirect("/users") }
  
})

router.get('/activate/:id', api.authenticate(['employee'], ["admin"]), function (req, res, next) { 
  
  var id = req.params.id || null
  if(id) {
    
    User.findById(id).then(user => {
      
      user.active = true;
      user.save()
      
      req.flash('success', user.name + ' is now active')
      res.redirect('/users')
      
      
    }).catch(err => { 
      
      console.log(err)
      req.flash('danger', 'We are undergoing maintenance, please try again later.')
      res.redirect('/users')
      
    })
    
  } else { req.redirect("/users") }
  
})

router.post('/new', validateUsers, function(req, res, next) {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    errors.errors.forEach(err => {
      req.flash("danger", err.msg + " " + err.param);
    })

    return res.redirect('/users/new');
    
  }
  
    if(req.body.permission == "admin" && req.body.type == "customer") {
      req.flash('danger', 'Customers can\'t be Admins')
      return res.redirect('/users/new/')
    }
  
  User.create({
    
    name: req.body.name.trim(),
    title: req.body.title,
    active: true,
    email: req.body.email.toLowerCase(),
    phone: req.body.phone,
    role: req.body.type,
    permissions: req.body.permission,
    companies: req.body.companies,
    projects: req.body.projects,
        
  }).then(user => {
      

       let to = { emails: [user.email] }

        let emailOptions = {
          title: "New Account",
          name: user.name,
          description1: `Support ticketing system is a service provided by RFID Solutions Egypt to follow the after-sales service for your solution. Our policy is not only providing you with what you need, but also following up on all your needs even after the sale in order to provide the best possible service.`,
          description2: `RFID Solutions Egypt will be with you step by step and provide you with all the support you need. In case you need any technical support or any queries, you should only click on the link below and register your login.`,
          cta: "Set Password",
          link: "https://tickets.rfidegypt.com/setPassword/"+ user._id
          
        }
        
          api.sendMail(to, emailOptions.title, emailOptions)

    
      req.flash("success", user.name + " has been added to "+ user.role+'s');
      res.redirect('/users')
    
      Ticket.find({company: req.body.companies, project: req.body.projects}).then(async tickets => {
        for(const ticket of tickets) {
          if(ticket.users.indexOf(user._id) == -1) {
              await new Promise(reso => {
                ticket.users.push(user._id)
                ticket.save().catch(console.log)
                reso()
              })
          }
        }
      }).catch(console.log)

  }).catch(err => {
    
      //req.flash("danger", JSON.stringify(err));  
      console.log(err)
      err.code == 11000 ? req.flash("danger", "Email "+ req.body.email + " already exists") : req.flash("danger", "Problem creating user, please try again later");
      res.redirect('/users/new')
    
  });
  
});




router.post('/edit/:id', validateUsers, function(req, res, next) {
  
  var id = req.params.id || null
  
  if(req.body.oldname) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

      errors.errors.forEach(err => {
        req.flash("danger", err.msg + " " + err.param);
      })

      return res.redirect('/users/edit/'+req.body.oldname);
    }
    
    if(req.body.permission == "admin" && req.body.type == "customer") {
      req.flash('danger', 'Customers can\'t be Admins')
      return res.redirect('/users/edit/'+req.body.oldname)
    }
   
  
  User.findByIdAndUpdate(id ,{

    name: req.body.name.trim(),
    title: req.body.title,
    email: req.body.email,
    phone: req.body.phone,
    role: req.body.type,
    permissions: req.body.permission,
    companies: req.body.companies,
    projects: req.body.projects,

  }).then(user => {

      req.flash("success", user.name + " has been edited");
      res.redirect('/users')

      Ticket.updateMany({}, { $pullAll: {users: [user._id] } } ).catch(console.log)
      Ticket.find({company: req.body.companies, project: req.body.projects}).then(async tickets => {
        for(const ticket of tickets) {
          if(ticket.users.indexOf(user._id) == -1) {
              await new Promise(reso => {
                ticket.users.push(user._id)
                ticket.save().catch(console.log)
                reso()
              })
          }
        }
      }).catch(console.log)
    
  }).catch(err => {
    
      //req.flash("danger", JSON.stringify(err));    
      err.code == 11000 ? req.flash("danger", "Name or email already exists") : req.flash("danger", "Problem editing user, please check your input");
      res.redirect('/users/edit/'+req.body.oldname)
    
  });
    
  } else { res.redirect('/users') }
  
});



router.post('/delete', api.authenticate(['employee'], ["admin"]), function(req, res, next) {

      var id = req.body.id || null
      if(id) {
          User.findByIdAndDelete(id).then(user => {
              if(user) { 
                req.flash('success', "User " + user.name + " deleted");
                return res.redirect('/users');
              }
              
              req.flash('danger', "Couldn't delete user");
              return res.redirect('/users');
          }).catch(err => {
              console.log(err)
              req.flash('danger', "Couldn't delete user");
              res.redirect('/users');
          })
        
      } else { res.redirect('/users') }

});




router.post('/login', function (req, res, next) { 
  let redirect = req.body.redirect || null
  
  passport.authenticate('local', function (err, user, info) { 
  
      if (!user) {
        
        req.flash('danger', 'Incorrect username or password')
        if(redirect.match(/null/g)) return res.redirect('/?redirect='+redirect.replace(/null/g, ""));
        if(redirect == null) return res.redirect('/');
        
        return res.redirect('/?redirect='+redirect); 

      } else {

      if(user == "inactive") {
        
        req.flash('danger', 'Your account is currently inactive.')
        res.redirect('/')
        
      }   
        
      req.logIn(user, function(err) {
          
          if (err) { return next(err); }
          return res.redirect(redirect ? redirect : '/dashboard');
        
        });
      }    
  })(req, res, next)
})


router.get('/signout', function(req, res){
  req.logout();
  res.redirect('/');
});




module.exports = router;
