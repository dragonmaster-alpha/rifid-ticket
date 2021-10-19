var express = require('express');
var router = express.Router();

var Contacts = require('../models/contacts');
var Users = require('../models/users');

const api = require('../functions')
const { check, validationResult } = require('express-validator');

router.get('/', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  Contacts.find().then(contacts => {
    
    if(!contacts) {
      req.flash('danger', 'No contacts found')
      res.render('d-contacts', { title: 'Contacts - RFID Egypt', user: req.user });
    }
      contacts.sort((a,b) => {
        let sa = a.name.trim().toLowerCase()
        let sb = b.name.trim().toLowerCase()
        
         return sa > sb ? 1 : (sa == sb ? 0 : -1)
      })
      res.render('d-contacts', { title: 'Contacts - RFID Egypt', user: req.user, contacts });
  }).catch(err => {
      req.flash("danger", "Problem fetching contacts.");
      res.redirect('/dashboard');
  })
});

router.get('/new', function(req, res, next) {
  res.render('d-new-contact', { title: 'New Contact - RFID Egypt', user: req.user} );
});


router.get('/edit/:name', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  var name = req.params.name || null
  if(name) {
      Contacts.findOne({name: name.replace(/\-/g, ' ')}).then(contact => {
          if(contact) return res.render('d-edit-contact', { title: 'Edit Contact - RFID Egypt', user: req.user, contact} );
          req.flash('danger', "Couldn't find requested contact");
          return res.redirect('/contact');
      }).catch(err => {
          req.flash('danger', "Couldn't find requested contact");
          res.redirect('/contacts');
      })
  } else { res.redirect('/contacts') }  
});




router.post('/new', [
  api.authenticate(['employee'], ["admin"]),
  check('name', 'Name must be at least 3 characters').isLength({ min: 3 }),
  check('email', 'Make sure you enter a valid email').isEmail(),
  check('phone', 'Please make sure you enter a valid Egyptian mobile number').isMobilePhone('ar-EG')],
  function(req, res, next) {
  
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    errors.errors.forEach(err => {
      req.flash("danger", err.msg + " " + err.param);
    })

    return res.redirect('/contacts/new');

  }
   
  
  let contact = {}
  contact.name = req.body.name.toLowerCase()
  contact.mobile = req.body.phone
  contact.email = req.body.email.toLowerCase()
  
  if(req.body.title) contact.title = req.body.title
  if(req.body.company) contact.company = req.body.company
  if(req.body.city) contact.city = req.body.city
  
  
  Contacts.create(contact).then(contact => {
      
      req.flash("success", contact.name + " has been added.");
      res.redirect('/contacts')
    
  }).catch(err => {
    
      err.code == 11000 ? req.flash("danger", "Contact "+ req.body.name + " already exists") : req.flash("danger", "Problem creating contact, please try again later");
      res.redirect('/contacts/new')

  });
});




router.post('/edit/:id', [
  api.authenticate(['employee'], ["admin"]),
  check('name', 'Name must be at least 3 characters').isLength({ min: 3 }),
  check('email', 'Make sure you enter a valid email').isEmail(),
  check('phone', 'Please make sure you enter a valid Egyptian mobile number').isMobilePhone('ar-EG')],
  function(req, res, next) {
  
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    errors.errors.forEach(err => {
      req.flash("danger", err.msg + " " + err.param);
    })

    return res.redirect('/contacts/edit/'+req.body.oldName.replace(/\s+/g, "-"));

  }
    
  var id = req.params.id || null
      if(id) {
          Contacts.findById(id).then(contact => {
            
              if(contact) { 
                
                contact.name = req.body.name || contact.name;
                contact.mobile = req.body.phone || contact.phone;
                contact.email = req.body.email || contact.email;
                contact.title = req.body.title || contact.title;
                contact.company = req.body.company || contact.company;
                contact.city = req.body.city || contact.city;
                contact.save()
                
                req.flash('success', "Contact " + contact.name + " updated");
                return res.redirect('/contacts');

              } else {

                req.flash('danger', "Couldn't find requested contact");
                return res.redirect('/projects');

              }
            
          }).catch(err => {

              req.flash('danger', "Couldn't update contact");
              res.redirect('/contacts');
          })
        
      } else { res.redirect('/contacts') }

});


router.post('/delete', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
      
      var id = req.body.id || null
      if(id) {
          Contacts.findByIdAndDelete(id).then(contact => {

            if(contact) { 
              
                req.flash('success', "Contact " + contact.name + " deleted");
                return res.redirect('/contacts');
              
              }
              
              req.flash('danger', "Couldn't delete requested contact");
              return res.redirect('/contacts');
            
          }).catch(err => {
            
              req.flash('danger', "Couldn't delete contact");
              res.redirect('/contacts');
            
          })
        
      } else { res.redirect('/contacts') }


});





module.exports = router;