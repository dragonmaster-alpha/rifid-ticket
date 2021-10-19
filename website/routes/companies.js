var express = require('express');
var router = express.Router();

var Companies = require('../models/companies');
var Projects = require('../models/projects');
var Settings = require('../models/settings');
var Users = require('../models/users');

const api = require('../functions');

const { check, validationResult } = require('express-validator');
const validateCompanies = [
    api.authenticate(['employee'], ["admin"]),
    check('name', 'Company name must be at least 2 characters').isLength({ min: 2 }),
    check('support', 'Support type is required').isLength({ min: 1 }),
    check('project', 'Project is required').isLength({ min: 1 }),
    check('expiration', 'Expiration date is required').isLength({ min: 1 }),
]


router.get('/', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  Companies.find().then(companies => {
      res.render('d-companies', { title: 'Companies - RFID Egypt', user: req.user, companies });
  }).catch(err => {
      req.flash("danger", "Problem fetching companies.");
      res.render('d-companies', { title: 'Companies - RFID Egypt', user: req.user, companies: null });    
  })
});


router.get('/new', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  Settings.find({name: 'supportType'}).then(supportType => {
    Projects.find().then(projects => {
        res.render('d-new-company', { title: 'New Company - RFID Egypt', user: req.user, projects, supportType: supportType} );
    }).catch(err => {
        req.flash("danger", "There are ongoing maintenance. Please contact support if problem persists");
        res.redirect('/companies');    
    })  
   })
});


router.get('/edit/:name', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  var name = req.params.name || null
  if(name) {
      Settings.find({name: 'supportType'}).then(supportType => {
        Projects.find().then(projects => {
          Companies.findOne({name: name.replace(/\-/g, ' ')}).then(company => {
              Users.find({role: "customer", companies: company._id}).then(users => {
                
                if(company) return res.render('d-edit-company', { title: 'Edit Project - RFID Egypt', user: req.user, company, supportType: supportType , projects, users} );
                
                req.flash('danger', "Couldn't find requested company");
                return res.redirect('/companies');
                
              })            
          }).catch(err => {
            req.flash('danger', "Couldn't find requested company");
            res.redirect('/companies');
        })
      }) 
    })
  } else { res.redirect('/companies') }  
});


router.get('/hold/:companyId/:projectId', api.authenticate(['employee'], ["admin"]), function(req, res, next) { 
  
  var companyId = req.params.companyId || null;
  var projectId = req.params.projectId || null;

  
  if(companyId && projectId) {
    
    Companies.findById(companyId).then(company => {
      !company.projects.some(project => {
        if(project._id == projectId) {

          project.hold = Date.now().toString();
          project.start = project.start || "12/10/2019";
          
          company.save();
          
          
          req.flash('success', `${project.project.name} ${project.type} is now on hold.`);
          res.redirect('/companies/edit/'+company.name.replace(/\s+/g, "-"));
                    
          return true
          
        }
      }) && res.redirect('/companies')
    })
    
  } else { return res.redirect('/companies/')}
  
})

router.get('/unhold/:companyId/:projectId', api.authenticate(['employee'], ["admin"]), function(req, res, next) { 
  
  var companyId = req.params.companyId || null;
  var projectId = req.params.projectId || null;
  
  if(companyId && projectId) {
    
    Companies.findById(companyId).then(company => {
      !company.projects.some(project => {
        if(project._id == projectId) {
          if(project.hold) {
            
            var currentDate = Date.now();
            var holdDate = new Date(parseInt(project.hold));
            var expiryDate = (new Date(project.expiration)).getTime();
            
            let difference = currentDate - holdDate;
            
            let newDate = (new Date(expiryDate + difference));
            
            let year = newDate.getFullYear();
            let month = "0" + (newDate.getMonth() + 1);
            let day = "0" + newDate.getDate();
            
            project.expiration = `${month.substr(-2)}/${day.substr(-2)}/${year}`;
            
            project.hold = null;
            company.save();
            
            req.flash('success', `${project.project.name} ${project.type} deadline has been extended ${Math.round(difference / (1000 * 60 * 60 * 24)) } days.`);
            res.redirect('/companies/edit/'+company.name.replace(/\s+/g, "-"))
            
            return true            
            
          } else { return res.redirect('/companies') }
        }
      }) && res.redirect('/companies')
    })
    
  } else { res.redirect('/companies/')}
  
})


