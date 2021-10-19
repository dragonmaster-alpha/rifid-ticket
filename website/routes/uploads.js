var express = require('express');
var router = express.Router();

const uploadsFolder = '/home/mak/rfid/website/uploads/'
const Uploads = require('../models/uploads');
const Ticket = require('../models/tickets');
const Task = require('../models/tickets');

const api = require('../functions')

router.post('/', api.authenticate(['employee', 'customer'], ["member", "admin"]), function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('null');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  
  
  
  var files = []
  var movedFiles = []
  var key = Object.keys(req.files)[0]
  req.files[key].length == undefined ? files.push(req.files[key]) : files = req.files[key]
  
  try {
  (async _ => {
    
    for(const file of files) {
      
      let location = uploadsFolder+Date.now()+file.name
      await new Promise((res) => {
        file.mv(location, function(err) {
        if(err) res(false)
        movedFiles.push({
            name: file.name,
            location
          }) 
        res(true)  
        })
      })


    }
    
    var avfiles = await Uploads.insertMany(movedFiles).catch(err => res.send('error saving files'))
    var finalFiles = avfiles.map(file => file._id)
    res.send(finalFiles)
    
  })()
  
   } catch (err) {
     console.log(err)
     res.status(500).send('err saving files')
   }   
        
  
  // Use the mv() method to place the file somewhere on your server
  /* sampleFile.mv(uploadsFolder, function(err) {

    if (err) {
      console.log(err)
      return res.status(500).send(err);
    }
   res.send('File uploaded!');  
    
  });*/
});

router.get('/:id', api.authenticate(['employee', 'customer'], ["auditor", "member", "admin"]), function(req, res) {

   var id = req.params.id || null;
    if(id) {
      
     Uploads.findById(id).then(async file => {
       
       if(!file) {
          req.flash('danger', "Couldn't find requested file")
          return res.redirect('/tickets')
       }
       
       
       if (req.user.permissions == "admin") return res.sendFile(file.location)
       
       if(file.ticket) {
         
         Ticket.findById(file.ticket).then(ticket => {
           
           if(ticket && ticket.users.indexOf(req.user._id) > -1) {
             return res.sendFile(file.location)
           } else {
             return res.send('You are not authorized to view this file')
           }
           
         })
         
       } 
       
       if(file.task) {
         
         var task = Task.findById(file.task)
         if (req.user == task.employee) res.sendFile(file.location)
         
       }
       
       
       return res.send('You are not authorized to view this file')
       

       

     }).catch(err => {

       console.log(err)
       req.flash('danger', "Couldn't find requested file")
       res.redirect('/tickets')

     })
        
  } else { res.redirect('/tickets') }

});


module.exports = router;