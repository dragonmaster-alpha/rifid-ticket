 var mainProject;
 var labelCount = 1;
 
var filesCounter = 0;

function createFile(name, size, no) {
  

    var filecontainer = document.createElement('div')
    var filename = document.createElement('strong')
    var filesize = document.createElement('span')
    //var file = document.createElement('input')
    var btn = document.createElement('button')
    var close = document.createElement('span')
    var space = document.createTextNode("  -  "); 
    
    close.innerHTML = "&times;"
    close.setAttribute('aria-hidden', 'true')
    
    btn.className = "close"
    btn.setAttribute('type', 'button')
    btn.setAttribute('data-dismiss', 'alert')
    btn.setAttribute('aria-label', 'Close')
    btn.onclick = function () { document.getElementById("file"+no).remove() }
  
    btn.appendChild(close)
    
    filename.innerHTML = name;
    filesize.innerHTML = size > 1024 ? (size / 1024).toFixed(2) + " MBs" : size.toFixed(2) + " KBs";
    
        
    filecontainer.className = "alert alert-info alert-dismissible fade show file m-0";
    filecontainer.setAttribute('role', 'alert')
    
    filecontainer.appendChild(filename)
    filecontainer.appendChild(space)
    filecontainer.appendChild(filesize)
    filecontainer.appendChild(btn)
    
    
    return filecontainer
    
  }

function onInputChange(elem) {
    
    if(elem.files[0].size > 5100) {
      elem.value = ""
      return alert("You are allowed to upload only files less than 5 MB")
    }
  
    ++filesCounter
    $(elem).attr('id', 'file'+filesCounter)
    $(elem).addClass('d-none')
    $(elem).addClass('toUploadFile')
    
    $(".files").before('<input id="attachments" onchange="onInputChange(this);" type="file" class="form-control form-control-lg">')
    
    var files = $(elem).prop('files');
    
    $.each(files, function () {
      
      var nfile = createFile(this.name, (this.size / 1024), filesCounter)
      $('.files').append(nfile)
      
    })
    
  }



$('form').submit(function(e) {
    if($(this).hasClass('uploadForm')) {
      
          var submitForm = $(this)
          var formData = new FormData();
        
        if($(".toUploadFile").length > 0)  {

            e.preventDefault();            
            submitForm.find('[type="submit"]').html('<span role="status" aria-hidden="true" class="spinner-border spinner-border-sm"></span>  Uploading Files...')
            submitForm.find('[type="submit"]').attr('disabled', true)
            $(".toUploadFile").each(function () {     

                formData.append(this.name, this.files[0]);

              }).promise().done(function () {

                          $.ajax({
                              type: "POST",
                              url: "/upload",
                              contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
                              processData: false, // NEEDED, DON'T OMIT THIS
                              data: formData,
                              success: function (res) {
                                
                                var total = res.length;
                                var input = document.createElement('input')
                                input.setAttribute('type', "hidden")
                                input.setAttribute('name', "files")
                                input.setAttribute('value', res.join(','))
                                submitForm.append(input)
                               
                                $('input[type="file"]').remove();
                                document.forms.uploadForm.submit();
                                
                              }
                            });
              })
        }  else {  
                              
          if ($(this).data('submitted') === true) {
              // Previously submitted - don't submit again
              e.preventDefault();
            } else {
              // Mark it so that the next submit can be ignored
              $(this).data('submitted', true);  
              $(this).find('[type="submit"]').attr('disabled', true)
            } 
        
        }
        
      } else {
        if ($(this).data('submitted') === true) {
          // Previously submitted - don't submit again
          e.preventDefault();
        } else {
          // Mark it so that the next submit can be ignored
          $(this).find('[type="submit"]').attr('disabled', true)
          $(this).data('submitted', true);
          
          $(':disabled').each(function(e) {
              $(this).removeAttr('disabled');
          })
          

        } 
    }
})