router.post('/new', validateCompanies, function(req, res, next) {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.errors.forEach(err => {
      req.flash("danger", err.msg + " " + err.param);
    })
    return res.redirect('/companies/new');
  }
  
  var rb = req.body, projects;
  try {
    typeof rb.expiration == "object" ? (_ => {

        projects = []
        for(let i=0; i<rb.support.length; i++) {
          projects.push({
             project: rb.project[i],
             type: rb.support[i],
             expiration: rb.expiration[i],
             start: rb.start[i]
          })
        }

    })() : (_ => {


        projects = [{
          project: rb.project,
          type: rb.support,
          expiration: rb.expiration,
          start: rb.start
        }]

    })()
  } catch (e) {
    
    req.flash("danger", "Please make sure all fields are filled");
    return res.redirect('/companies/new');
    
  }
  
  
  
  Companies.create({
    
    name: req.body.name.trim(),
    projects: projects,
    
  }).then(company => {
      
      req.flash("success", company.name + " has been added.");
      res.redirect('/companies/')
    
      Users.find({ role: "employee", permissions: "admin" }).then(async users => {
        for(let user of users) { user.companies.push(company._id) }
        users.save()
      })
    
    
  }).catch(err => {
    
      //req.flash("danger", JSON.stringify(err));    
      err.code == 11000 ? req.flash("danger", "Company "+ req.body.name + " already exists") : req.flash("danger", "Please make sure all fields are filled");
      res.redirect('/companies/new')

  });
});




router.post('/edit/:id', validateCompanies, function(req, res, next) {
  
  if(req.body.oldname) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.errors.forEach(err => {
          req.flash("danger", err.msg + " " + err.param);
        })
        return res.redirect('/companies');
      }

      var rb = req.body, projects; 
    
      try {
        
        typeof rb.expiration == "object" ? (_ => {

            projects = []
            for(let i=0; i<rb.support.length; i++) {
              projects.push({
                 project: rb.project[i],
                 type: rb.support[i],
                 expiration: rb.expiration[i],
                 start: rb.start[i],
                 hold: rb.hold[i] == "null" ? null : rb.hold[i],
                 contact: rb.contact[i] || null
              })
            }
          


        })() : (_ => {

            projects = [{
              project: rb.project,
              type: rb.support,
              expiration: rb.expiration,
              start: rb.start,
              hold: rb.hold == "null" ? null : rb.hold,
              contact: rb.contact || null
            }]
          

        })()
        
      } catch (e) {

        req.flash("danger", "Please make sure all fields are filled");
        return res.redirect('/companies/edit/'+req.body.oldname.replace(/\s+/g, '-'));

      }


      var id = req.params.id || null
      if(id) {
        
          Companies.findByIdAndUpdate(id, {

            name: req.body.name.trim(),
            projects: projects,

          }).then(company => {

              req.flash("success", company.name + " has been editted.");
              res.redirect('/companies/edit/'+company.name.replace(/\s+/g, '-'))

          }).catch(err => {

              err.code == 11000 ? req.flash("danger", "Company "+ req.body.name + " already exists") : req.flash("danger", "Please make sure all fields are filled");
              res.redirect('/companies/edit/'+req.body.oldname.replace(/\s+/g, '-'))

          });
      } else { res.redirect('/companies') }
    } else { res.redirect('/companies')  }


});


router.post('/delete', api.authenticate(['employee'], ["admin"]), function(req, res, next) {

      var id = req.body.id || null
      if(id) {
          Companies.findByIdAndDelete(id).then(company => {
              if(company) { 
                req.flash('success', "Company " + company.name + " deleted");
                return res.redirect('/companies');
              }
              
              req.flash('danger', "Couldn't delete company");
              return res.redirect('/companies');
          }).catch(err => {
              console.log(err)
              req.flash('danger', "Couldn't delete company");
              res.redirect('/companies');
          })
        
      } else { res.redirect('/companies') }

});





module.exports = router;