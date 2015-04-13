$(document).ready(function(){

  function init() {

    $('.icon').tooltipster();
    assignDelete($(".tablediv .tbody"));

    initTabNavigation();

    if (showres) {
      $(".tabs .tab").removeClass("selected");
      $(".tabs .tab.results").addClass("selected");
      $("#start").hide();
      $("#results").show();
      $("#results .selelev").val(uid);
      getResults(uid);
    }

    $("#results .selelev").change(function(){
      getResults($(this).val());
    });

    $("#results .header .print").click(function(){
      $("#pdfhtml").val($("#print").html());
      $("#printform").submit();
    });

    // Create new test
    $("a.newtest").click(function(){
      $(".tablediv .tbody div.newrow").remove();
      var row = $("<div class='newrow row clearfix'>" +
        "<div class='col col1'><input type='text' class='testname' /></div>" +
        "<div class='col col2'><textarea class='testdescr'></textarea></div>" + 
        "<div class='col col3 btns'>" + 
        "<a class='save icon'><img src='/gfx/cd.png' alt='Spara' title='Spara' /></a>" +
        "<a class='cancel icon'><img src='/gfx/cancel.png' alt='Avbryt' title='Avbryt' /></a>" +
        "</div></div>");
      $(".tablediv .tbody").prepend(row);
      
      row.find("input.testname").focus(function(){
        $(this).removeClass("error");
      });
      row.find("a.save").click(function(){
        var aname = row.find("input.testname").val();
        var adescr = row.find("textarea.testdescr").val();
        if (aname.length == 0) {
          row.find("input.testname").addClass("error");
          return;
        }
        ajax.post("/savenewtest", {"groupid":groupid, "name":aname, "description":adescr}).then(function(id) {
          var newrow = $("<div class='newrow row clearfix'>" +
            "<div class='col col1'>" + aname + "</div>" +
            "<div class='col col2'>" + adescr + "</textarea></div>" + 
            "<div class='col col3 btns'>" + 
            "<a href='/admintest?id=" + id + "' class='icon' title='Redigera deltestet'><img src='/gfx/pen.png' alt='Redigera test' title='Redigera test' /></a>" +
            "<a class='icon delete' data-id='" + id + "' title='Ta bort deltestet'><img src='/gfx/x.png' alt='Ta bort test' /></a>" +
            "<a href='/resultat?id=" + id + "' class='icon' title='Visa resultat av deltestet'><img src='/gfx/info.png' alt='Resultat' /></a>" +
            "<a href='/test?id=" + id + "' class='icon' title='Starta deltestet'><img src='/gfx/start.png' alt='Starta' /></a>" +
            "</div></div>");
          $(".tablediv .tbody div.newrow").remove();
          $(".tablediv .tbody").prepend(newrow);
          assignDelete(newrow);
        });

      });
      row.find("a.cancel").click(function(){
        $(".tablediv .tbody div.newrow").remove();
      });
    });
  }

  // Assign event to delete buttons
  function assignDelete(parent) {
    parent.find("div.btns a.delete").click(function() {
      var id = $(this).data("id");
      var row = $(this).parent().parent();
      var aname = row.find("div:first-child").text();
      if (confirm("Är du säker på att du vill ta bort testet " + aname + "?")) {
        if (confirm("Deltestet, inklusive alla resultat, kommer att tas bort. Vill du fortsätta?")) {
          $.post("/deletetest", {"id":id}, function(err) {
            if (err) console.log(err);
            row.remove();
          });
        }
      }
    });

  }

  function getResults(userid) {
    ajax.post("/getuserresults", {userid:userid, groupid:groupid}).then(
      function(response) {
        console.log(response);
        $("#print .username").text(response.summary.username);
        $(".summary .noftests").text(response.summary.noftests);
        $(".summary .nofdonetests").text(response.summary.nofdonetests);
        $(".summary .totres").text(response.summary.total + " %");
        $(".summary .supervisor").text(response.summary.supervisor);
        $("#results .tablediv .tbody").html(response.html);
        $("#print .results tbody").html(response.printhtml);
      }
    );
  }

  init();

});
