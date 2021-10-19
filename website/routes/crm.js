var express = require('express');
var router = express.Router();

var Contacts = require('../models/contacts');
var Leads = require('../models/leads');
var Users = require('../models/users');
var Projects = require('../models/projects');
var Companies = require('../models/companies');

const api = require('../functions')
const { check, validationResult } = require('express-validator');


const errors = {
  maintenance: 'We are undergoing some maintenance, please try again later'
}


router.get('/', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
    res.render('crm', { title: 'Contacts - RFID Egypt', user: req.user });
});


router.get('/api/contacts', api.authenticate(['employee'], ["admin"]), (req, res) => {
  Contacts.find().then(data => {
    res.send(data)
  })
})

router.get('/api/leads', api.authenticate(['employee'], ["admin"]), (req, res) => {
  Leads.find().then(data => {
     res.send(data)
  })
})



// GETTING MODALS AND VIEWING DATA  

router.get('/api/modal/:name', api.authenticate(['employee'], ["admin"]), (req, res) => {  
    let name = req.params.name
    res.render('crm/modal-'+name)
})


router.get('/api/projects', api.authenticate(['employee'], ["admin"]), (req, res) => {
  Projects.find().then(data => {
      var html = ""
     data.sort(function (a,b) { 

      var textA = a.name.trim().toUpperCase();
      var textB = b.name.trim().toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0; 
     
     }).forEach(project => {
       html += '<option value='+ project._id +'>' + project.name + '</option>'
     })
     res.send(html)
  })
})

router.get('/api/companies', api.authenticate(['employee'], ["admin"]), (req, res) => {
  Companies.find().then(data => {
      var html = ""
     data.forEach(company => {
       html += '<a onclick="modals.selectCompany(this)" class="badge badge-dark text-light p-2 m-1" data-id="'+ company._id +'">' + company.name + '</a>'
     })
     res.send(html)
  })
})

// Support Types :Settings.find({name: 'supportType'})


// CREATEING NEW DATA

router.post('/api/leads', api.authenticate(['employee'], ["admin"]), async (req, res) => { 
  
  var contact_id = req.body.contact_id,
      company = req.body.company,
      company_id = req.body.company_id == "null" ? null : req.body.company_id,
      source = req.body.source,
      source_other = req.body.source_other || null,
      projects = typeof req.body.projects == "object" ? req.body.projects : [req.body.projects];
  
  
  if(!company_id) {
    try {
      
      var companyData = await Companies.create({ name: company })
      company_id = companyData._id      
      
    } catch (e) {
      
      console.log(e)
      return res.send(errors.maintenance)
      
    }
  }
  
  try {
    await Leads.create({
      contact: contact_id,
      source: {
        name: source,
        other: source.toLowerCase() == "other" ? source_other : ""
      },
      company: company_id,
      added_by: {
        name: req.user.name,
        _id: req.user._id 
      },
      projects
    })  
    
    res.send("Lead successfully added")  
  } 
  catch (e) {
    res.send(errors.maintenance)  
    
  }
  
  
})




module.exports = router;