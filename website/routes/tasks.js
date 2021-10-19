var express = require('express');
var router = express.Router();
var timeago = require("timeago-simple");

var Tasks = require('../models/tasks');
var Users = require('../models/users');
var Contacts = require('../models/contacts');
var Upload = require('../models/uploads');

const api = require('../functions')
const { check, validationResult } = require('express-validator');




router.get('/', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  Tasks.find().then(tasks => {
      res.render('d-tasks', { title: 'Tasks - RFID Egypt', user: req.user, tasks });
  }).catch(err => {
      req.flash("danger", "Problem fetching tasks.");
      res.redirect('/dashboard');
  })
});


router.get('/edit/:id', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
  var id = req.params.id || null
  
  if(id) {
      Tasks.findById(id).then(async task => {
        
        if(task.from.toString() != req.user._id.toString()) {
          req.flash('danger', "You can't edit a tesk that wasn't created by you");
          return res.redirect('/tasks');  
        }
        
        let employees = await Users.find({ _id: {$ne: req.user._id}, role: 'employee' })
        let contacts = await Contacts.find()

        if(task && employees) return res.render('d-edit-task', { title: 'Edit Task - RFID Egypt', user: req.user, task, employees, contacts } )
        
        req.flash('danger', "Couldn't find requested task");
        return res.redirect('/tasks');
        
      }).catch(err => {
          req.flash('danger', "Couldn't find requested task");
          res.redirect('/tasks');
      })
  } else { res.redirect('/tasks') }  
});

router.get('/new', api.authenticate(['employee'], ["admin"]), async function(req, res, next) {
  
  let contacts = await Contacts.find()
  let employees = await Users.find({ _id: {$ne: req.user._id}, role: 'employee' })

  res.render('d-new-task', { title: 'New Task - RFID Egypt', user: req.user, contacts, employees } );
  
});

router.get('/view/:id', api.authenticate(['employee'], ["admin", "member"]), async function(req, res, next) {
  
  let id = req.params.id || null
  
  if(id) {
    
      let task = await Tasks.findById(id)
      
      if(!task) {
        req.flash('danger', 'This task has been deleted')
        return res.redirect('/tasks')
      }
        
      
      if (req.user.permissions != "admin" && req.user._id != task.employee._id) {
        req.flash('danger', 'you are not authorized to view this task')
        return res.redirect('/tasks')
      }
      
      task.comments.forEach(comment => comment.newtime = timeago.simple(new Date(comment.time).toUTCString()))
      return res.render('d-task', { title: 'View Task - RFID Egypt', user: req.user, task } );
  }
  
  res.redirect('/tasks')
  
});


router.get('/status/:id/:status', api.authenticate(['employee'], ["admin", "member"]), async function(req, res, next) { 
  
  let id = req.params.id || null
  let status = req.params.status || null
  
  if(id && status) {
    
      let task = await Tasks.findById(id)
      
      if(!task) {
        req.flash('danger', 'This task has been deleted')
        return res.redirect('/tasks')
      }
    
      if (req.user.permissions != "admin" && req.user._id != task.employee._id) {
        req.flash('danger', 'you are not authorized to update this task')
        return res.redirect('/tasks')
      }
    
      
      let to = {
        task: task._id.toString()
      }
      
      let emailOptions = {
        title: "Task In Progress",
        description1: `${req.user.name} has updated task "${task.description}" status to in progess.`,
        cta: "View Task",
        link: "https://tickets.rfidegypt.com/tasks/view/"+ task._id
      }
      


      if (status == "progress") {

        task.status = "In Progress"


      } else {


        let completedSeconds = Date.now() - Date.parse(task.created_at)
        let completedTime = api.timeConversion(completedSeconds)

        task.status = "Complete"
        task.completedTime = completedTime
        
        emailOptions.title = "Task Complete"
        emailOptions.description1 = `${req.user.name} has marked the task "${task.description}" as complete.`
        

      }
    
     let notification = {
        text: emailOptions.description1,
        link: emailOptions.link
      }
     
      api.sendMail(to, emailOptions.title, emailOptions, notification)
      task.save()
      res.redirect('/tasks/view/'+id);



  } else { res.redirect('/tasks') }

  

})



router.post('/new', [
  api.authenticate(['employee'], ["admin"]),
  check('type', 'Please choose a type').isLength({ min: 3 }),
  check('description', 'Please enter at least 10 characters for description').isLength({ min: 10 }),
  check('employee', 'Please make sure you select an employee').isLength({ min: 1 }),], 
  function(req, res, next) {
    
  const errors = validationResult(req);
  if (!errors.isEmpty()) {

    errors.errors.forEach(err => {
      req.flash("danger", err.msg + " " + err.param);
    })

    return res.redirect('/tasks/new');

  }

  
  var uploads = req.body.files == undefined ? [] : req.body.files.split(",")
  
  Tasks.create({
 
    type: req.body.type,
    description: req.body.description,
    contact: req.body.contact == "null" ? null : req.body.contact,
    from: req.user._id,
    employee: req.body.employee,
    completedTime: null,
    status: "Active",
    uploads: uploads,
    
  
  }).then(async task => {
      
          
      if (uploads.length) { 
        let uploadedFiles = await Upload.updateMany({_id: {$in: uploads}}, {$set: {task: task._id}}, {"multi": true})
      }
    
    
     let to = {
        users: task.employee._id.toString()
      }
      
      let emailOptions = {
        title: "New Task",
        description1: `${req.user.name} has assigned a new task "${task.description}" to you.`,
        cta: "View Task",
        link: "https://tickets.rfidegypt.com/tasks/view/"+ task._id
      }
      
      let notification = {
        text: emailOptions.description1,
        link: emailOptions.link
      }
      

        req.flash("success", task.description.substr(0,20) + "... has been added.");
        res.redirect('/tasks')
        api.sendMail(to, emailOptions.title, emailOptions, notification)

    
  }).catch(err => {
    
    console.log(err)
      req.flash("danger", "Problem creating task, please try again later");
      res.redirect('/tasks/new')

  });
});




