$(document).ready(function(){

  function init() {

    $('.icon').tooltipster();
    assignDelete($(".tablediv"));
    
    // Create new test
    $("a.newgroup").click(function(){
      $(".tablediv .tbody div.newrow").remove();
      var arow = $("<div class='newrow row clearfix'>" + 
        "<div class='col col1'><input type='text' class='groupname' placeholder='Namn' /></div>" + 
        "<div class='col col2'><input type='text' class='groupdescr' placeholder='Beskrivning' /></div>" +
        "<div class='col col3 btns'><a class='save icon' title='Spara nytt test'><img src='/gfx/cd.png' alt='Spara' title='Spara' /></a>" +
        "<a class='cancel icon' title='Avbryt'><img src='/gfx/cancel.png' alt='Avbryt' title='Avbryt' /></a></div></div>");
      $(".tablediv .tbody").prepend(arow);
      
      arow.find("input.groupname").focus(function(){
        $(this).removeClass("error");
      });
      arow.find("a.save").click(function(){
        var aname = arow.find("input.groupname").val();
        var adescr = arow.find("input.groupdescr").val();
        if (aname.length == 0) {
          arow.find("input.groupname").addClass("error");
          return;
        }
        ajax.post("/savenewgroup", {"name":aname, "description":adescr}).then(function(id) {
          if (id) {
            var newrow = $("<div class='row clearfix'>" +
              "<div class='col col1'>" + aname + "</div>" +
              "<div class='col col2'>" + adescr + "</div>" + 
              "<div class='col col3 btns'>" + 
              "<a href='/admingroup?id=" + id + "' class='icon' title='Redigera testets egenskaper och användare'><img src='/gfx/pen.png' alt='Redigera' /></a>" +
              "<a class='icon delete' title='Ta bort testet' data-id='" + id + "'><img src='/gfx/x.png' alt='Ta bort' /></a>" +
              "<a href='/selecttest?id=" + id + "' class='icon' title='Visa testets deltest'><img src='/gfx/start.png' alt='Deltest' /></a>" +
              "</div></div>");
            $(".tablediv .tbody div.newrow").remove();
            $(".tablediv .tbody").prepend(newrow);
            assignDelete(newrow);
          }
        });
      });
      arow.find("a.cancel").click(function(){
        $(".tablediv div.newrow").remove();
      });
    });
  }

  // Assign event to delete buttons
  function assignDelete(parent) {
    parent.find("div.btns a.delete").click(function() {
      var row = $(this).parent().parent();
      var aname = row.find(".col1").text();
      if (confirm("Är du säker på att du vill ta bort testet " + aname + "?")) {
        if (confirm("Testet, inklusive alla deltest och resultat, kommer att tas bort. Vill du fortsätta?")) {
          var id = $(this).data("id");
          ajax.post("/deletegroup", {"id":id}).then(function(err) {
            if (err == "loggedout") window.location.href = "/";
            if (err) console.log(err, id);
            row.remove();
          });
        }
      }
    });

  }

  init();

});