function validateProjects(elem) { 
  
  var projects = []; 
  $('[name=project]').each(function () { 
    projects.push($(this).val()) 
  }); 
  
  var hasDuplicate = false
  projects.some(function (project, index) { 
    if(projects.indexOf(project) != index) {
      hasDuplicate = true;
      return true
    }
  }) ? (function () {
    
    $(elem).addClass('is-invalid');
    $(elem).next().text('Every project can be used only once')
    
    $("[type=submit]").attr('disabled', true)
    
  
  })() : (function () {
    
    $(elem).removeClass('is-invalid');
    $(elem).next().text('')
    
    $("[type=submit]").attr('disabled', false)

    
    
  })()
  
  
}


function editThread(id, elem) {
  var form = document.forms[id];
  document.getElementById(id).contentEditable = true;
  document.getElementById(id).focus();
  elem.nextElementSibling.classList.remove('d-none');
  document.getElementById(id).addEventListener('DOMSubtreeModified', function (e) {
    form.message.value = e.target.data
  })
}

function selectAll(selector, selected) {
  $(selector).find("option").each(function () { $(this).attr("selected", selected) })  
}

function isAdmin() {
  $('#projects').parent().parent().hide()
  $('#companies').parent().parent().hide()
  selectAll("#companies", true)
  selectAll("#projects", true)
}

function isNotAdmin() {
  $('#projects').parent().parent().show()
  $('#companies').parent().parent().show()
  selectAll("#companies", false)
  selectAll("#projects", false)
}

function customerProjects() {

    var projects = $("#companies").find('option:selected').data('projects')
    window.location.href.match(/user/g) && 
      (function () {
      
          $('#projects').find('option').each(function () {
      projects.indexOf($(this).val()) > -1 ? $(this).show() : $(this).hide()
    })
      
    })()

    
  }

function isCustomer() {
  
  $("#companies").attr("multiple", false)
  
  customerProjects()
  $("#companies").on('change', customerProjects)
  
}

function isEmployee() {
  
  $("#companies").attr("multiple", true)
  $("#companies").off('change', customerProjects)
  $('#projects').find('option').each(function () { $(this).show() })
  
  
}

function gatherSearchables() {
  window.searchables = []
  $(".searchable").each(function (i) {
    window.searchables.push({ index: i, data: $(this).data("search"), status: $(this).data("status") || null })
  })
}

function gatherTickets() {
  
  window.tickets = [];
  window.projects = [];
  window.companies = [];
  window.statuses = [];
  
  var i = 0;
  var finalOne = $('tr.filter-ticket').length;
  
  $('tr.filter-ticket').each(function () {
    $(this).data("i", i++)
    window.tickets.push($(this).data())
    window.projects.indexOf($(this).data('project')) == -1 && window.projects.push($(this).data('project'))
    window.companies.indexOf($(this).data('company')) == -1 && window.companies.push($(this).data('company'))
    window.statuses.indexOf($(this).data('status')) == -1 && window.statuses.push($(this).data('status'))
    
    i == finalOne && (function () {
      
      $("#company").append(window.companies.map(function (val) { return '<option value="'+val+'">' + val + '</option>' }).join("\n"))
      $("#project").append(window.projects.map(function (val) { return '<option value="'+val+'">' + val + '</option>' }).join("\n"))
      $("#status").append(window.statuses.map(function (val) { return '<option value="'+val+'">' + val + '</option>' }).join("\n"))
      
      
    })()
  })
}

function search() {
  var hasStatus = $('#status').val()
  var text = $('#search').val()
      
  $('.searchable').hide()
  var validResults = window.searchables.filterSearch(text)
  validResults.forEach(elem => { 
    
    if(hasStatus && hasStatus != "null") {
      elem.status == hasStatus && $('.searchable').eq(elem.index).show() 
    } else {
      $('.searchable').eq(elem.index).show() 
    }
    
  })
  
  $('.searchCount').text(validResults.length + " "  + $('.searchCount').data('name'))
  
  
}

