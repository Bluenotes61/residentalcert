$(document).ready(function(){

  function init() {

    $('.icon').tooltipster();
 
    initTabNavigation();
    
    initTabTest();
    initTabUsers();
  }



  /*** Init events in tab 'Test' ***/
  function initTabTest() {
    $("#admintest a.editbtn").click(function(){
      $("#admintest .name .edit input").val($("#admintest .name .static").text());
      $("#admintest .description .edit textarea").val($("#admintest .description .static").text());

      $("#admintest .static").hide();
      $("#admintest .edit").show();
      $("#admintest .edit.icon").css("display", "inline-block");
    });
    $("#admintest a.cancelbtn").click(function(){
      $("#admintest .static").show();
      $("#admintest .static.icon").css("display", "inline-block");
      $("#admintest .edit").hide();
    });
    $("#admintest a.savebtn").click(function() {
      var groupdata = {
        id: $("#inpgroupid").val(), 
        name: $("#admintest .name .edit input").val(), 
        description: $("#admintest .description .edit textarea").val()
      };
      $("#admintest .name .static").text(groupdata.name);
      $("#admintest .description .static").text(groupdata.description);
      ajax.post("/saveeditgroup", {"groupdata":groupdata}).then(function() {
        $("#admintest .static").show();
        $("#admintest .static.icon").css("display", "inline-block");
        $("#admintest .edit").hide();
      });
    });
  }


  /*** Init events in tab 'Användare' ***/
  function initTabUsers() {
    initUserButtons();

    // Add user
    $("#adminusers .header .newbtn").click(function(){
      var options = "<option></option>";
      for (var i=0; i < roles.length; i++)
        options += "<option value='" + roles[i].id + "'>" + roles[i].name + "</option>";
      $("#adminusers .users div.newuser").remove();
      var newrow = $("<div class='row clearfix newuser'>" + 
        "<div class='col col1'><input type='text' class='email' /></div>" + 
        "<div class='col col2'><input type='text' class='uname' /></div>" + 
        "<div class='col col3'><select class='role'>" + options + "</select></div>" + 
        "<div class='col col4 btns'>" +
          "<a title='Spara ändringar' class='savebtn icon'><img alt='Spara' src='/gfx/cd.png'></a>" +
          "<a title='Avbryt' class='cancelbtn icon'><img alt='Avbryt' src='/gfx/cancel.png'></a>" +
        "</div>" + 
      "</´div>");
      $("#adminusers .users .tbody").prepend(newrow);
      newrow.find("input, select").focus(function(){
        $(this).removeClass("error");
      });
    
      // Cancel add user
      newrow.find("a.cancelbtn").click(function(){
        newrow.remove();
      });

      // Save new user
      newrow.find("a.savebtn").click(function(){
        var emailRegExp = new RegExp("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$", "i");
        var errsel = "";
        var email = newrow.find("input.email").val();
        var aname = newrow.find("input.uname").val();
        var roleid = newrow.find("select.role").val();
        var rolename = newrow.find("select.role option:selected").text();
        if (email.length == 0) errsel += "input.email";
        if (!emailRegExp.test(email)) errsel += ",input.email";
        if (aname.length == 0) errsel += ",input.uname";
        if (roleid.length == 0) errsel += ",select.role";
        if (errsel.indexOf(',') == 0) errsel = errsel.substring(1);
        newrow.find(errsel).addClass("error");
        if (errsel.length == 0) {
          var groupid = $("#inpgroupid").val();
          ajax.post("/adduser", {"groupid":groupid, "email":email, "name":aname, "roleid":roleid, "rolename":rolename}).then(function(res) {
            if (res.err == "Existing")
              newrow.find("input.email").addClass("error");
            else {
              newrow.remove();
              var oresrow = $(res.rowhtml);
              $("#adminusers .users .tbody").prepend(oresrow);
              initUserButtons(oresrow);
            }
          });
        }
      });
    });
  }


  /*** Init user button events ***/
  function initUserButtons(sel) {

    var root = (sel ? sel : $("#adminusers"));
    // Start edit user
    $(root).find(".btns .editbtn").click(function(){
      var row = $(this).parent().parent();
      var roleid = row.find(".col3 span.stat").data("roleid");
      row.find(".col3 select.role").val(roleid);
      var aname = row.find(".col2 span").text();
      row.find(".col2 input.uname").val(aname);
      row.addClass("editrow");
    });
    
    // Cancel edit user
    $(root).find(".btns .cancelbtn").click(function(){
      $(this).parent().parent().removeClass("editrow");
    });

    // Save edit user
    $(root).find(".btns .savebtn").click(function(){
      var groupid = $("#inpgroupid").val();
      var row = $(this).parent().parent();
      var userdata = {
        "groupid": groupid,
        "uid": row.data("uid"),
        "name": row.find(".col2 input.uname").val(),
        "roleid": row.find(".col3 select.role").val()
      };
      var rolename = row.find(".col3 select.role option:selected").text();
      ajax.post("/saveedituser", {"userdata":userdata}).then(function() {
        row.find(".col2 span").text(userdata.name);
        row.find(".col3 span").text(rolename);
        row.removeClass("editrow");
      });
    });

    // Delete user
    $(root).find(".btns .delbtn").click(function(){
      var row = $(this).parent().parent();
      var aname = row.find(".col2 span").text();
      var uid = row.data("uid");
      var groupid = $("#inpgroupid").val();
      if (confirm("Är du säker på att du vill ta bort användare " + aname + " från testet?")) {
        ajax.post("/deleteuser", {"uid":uid, "groupid":groupid}).then(function() {
          row.remove();
        });
      }
    });
  }


  init();

});
