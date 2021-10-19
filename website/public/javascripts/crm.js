
var activeTab = "contacts"
var activeData = null
var activeDataKey = false
var activeModal = ""

//functions for Modals and inits
var modals = {
  "contact-to-lead": function () {
    
    //WAIT TILL THE ELEMENTS ARE LOADED
     var temp = setInterval(function () {
         if($('.form-companies a').length) {
             modals.companyChange()
             clearTimeout(temp)
          }
     }, 500)
    
  },
  selectCompany: function (elem) {
        $('#form-company').val($(elem).text()); 
        $('#form-company-id').val($(elem).data("id")); 

        $('.form-companies a').addClass("badge-dark");
        $('.form-companies a').removeClass("badge-primary"); 
        $(".form-companies-msg").text($(elem).text() + " is selected")

        $(elem).removeClass("badge-dark");
        $(elem).addClass("badge-primary"); 
      },
  companyChange: function() {
                          
        $('.form-companies a').removeClass("badge-primary");
        $('.form-companies a').addClass("badge-dark");
    
        $(".form-companies-msg").text("A new company will be created")
        $('#form-company-id').val("null")

        var inputValue = $('#form-company').val()
        $('.form-companies a').each(function () {
          if($(this).text().toLowerCase().trim() == inputValue.toLowerCase().trim()) return modals.selectCompany(this)
        })
    
    
      },
  
}

$(document).on('submit', 'form.modal-form', function (e) {
  
    e.preventDefault()
    e.stopPropagation()
  
    var form = this  
    var errors = []
    
    $(form).find("[data-validate]").each(function () {
      
      var validation = new RegExp($(this).data('validate'))
      !validation.test($(this).val()) && errors.push($(this).data('message'))
      
      
    })
    

    if(errors.length) {
      
      alert("- " + errors.join("\n- "))
      
    } else {
      
      var method = form.method
      var action = form.action
      
      $('#modalLoading').removeClass('d-none')
      
      $.ajax({
             type: method,
             url: action,
             data: $(form).serialize(), 
             success: function(data) {
                 alert(data);
                 $(activeModal).modal('hide');
                 $('#modalLoading').addClass('d-none')
             },
            error: function (e) {
                alert('Please make sure of your connection')
                $('#modalLoading').addClass('d-none')
            }
         });
      
    }
    
    
  
})

$(document).on('click', '.icon-move-to.icon-contact-to-lead', function (e) {
  
  activeDataKey = parseInt($(this).closest('[data-index]').data('index'))
  loadModal("contact-to-lead")
  
})


//Change the tab to the active section
function changeTab(section) {
  $('.crm-menu .nav-link').removeClass("active")
  $('.crm-menu .crm-'+section).addClass("active")  
}

//Close all views and show loading
function loading() {
  $(".crm-view").addClass("d-none")
  $(".crm-view-loading").removeClass("d-none")
}

//Show a section and set activeTab
function viewSection(section, error) {
  console.log("No data found", error)
  $(".crm-view-loading").addClass("d-none")
  $(".crm-view-"+section).removeClass("d-none")
  error && $(".crm-view-"+section + " table tbody").html('<span class="p-4">No data available</span>')
  window.location.hash = "#"+ section
}


//Sort function alphabetically 
function sortAlphbetical(a, b) {
        
    var textA, textB
    switch(activeTab) {
        
      case "leads":
        textA = a.contact.name.trim().toUpperCase();
        textB = b.contact.name.trim().toUpperCase();
        break;
      
      default: 
       textA = a.name.trim().toUpperCase();
       textB = b.name.trim().toUpperCase();
        
    }
  
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
      
      }

//Join Array by name
function joinByName(arr) {
  var newArr = []
  for(var i=0; i < arr.length; i++) {
    newArr.push(arr[i].name)
  }
  return newArr.join(" - ")
}

function formatDate(date) {
  return date.substr(0, 10) + " at " + date.substr(11, 5)
}