Array.prototype.filterSearch = function (text) {
  var expression = new RegExp(text.replace(/\s+/g, ".*"), 'i')
  
  return this.filter(function (searchable) {
    return searchable.data.match(expression)
  })
}

Array.prototype.ticketFilter = function (type, value) {
  return this.filter(function (ticket) {
    return ticket[type] == (value || ticket[type])
  })
}

Array.prototype.ticketSearch = function (text) {
  var expression = new RegExp(text.replace(/\s+/g, ".*"), 'i')
  
  return this.filter(function (ticket) {
    return ticket.search.match(expression)
  })
}

Array.prototype.showTickets = function (tickets) {
  $('tr.filter-ticket').hide()
  this.map(function (ticket) {
    $('tr.filter-ticket')[ticket.i].style.display = "table-row"
  })
}

function filterTickets() {
  
  var company = $('#company').val() == "null" ? null : $('#company').val()
  var project = $('#project').val() == "null" ? null : $('#project').val()
  var status = $('#status').val() == "null" ? null : $('#status').val()
  var search = $('#search').val() == "null" ? "" : $('#search').val()
  
  window.tickets.ticketFilter("company", company)
    .ticketFilter("project", project)
    .ticketFilter("status", status)
    .ticketSearch(search)
    .showTickets()
}

function setProjects() {
  
  var projects = $("#company").find(':selected').data('projects').split(',')

  $.each($("#project").find('option'), function () { 
    projects.indexOf($(this).val()) > - 1 ? $(this).show() : $(this).hide()
  })
  
  $('#project').val(projects[0])

  return true
}

function setProjName() { $('#projectName').val($('#project').find(':selected').text())  }

function viewNotification(id, link) {
  $.get('/notifications/read/'+id, function (data) {
    window.location = link 
  })
}

function notifcationsRead() {
  $.get('/notifications/read/all')
  $("#notificationsCount").text("0").removeClass('badge-danger').addClass('badge-success')
  $(".notification").each(function (i, elem) {
    $(elem).children('p').removeClass('font-weight-bold')
  })
}

function clearNotifications() {
  $.get('/notifications/clear/all')
  $("#notificationsCount").text("0").removeClass('badge-danger').addClass('badge-success')
  $(".notification").each(function (i, elem) {
    $(elem).remove()
  })
}

function companyContactPerson() {
  
  var parentElement = $(this).parent().parent()
  var contactNames = parentElement.find('select[name=contact]')
  var project = $(this).val();
  
  contactNames.val("")
  contactNames.find('option').each(function () {
    
    var projects = $(this).data('projects').split(',');
    var selected = false;
    
    if(projects.indexOf(project) > -1) {
      
      $(this).addClass('d-block')
      $(this).removeClass('d-none')
      
      if(!selected) {
          contactNames.val($(this).val())
          selected = true
        }
      
    } else {

      $(this).removeClass('d-block')
      $(this).addClass('d-none')
      
    }
    
  })
  

}

function exportToExcel(name) { 
  window.fileName = name
  $('table.exportable').tblToExcel({name: "Test.xls"}) 
}

function contactExportWrapper() {
  
  var searchables = $(".searchable")
  var names = $(".cname")
  var titles = $(".ctitle")
  var companies = $(".ccompany")
  var cities = $(".ccity")
  var emails = $(".cemail")
  var mobiles = $(".cmobile")
  
  var rows = '<table class="exportable d-none"><tr>'
  rows += '<th>Name</th>'
  rows += '<th>Title</th>'
  rows += '<th>Company</th>'
  rows += '<th>City</th>'
  rows += '<th>Email</th>'
  rows += '<th>Mobile</th>'
  rows += '</tr>'
  
  for(var i = 0; i < names.length; i++) {
    if(searchables[i].style.display != 'none')
    {
      rows += '<tr>'
      rows += "<td>" + names[i].innerText + "</td>"
      rows += "<td>" + titles[i].innerText + "</td>"
      rows += "<td>" + companies[i].innerText + "</td>"
      rows += "<td>" + cities[i].innerText + "</td>"
      rows += "<td>" + emails[i].innerText + "</td>"
      rows += "<td>'" + mobiles[i].innerText + "</td>"
      rows += "</tr>"
    }
  }
  rows += "</table>"
  
  $(rows).appendTo("body")
  exportToExcel('Contacts.xls')
  
}


