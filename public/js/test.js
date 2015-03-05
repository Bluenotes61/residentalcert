$(document).ready(function(){

  var width = 900;
  var nofq = 0;
  var currq = 0;
  var firstq = null;
  var endtime = null;
  var maxhours = 1;
  var maxmins = 30;
  var alertCounter = null;
  var alertMinutes = 5;
  var countdown = null;

  function init() {
    $('.icon').tooltipster();

    nofq = $(".questionsdiv .questiondiv").length;
    firstq = $(".questionsdiv .questiondiv:first-child");

    $("#testid").val(started.testid);
    $("#startedid").val(started.id);
    
    var starttime = new Date(started.starttime);
    endtime = new Date(starttime.getTime() + started.testtime*60*1000);
    countDown();
    countdown = setInterval(countDown, 500);

    showCurrentQuestion();
//    $(window).resize(showCurrentQuestion);

    $("#footer .prev a").click(function(){
      if (currq > 0) {
        currq--;
        showCurrentQuestion();
      }
    });
    $("#footer .next a").click(function(){
      if (currq < nofq) {
        currq++;
        showCurrentQuestion();
      }
    });

    $("#testdiv .alternatives .alternative input").prop("checked", false);
    for (var i=0; i < prevselected.length; i++) {
      var alt = $("#a" + prevselected[i]);
      alt.addClass("checked");
      alt.find("input").prop("checked", true);
    }
    updateAnswered();

    $("#testdiv .alternatives .alternative").click(function() {
      var selectedalt = [];
      var inp = $(this).find("input");
      inp.prop("checked", !inp.prop("checked"));
      $(this).parent().children(".alternative").each(function(){
        var currinp = $(this).find("input");
        if (currinp.prop("checked")) {
          $(this).addClass("checked");
          selectedalt.push({
            id: currinp.val().substring(1),
            text: $(this).find(".alttext").html()
          });
        }
        else
          $(this).removeClass("checked");
      });

      updateAnswered();

      ajax.post("/saveanswer", {"startedid":started.id, "questionid":inp.attr("name").substring(1), "selectedalt":selectedalt});
    });
  }

  function updateAnswered() {
    var answered = 0;
    $("#testdiv .alternatives").each(function() {
      if ($(this).find("input:checked").length > 0)
        answered++;
    });
    $("#footer .nofa").text(answered + " besvarade");
    $("#footer .answered .indicator .bar").css("width", answered/nofq*100 + "%");
    $("#finalize").css("bottom", (answered == nofq ? 110 : 0));
  }

  function showCurrentQuestion() {
    var width = $("#testdiv").outerWidth();
    firstq.animate({"margin-left":-currq*width}, 1000, function(){
      var height = $("#testdiv .questiondiv:nth-child(" + String(currq + 1) + ")").outerHeight();
      $("#testdiv .questionsdiv").css("max-height", height);
      if (currq == 0) $("#footer .prev a").css("display", "none");
      else $("#footer .prev a").css("display", "block");
      if (currq == nofq-1) $("#footer .next a").css("display", "none");
      else $("#footer .next a").css("display", "block");

      $("#footer .qnr").text("Fråga " + String(currq+1) + " av " + nofq);
      if (currq < nofq) $("#footer .qnr").show();
      else $("#footer .qnr").hide();
    });
    $('html, body').animate({
      scrollTop: 0
    }, 1000);
  }

  function countDown() {
    var diff = endtime - new Date();
    var hours = parseInt(diff/(1000*3600));
    var mins = parseInt((diff - hours*1000*3600)/(1000*60));
    var secs = parseInt((diff - hours*1000*3600 - mins*1000*60)/1000);
    if (diff > 0)
      $("#footer .time .remaining").text(hours + " tim " + mins + " min " + secs + " sek");
    checkEnded(diff);
    checkAlert(diff);
  }

  function checkAlert(diff) {
    if (!alertCounter && diff < alertMinutes*60*1000) {
      var time = $("#footer .time");
      time.addClass("alert");
      alertCounter = setInterval(function(){
        time.fadeOut(500, function(){
          time.fadeIn(500);
        });
      }, 4000);
    }
  }

  function checkEnded(diff) {
    if (diff <= 0) {
      clearInterval(countdown);
      clearInterval(alertCounter);
      $("#timeup, #bgdim").show();
    }
  }


  init();

});
