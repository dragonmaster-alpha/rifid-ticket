var express = require('express');
var router = express.Router();

var Projects = require('../models/projects');
var Settings = require('../models/settings');
var Users = require('../models/users');

const api = require('../functions')
const { check, validationResult } = require('express-validator');

const validateProjects = [
    api.authenticate(['employee'], ["admin"]),
    check('name', 'Project name must be at least 2 characters').isLength({ min: 2 }),  
]



router.get('/settings', (req, res, next) => {
  
  
  Settings.create([
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
    ]).then(x => {
   
    res.send('ok')
    
  }).catch(console.log)
  
  
})

router.get('/', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  Projects.find().then(projects => {
      res.render('d-projects', { title: 'Projects - RFID Egypt', user: req.user, projects: projects });
  }).catch(err => {
      req.flash("danger", "Problem fetching projects.");
      res.render('d-projects', { title: 'Projects - RFID Egypt', user: req.user, projects: null });    
  })
});


router.get('/edit/:name', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  var name = req.params.name || null
  if(name) {
      Projects.findOne({name: name.replace(/\-/g, ' ')}).then(project => {
          if(project) return res.render('d-edit-project', { title: 'Edit Project - RFID Egypt', user: req.user, project} );
          req.flash('danger', "Couldn't find requested project");
          return res.redirect('/projects');
      }).catch(err => {
          req.flash('danger', "Couldn't find requested project");
          res.redirect('/projects');
      })
  } else { res.redirect('/projects') }  
});

router.get('/new', function(req, res, next) {
  res.render('d-new-project', { title: 'New Project - RFID Egypt', user: req.user} );
});



router.post('/new', validateProjects, function(req, res, next) {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    
    errors.errors.forEach(err => {
      req.flash("danger", err.msg + " " + err.param);
    })
    return res.redirect('/projects/new');  
  }
  
  Projects.create({
    
    name: req.body.name,
    description: req.body.description,
    
  }).then(project => {
      
      req.flash("success", project.name + " has been added.");
      res.redirect('/projects/')
    
      Users.find({ role: "employee", permissions: "admin" }).then(async users => {
        for(let user of users) { user.companies.push(project._id) }
        users.save()
      })

    
  }).catch(err => {
    
      //req.flash("danger", JSON.stringify(err));    
      err.code == 11000 ? req.flash("danger", "Project "+ req.body.name + " already exists") : req.flash("danger", "Problem creating user, please try again later");
      res.redirect('/projects/new')

  });
});




router.post('/edit/:id', validateProjects, function(req, res, next) {
    if(req.body.oldname) {      
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

          errors.errors.forEach(err => {
            req.flash("danger", err.msg + " " + err.param);
          })

          return res.redirect('/projects/edit/'+req.body.oldname.replace(/\s+/g, '-'));
        }

      var id = req.params.id || null
      if(id) {
          Projects.findByIdAndUpdate(id, {name: req.body.name, description: req.body.description, }).then(project => {
              if(project) { 
                req.flash('success', "Project " + project.name + " updated");
                return res.redirect('/projects');
              }
              
              req.flash('danger', "Couldn't find requested project");
              return res.redirect('/projects');
          }).catch(err => {
              console.log(err)
              req.flash('danger', "Couldn't update project");
              res.redirect('/projects');
          })
        
      } else { res.redirect('/projects') }
    } else { res.redirect('/projects')  }
});


router.post('/delete', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
      
      var id = req.body.id || null
      if(id) {
          Projects.findByIdAndDelete(id).then(project => {
              if(project) { 
                req.flash('success', "Project " + project.name + " deleted");
                return res.redirect('/projects');
              }
              
              req.flash('danger', "Couldn't delete requested project");
              return res.redirect('/projects');
          }).catch(err => {

              req.flash('danger', "Couldn't delete project");
              res.redirect('/projects');
          })
        
      } else { res.redirect('/projects') }



});





module.exports = router;