$(document).ready(function () {
  
  $('.commentsTitle').click(function () {
      $(this).next().toggleClass("d-none"); var isPlus = $(this).find("span"); isPlus.text() == "+" ? isPlus.text("-") :  isPlus.text("+")  
  })
 
  window.location.href.match(/compan.+new|compan.+edit/) && (function() {
    

    mainProject = $('.addCompanyTemplate').prop('outerHTML');
    $('.addCompanyTemplate').remove();
    
    $('#addCompanyProject').click(function () {
        $('.projectsContainer').append(mainProject);
        $('.datepicker-here').datepicker()
        $(".datepicker-here").each(function() {    
            $(this).val($(this).data('ivalue'));
        });
        $('html, body').animate({
            scrollTop: $('.projectsContainer').find(".addCompanyTemplate").last().offset().top
        }, 1000);
        //$('.datepicker-here').datepicker()
    })
  
    
    
    
    
  })()

  window.location.href.match(/user.+new|user.+edit/) && (function() { 
        $('input[name="type"]').change(function () { 
          var admin = $('select[name="permission"]').find('option[value="admin"]'); 
          $('select[name="permission"]').find('option[value="member"]').attr('selected', true);
          $(this).val() == "customer" ? admin.attr("disabled", true) : admin.attr("disabled", false) 
        })
     })()

  if (window.location.href.match(/.*\.com\/tickets\/{0,1}.*$/)) {
    
    gatherTickets();
    
    var queries = window.location.search.length ? window.location.search.substr(1).split("&") : null;
    
    if (queries && queries.length) {
    var formattedQueries = {}
    
    $.each(queries, function () {
      
        var cQuery = this.split("=")
        formattedQueries[cQuery[0]] = cQuery[1]
      
    })
    
    
    $("#company").val(decodeURI(formattedQueries.company) || "null")
    $("#project").val(decodeURI(formattedQueries.project) || "null")
    $("#status").val(decodeURI(formattedQueries.status) || "null")
    
    filterTickets()
  
    }
  }
  
  window.location.href.match(/.*\.com\/tickets\/new\/{0,1}$/) && setProjects() && setProjName()
  
  $('.dalert').on('closed.bs.alert', function () {
    var dalerts = $('.malerts')
    var dalertsCount = parseInt(dalerts.first().text())
    --dalertsCount
    dalertsCount == 0 ? dalerts.each(function () { $(this).css('display', 'none') }) : dalerts.each(function () { $(this).text(dalertsCount) });
    
  })
  
  $(".my-rating").starRating({
    starSize: 25,
    disableAfterRate: false,
    callback: function(currentRating, $el){
        $("input[name=rating]").val(currentRating)
    }  
  });

  $("#export").removeClass("d-none")

  $(".timeago").each(function () { $(this).timeago("update", $(this).text()) })
  
  gatherSearchables()
  
  $("select option:selected").each(function () { $(this).addClass('isSelected') })
    
  $("select").each(function () {
    var tarr = []
    $(this).find("option").each(function (i) { tarr.push({ text: $(this).text(), val: $(this).val(), selected: $(this).hasClass("isSelected") }); $(this).remove() })
    tarr.sort(function (a,b) { 
      
      var ta = a.text.trim().toLowerCase()
      var tb = b.text.trim().toLowerCase()
      
      return ta > tb ? 1 : ta == tb ? 0 : -1
    })
    
    var options = ""
    $.each(tarr, function (i, val) {
      options += '<option class="text-capitalize" value="'+val.val+'" '+(val.selected && "selected")+'>' + val.text + '</option>'
    })
    
    $(this).append(options)
    
    
  })
  
  
});