router.post('/edit/:id', [
  api.authenticate(['employee'], ["admin"]),
  check('type', 'Please choose a type').isLength({ min: 3 }),
  check('description', 'Please enter at least 10 characters for description').isLength({ min: 10 }),
  check('employee', 'Please make sure you enter a valid Egyptian mobile number').isLength({ min: 1 })], 
  function(req, res, next) {

      var id = req.params.id || null
      if(id) {
          var uploads = req.body.files == undefined ? [] : req.body.files.split(",")
          
          Tasks.findById(id).then(async task => {
            
            if(task) {
              
                task.type = req.body.type;
                task.description = req.body.description;
                task.contact = req.body.contact;
                task.employee = req.body.employee;
                if(uploads) uploads.map(upload => task.uploads.push(upload));

                task.save();
            
               
                
                req.flash('success', "Task " + task.description.substr(0,20) + "... updated");
                res.redirect('/tasks');
                
                if (uploads.length) { 
                  let uploadedFiles = await Upload.updateMany({_id: {$in: uploads}}, {$set: {task: task._id}}, {"multi": true})
                } 
                
                
                   let to = {
                      users: task.employee._id.toString()
                    }

                    let emailOptions = {
                      title: "Task Editted",
                      description1: `${req.user.name} has editted the task "${task.description}".`,
                      cta: "View Task",
                      link: "https://tickets.rfidegypt.com/tasks/view/"+ task._id
                    }

                    let notification = {
                      text: emailOptions.description1,
                      link: emailOptions.link
                    }

                      api.sendMail(to, emailOptions.title, emailOptions, notification)
              
              
              } else {
              
                req.flash('danger', "Couldn't find requested task");
                return res.redirect('/tasks');
            }
                                  
          }).catch(err => {

              req.flash('danger', "Couldn't update task");
              res.redirect('/tasks');
          })
        
      } else { res.redirect('/tasks') }

});


router.post('/addComment/:taskId', api.authenticate(['employee'], ["admin", "member"]), async function(req, res, next) {
  
  var taskId = req.params.taskId || null
  var comment = req.body.comment || null
  
  if(taskId) {
    
    if(!comment || comment.trim().length < 2) {
      req.flash('danger', 'Please enter at least 2 characters to post a comment')
      return res.redirect('/tasks/view/'+taskId)
    }
    
    let task = await Tasks.findById(taskId)
    
    if(!task) {
        req.flash('danger', 'This task has been deleted')
        return res.redirect('/tasks')
      }
    
    task.comments.push({
      user: {
        id: req.user._id,
        name: req.user.name
      },
      comment: req.body.comment,
      time: Date.now()
    })
    
    task.save()
    
    req.flash('success', 'Comment added')
    res.redirect('/tasks/view/'+taskId)
    
     let to = {
        users: [ task.from, task.employee._id ],
        except: [ req.user._id ]
      }
      
      let emailOptions = {
        title: "New Comment",
        description1: `${req.user.name} has added a new comment to task "${task.description}".`,
        description2: req.body.comment,
        cta: "View Task",
        link: "https://tickets.rfidegypt.com/tasks/view/"+ task._id
      }
      
      let notification = {
        text: emailOptions.description1,
        link: emailOptions.link
      }
      
        api.sendMail(to, emailOptions.title, emailOptions, notification)
    
  }
  
  //return res.redirect('/tasks')
  
})


router.post('/delete', api.authenticate(['employee'], ["admin"]), function(req, res, next) {
      
      var id = req.body.id || null
      if(id) {
          Tasks.findByIdAndDelete(id).then(task => {

            if(task) { 
                
                req.flash('success', "Task " + task.description.substr(0,20) + "... deleted");
                res.redirect('/tasks');
              
                   let to = {
                    users: task.employee._id.toString()
                  }

                  let emailOptions = {
                    title: "Task Deleted",
                    description1: `${req.user.name} has deleted the task "${task.description}".`,
                  }

                  let notification = {
                    text: emailOptions.description1,
                    link: ""
                  }

                    api.sendMail(to, emailOptions.title, emailOptions, notification)

              
              
              
              } else {
                
                          
              req.flash('danger', "Couldn't delete requested task");
              return res.redirect('/tasks');
            
            }
          }).catch(err => {

              req.flash('danger', "Couldn't delete task");
              res.redirect('/tasks');
          })
        
      } else { res.redirect('/projects') }



});





module.exports = router;