//Handle data after received
function viewData(section, data) {
  
  if(data == null || !data.length) return viewSection(section, true)
  $(".crm-view table tbody").html(" ")
  
  var actionButtons;
  switch(section) {
    case "contacts":
      
      data.sort(sortAlphbetical)
      
//       actionButtons = '<i class="icon-move-to icon-contact-to-lead cursor-pointer p-1 ml-1" title="Transfer to lead"></i><i class="icon-edit cursor-pointer p-1 ml-1" title="Edit Contact"></i><i class="icon-delete text-danger cursor-pointer p-1 ml-1" title="Delete Contact"></i>'
       $.each(data, function (i) {
        
//         var html = '<td class="text-capitalize">'+this.name+'</td>'
//         html += '<td>'+this.title+'</td>'
//         html += '<td>'+this.company+'</td>'
//         html += '<td>'+this.city+'</td>'
//         html += '<td>'+this.mobile+'</td>'
//         html += '<td>'+this.email+'</td>'
//         html += '<td>'+this.created_at.substr(0, 10) +'</td>'
//         html += '<td>'+ actionButtons +'</td>'
        
//        $(".crm-view-contacts table tbody").append('<tr data-index="'+i+'">'+html+'</tr>')

        var html = '<tr class="p-0 m-0" data-index="'+i+'"><td class="p-0 m-0">'
        html += '<div class="card"><div class="card-body text-capitalize cursor-pointer" onclick="$(this).next().collapse(\'toggle\')">'
        html += '<h3 class="card-title">'+ this.name +'</h3>'
        html += '<h5 class="card-title">'+ this.company +'</h5>'
        html += '<p class="card-text">'+ this.title + ' - ' + this.city + '</p></div>'
        html += '<div class="collapse"><ul class="list-group list-group-flush">'
        html += '<li class="list-group-item"><b> Mobile: </b><a href="tel:'+this.mobile+'">'+ this.mobile +'</a></li>'
        html += '<li class="list-group-item"><b> Email: </b><a href="mailto:'+this.email+'">'+ this.email +'</a></li>'
        html += '<li class="list-group-item"><b> Updated at: </b>'+ formatDate(this.updatedAt) + '</li>'
        html += '<li class="list-group-item"><b> Created at: </b>'+ formatDate(this.created_at) +'</li>'
        html += '</ul>'
        html += '<div class="card-body">'
        html += '<a href="#" class="card-link"><i class="icon-move-to icon-contact-to-lead cursor-pointer p-1 ml-1" title="Transfer to Lead"></i></a>'
        html += '<a href="#" class="card-link"><i class="icon-edit icon-contact-edit cursor-pointer p-1 ml-1" title="Edit Contact"></i></a>'
        html += '<a href="#" class="card-link"><i class="icon-delete icon-contact-delete text-danger cursor-pointer p-1 ml-1" title="Delete Contact"></i></a>'
        html += '</div>'
        html += '</div></div></td></tr>'

      $(".crm-view-contacts table tbody").append(html)        
      
      })
      
      break;
    
    case "leads":

      data.sort(sortAlphbetical)
      
      $.each(data, function (i) {
        
        var html = '<tr class="text-capitalize p-0 m-0" data-index="'+i+'"><td class="p-0 m-0">'
        html += '<div class="card"><div class="card-body cursor-pointer" onclick="$(this).next().collapse(\'toggle\')">'
        html += '<h3 class="card-title">'+ this.contact.name +'</h3>'
        html += '<h5 class="card-title">'+ this.company.name +'</h5>'
        html += '<p class="card-text">'+ this.contact.title + ' - ' + this.contact.city + '</p></div>'
        html += '<div class="collapse" id="collapseLead'+i+'"><ul class="list-group list-group-flush">'
        html += '<li class="list-group-item"><b> Source: </b>'+ this.source.name +'</li>'
        html += '<li class="list-group-item"><b> Projects: </b>'+ joinByName(this.projects) +'</li>'
        html += '<li class="list-group-item"><b> Updated at: </b>'+ formatDate(this.updatedAt)+'</li>'
        html += '<li class="list-group-item"><b> Created at: </b>'+ formatDate(this.created_at) +'</li>'
        html += '<li class="list-group-item"><b> Created by: </b>'+ this.added_by.name +'</li>'
        html += '</ul>'
        html += '<div class="card-body">'
        html += '<a href="#" class="card-link"><i class="icon-move-to icon-lead-to-deal cursor-pointer p-1 ml-1" title="Transfer to deal"></i></a>'
        html += '<a href="#" class="card-link"><i class="icon-edit icon-lead-edit cursor-pointer p-1 ml-1" title="Edit Lead"></i></a>'
        html += '<a href="#" class="card-link"><i class="icon-delete icon-lead-delete text-danger cursor-pointer p-1 ml-1" title="Delete Lead"></i></a>'
        html += '</div>'
        html += '</div></div></td></tr>'
        
        $(".crm-view-leads table tbody").append(html)        
        
      })
      
      break;
    
    default: 
       console.log(data)
      
      
  }
  
  viewSection(section)
  

  
}




//Load data from API
function getData(section) {
  
  $.get('/crm/api/'+section, function (data) {
    
    activeData = data
    viewData(section, data)
    
  }).fail(function (e) {
    
    viewData(section, null)
    console.log(e)
    
  })
  
}

//Change section chain
function changeSection(section) {
  
  activeTab = section
  changeTab(section)
  loading()
  getData(section)
  
}


//Load a modal
function loadModal(name) {
  
    $('#modalLoading').removeClass('d-none')
    $('#modalContent').html(" ")
    $('#modalContent').load("/crm/api/modal/"+name, function (data, status) {
        
        if ( status == "error" ) {
          alert("Could't load data now .. please check your connection or referesh the page")
          return $('#modalLoading').addClass('d-none')
        }

      //Load external data
      $(this).find("[data-load-data]").each(function () {
        $(this).load($(this).data('load-data'))
      })

      $(this).find("[data-model]").each(function () {
        console.log(activeDataKey)
        $(this).val(activeData[activeDataKey][$(this).data('model')])
      })

      $('#modalLoading').addClass('d-none')
      $("#modal-"+name).modal('show')
      
      activeModal = "#modal-"+name;
      modals[name]();

    })
    

}



changeSection(activeTab)