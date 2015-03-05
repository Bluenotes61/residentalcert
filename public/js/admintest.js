$(document).ready(function(){

  var tinyWidth = parseInt($("#content .frames").outerWidth()) - 6;

  var tinyConfigs = {
    mode:'exact',
    width:tinyWidth,
    height:200,
    relative_urls:true,
    remove_script_host : false,
    browser_spellcheck:true,
    paste_as_text:true,
    statusbar:true,
    language:'sv',
    content_css:'/css/base.css,/css/tiny.css',
    forced_root_block:'p',
    extended_valid_elements:'script[charset|defer|language|src|type]',
    plugins: "paste textcolor spellchecker uploadimage media code",
    toolbar: "styleselect | uploadimage media | bold italic underline | alignleft aligncenter alignright | forecolor | undo redo | code",
    menu: {},
    style_formats: [
      {title:'Rubrik 1', block:'h1'},
      {title:'Rubrik 2', block:'h2'},
      {title:'Rubrik 3', block:'h3'},
      {title:'Rubrik 4', block:'h4'},
      {title:'Brödtext', block:'p'}
    ]
  };

  function init() {
    $('.icon').tooltipster();
 
    initTabNavigation();

    initTabTest();
    initTabQuestions();
  }


  function hmFromRawMin() {
    var h = parseInt(Math.floor($("#admintest .testtime .rawval").text()/60));  
    var m = parseInt($("#admintest .testtime .rawval").text() - h*60);
    return {h:h, m:m};
  }

  function minFromHm(h, m) {
    var h = parseInt(h);
    if (!$.isNumeric(h)) h = 0;
    var m = parseInt(m);
    if (!$.isNumeric(m)) m = 0;
    return h*60 + m;
  }

  /*** Init events in tab 'Test' ***/
  function initTabTest() {
    $("#admintest .nofq .edit input.allq").on("change", function(){
      $("#admintest .nofq .edit input.nofqval").css("display", $(this).prop("checked") ? "none" : "inline").prop("max", questions.length).val(questions.length);
    });

    $("#admintest input.janej").onoff();

    var hm = hmFromRawMin();
    $("#admintest .testtime .static").text(hm.h + " tim " + hm.m + " min");
    $("#admintest .randomquestions .static").text($("#admintest .randomquestions .rawval").text() == "1" ? "Ja" : "Nej");
    $("#admintest .nofq .static").text($("#admintest .nofq .rawval").text() == "0" ? "Alla" : $("#admintest .nofq .rawval").text());

    $("#admintest a.editbtn").click(function(){
      $("#admintest .name .edit input").val($("#admintest .name .static").text());
      $("#admintest .description .edit textarea").val($("#admintest .description .static").text());
      var hm = hmFromRawMin();
      $("#admintest .testtime .edit input.hours").val(hm.h);
      $("#admintest .testtime .edit input.minutes").val(hm.m);
      $("#admintest .randomquestions .edit input").prop("checked", ($("#admintest .randomquestions .rawval").text() == "1"));
      var nofq = parseInt($("#admintest .nofq .rawval").text());
      $("#admintest .nofq .edit input.allq").prop("checked", (nofq == 0));
      $("#admintest .nofq .edit input.nofqval").css("display", nofq == 0 ? "none" : "inline").val(nofq);
      $("#admintest .noftries .edit input").val($("#admintest .noftries .static").text());

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
      var h = $("#admintest .testtime .edit input.hours").val();
      var m = $("#admintest .testtime .edit input.minutes").val();
      var testdata = {
        id: $("#admintest .testid").val(), 
        name: $("#admintest .name .edit input").val(), 
        description: $("#admintest .description .edit textarea").val(), 
        testtime: minFromHm(h, m), 
        randomquestions: ($("#admintest .randomquestions .edit input").prop("checked") ? 1 : 0), 
        nofquestions: ($("#admintest .nofq .edit input.allq").prop("checked") ? "0" : $("#admintest .nofq .edit input.nofqval").val()),
        noftries: $("#admintest .noftries .edit input").val()
      };
      $("#admintest .name .static").text(testdata.name);
      $("#admintest .description .static").text(testdata.description);
      $("#admintest .testtime .static").text(h + " tim " + m + " min");
      $("#admintest .testtime .rawval").text(testdata.testtime);
      $("#admintest .randomquestions .static").text(testdata.randomquestions ? "Ja" : "Nej");
      $("#admintest .randomquestions .rawval").text(testdata.randomquestions);
      $("#admintest .nofq .static").text(testdata.nofquestions == 0 ? "Alla" : testdata.nofquestions);
      $("#admintest .nofq .rawval").text(testdata.nofquestions);
      $("#admintest .noftries .static").text(testdata.noftries);
      ajax.post("/saveedittest", {"testdata":testdata}).then(function(err) {
        $("#admintest .static").show();
        $("#admintest .static.icon").css("display", "inline-block");
        $("#admintest .edit").hide();
      });
    });
  }



  /*** 
    Init questions and events in tab 'Frågor' 
  ***/
  function initTabQuestions() {
    $("#adminq .header a.newbtn").click(addQuestion);

    var qdom = $("#adminq .questiondiv");
    qdom.find("input.ismulti").change(setQuestionType);
    qdom.find("input.randomalt").change(setRandomAlt);
    qdom.find(".qstatic .editbtn").click(editQuestion);
    qdom.find(".qstatic .delbtn").click(deleteQuestion);
    qdom.find(".qstatic .upbtn").click(moveQuestionUp);
    qdom.find(".qstatic .downbtn").click(moveQuestionDown);
    qdom.find(".alternatives .newbtn").click(addAlternative);
    qdom.find(".qedit .savebtn").click(saveEditQuestion);
    qdom.find(".qedit .cancelbtn").click(cancelEditQuestion);

    // Generate row with question selectors
    var html = "";
    for (var i=0; i < questions.length; i++) {
      html += "<a data-id='" + questions[i].id + "' title='Fråga " + String(i+1) + "'>" + String(i+1) + "</a>";
    }
    $("#adminq .browse").html(html);
    $("#adminq .browse a").click(function(){
      $("#adminq .browse a").removeClass("selected");
      $(this).addClass("selected");
      setQuestion($(this).data("id"));
    });
    var firsta = $("#adminq .browse a:first-child");
    if (firsta.length > 0) {
      setQuestion(firsta.data("id"));
      firsta.addClass("selected");
    }
  }

  function questionFromId(id) {
    var aquestion = null;
    for (var i=0; i < questions.length && !aquestion; i++) {
      if (questions[i].id == id)
        aquestion = questions[i];
    }
    return aquestion;
  }

  function setQuestion(qid) {
    var question = questionFromId(qid);

    var qdom = $("#adminq .questiondiv");
    qdom.fadeOut(500, function(){
      qdom.find("h2.idx").text("Fråga " + String(question.idx + 1));
      qdom.find("input.ismulti").prop("checked", question.type == "multiple");
      qdom.find("div.ismulti").css("display", (question.type == "multiple") ? "inline" : "none");
      qdom.find("input.randomalt").prop("checked", question.randomalternatives);
      qdom.find("div.randomalt").css("display", question.randomalternatives ? "inline" : "none");
      qdom.find(".question").html(question.text);
      qdom.find("a, input").data("qid", qid);

      qdom.find(".altlist").empty();
      for (var i=0; i < question.alternatives.length; i++) {
        var adom = getAlternativeDOM(question.alternatives[i]);
        qdom.find(".altlist").append(adom);
      }
      qdom.find("input.janej").onoff();

      qdom.fadeIn(500);
    });
  }

  function addQuestion() {
    var testid = $("#admintest .testid").val();    
    ajax.post("/getnewquestion", {"testid":testid}).then(function(newquestion) {
      newquestion.idx = questions.length;
      questions.push(newquestion);
      var idx = newquestion.idx + 1;
      $("#adminq .browse a").removeClass("selected");
      var newbtn = $("<a title='Fråga " + idx + "' class='selected' data-id='" + newquestion.id + "'>" + idx + "</a>");
      newbtn.click(function(){
        $("#adminq .browse a").removeClass("selected");
        $(this).addClass("selected");
        setQuestion($(this).data("id"));
      });
      $("#adminq .browse").append(newbtn);
      setQuestion(newquestion.id);
    });
  }

  function deleteQuestion(qid) {
    if (confirm("Är du säker på att du vill ta bort frågan?")) {
      var qid = $(this).data("qid");
      var question = questionFromId(qid);
      ajax.post("/deletequestion", {"qid":qid}).then(function(result) {
        var curridx = question.idx;
        $("#adminq .browse a:nth-child(" + String(question.idx + 1) + ")").remove();
        questions.splice(question.idx, 1);
        for (var i=question.idx; i < questions.length; i++) {
          questions[i].idx--;
          $("#adminq .browse a:nth-child(" + String(i + 1) + ")").text(i + 1);
        }
        if(curridx > questions.length - 1)
          curridx--;
        if (curridx >= 0) {
          $("#adminq .browse a:nth-child(" + String(curridx + 1) + ")").addClass("selected");
          setQuestion(questions[curridx].id);
        }
        else
          $("#adminq .questiondiv").fadeOut(500);
      });
    }
  }

  function setQuestionType() {
    var qid = $(this).data("qid");
    var type = ($(this).prop("checked") ? "multiple" : "single");
    if (type == "single") {
      $(".questiondiv .alternatives .altlist div.alternative input.iscorrect:checked").each(function(i){
        if (i > 0) {
          $(this).prop("checked", 0);
          setCorrectAlternative(this);
        }
      });
    }
    ajax.post("/setquestiontype", {"qid":qid, "type":type}).then(function() {
      questionFromId(qid).type = type;
    });
  }

  function setRandomAlt() {
    var qid = $(this).data("qid");
    var randomalt = ($(this).prop("checked") ? 1 : 0);
    ajax.post("/setrandomalt", {"qid":qid, "randomalt":randomalt}).then(function() {
      questionFromId(qid).randomalternatives = randomalt;
    });
  }

  function moveQuestionUp() {
    moveQuestion(this, "up");
  }

  function moveQuestionDown() {
    moveQuestion(this, "down");
  }

  function moveQuestion(a, dir) {
    var qid = $(a).data("qid");
    var question = questionFromId(qid);
    var thiselem = $("#adminq .browse a:nth-child(" + String(question.idx + 1) + ")");
    var selem = (dir == "up" ? thiselem.prev() : thiselem.next());
    if (selem.length > 0) {
      var sqid = selem.data("id");
      var squestion = questionFromId(sqid);
      ajax.post("/movequestion", {"q1id":qid, "q2id":sqid}).then(function(result) {
        if (dir == "up") {
          question.idx--;
          squestion.idx++;
          thiselem.after(selem);
        }
        else {
          question.idx++;
          squestion.idx--;
          thiselem.before(selem);
        }
        thiselem.text(question.idx + 1);
        selem.text(squestion.idx + 1);
        $("#adminq .questiondiv .head h2").text("Fråga " + String(question.idx + 1));
      });
    }
  }

  function editQuestion() {
    var qid = $(this).data("qid");
    var question = questionFromId(qid);
    $("#editquestion").val(question.text);
    $("#editquestion").tinymce(tinyConfigs);
    $(".questiondiv .qstatic").hide();
    $(".questiondiv .qedit").show();
  }

  function cancelEditQuestion() {
    $(".questiondiv .qstatic").show();
    $(".questiondiv .qedit").hide();
    $("#editquestion").tinymce().remove();
  }

  function saveEditQuestion() {
    var qid = $(this).data("qid");
    var question = questionFromId(qid);
    var qcontent = $("#editquestion").tinymce().getContent();
    ajax.post("/savequestion", {id:qid, content:qcontent}).then(function() {
      question.text = qcontent;
      $(".questiondiv .question").html(qcontent);
      cancelEditQuestion();
    });
  }



  function alternativeFromId(question, aid) {
    var alt = null;
    for (var i=0; i < question.alternatives.length && !alt; i++) {
      if (question.alternatives[i].id == aid)
        alt = question.alternatives[i];
    }
    return alt;
  }

  function getAlternativeDOM(alternative) {
    var adom = $("#templates .alternative").clone();
    adom.data("aid", alternative.id);
    adom.find("input.iscorrect").prop("checked", alternative.correctanswer);
    adom.find("span.iscorrect").css("display", (alternative.correctanswer ? "inline" : "none"));
    adom.find("h3.idx").text("Alternativ " + String(alternative.idx + 1));
    adom.find(".text").html(alternative.text);
    adom.find("a, input").data("qid", alternative.questionid);
    adom.find("a, input").data("aid", alternative.id);
    adom.find("input.janej").onoff();
    adom.find("input.iscorrect").change(function(){
      setCorrectAlternative(this);
    });
    adom.find(".editbtn").click(editAlternative);
    adom.find(".delbtn").click(deleteAlternative);
    adom.find(".upbtn").click(moveAlternativeUp);
    adom.find(".downbtn").click(moveAlternativeDown);
    adom.find(".savebtn").click(saveAlternative);
    adom.find(".cancelbtn").click(cancelEditAlternative);
    adom.find('.icon').tooltipster();
    return adom;
  }

  function addAlternative() {
    var qid = $(this).data("qid");
    var question = questionFromId(qid);
    ajax.post("/getnewalternative", {"qid":qid}).then(function(alternative) {
      alternative.idx = question.alternatives.length;
      question.alternatives.push(alternative);
      var adom = getAlternativeDOM(alternative);
      $("#adminq .questiondiv .altlist").append(adom);
    });
  }

  function deleteAlternative() {
    if (confirm("Är du säker på att du vill ta bort alternativet?")) {
      var qid = $(this).data("qid");
      var aid = $(this).data("aid");
      var question = questionFromId(qid);
      var alternative = alternativeFromId(question, aid);
      ajax.post("/deletealternative", {"aid":aid}).then(function(result) {
        var curridx = alternative.idx;
        $("#adminq .questiondiv .altlist div.alternative:nth-child(" + String(alternative.idx + 1) + ")").remove();
        question.alternatives.splice(alternative.idx, 1);
        for (var i=alternative.idx; i < question.alternatives.length; i++) {
          question.alternatives[i].idx--;
          $("#adminq .questiondiv .altlist div.alternative:nth-child(" + String(i + 1) + ") .althead h3").text("Alternativ " + String(i + 1));
        }
      });
    }
  }

  function moveAlternativeUp() {
    moveAlternative(this, "up");
  }

  function moveAlternativeDown() {
    moveAlternative(this, "down");
  }

  function moveAlternative(a, dir) {
    var isedited = $(".questiondiv .alternatives .altlist .mce-tinymce").length > 0;
    if (isedited) return;

    var qid = $(a).data("qid");
    var aid = $(a).data("aid");
    var question = questionFromId(qid);
    var alternative = alternativeFromId(question, aid);
    var thiselem = $(".questiondiv .alternatives .altlist div.alternative:nth-child(" + String(alternative.idx + 1) + ")");
    var selem = (dir == "up" ? thiselem.prev() : thiselem.next());
    if (selem.length > 0) {
      var said = selem.data("aid");
      var salternative = alternativeFromId(question, said);
      ajax.post("/movealternative", {"a1id":aid, "a2id":said}).then(function(result) {
        if (dir == "up") {
          alternative.idx--;
          salternative.idx++;
          thiselem.after(selem);
        }
        else {
          alternative.idx++;
          salternative.idx--;
          thiselem.before(selem);
        }
        thiselem.find(".althead h3").text("Alternativ " + String(alternative.idx + 1));
        selem.find(".althead h3").text("Alternativ " + String(salternative.idx + 1));
      });
    }
  }

  function setCorrectAlternative(inp) {
    var correct = ($(inp).prop("checked") ? 1 : 0);
    var question = questionFromId($(inp).data("qid"));
    if (question.type == "single" && correct) {
      $(".questiondiv .alternatives .altlist div.alternative input.iscorrect").each(function(){
        if (this != inp) {
          $(this).prop("checked", 0);
          setCorrectAlternative(this);
        }
      });
    }
    var aid = $(inp).data("aid");
    ajax.post("/setcorrectalternative", {"correct":correct, "aid":aid}).then(function() {
      var alternative = alternativeFromId(question, aid);
      alternative.correctanswer = correct;
    });

  }

  function editAlternative() {
    var qid = $(this).data("qid");
    var aid = $(this).data("aid");
    var alternative = alternativeFromId(questionFromId(qid), aid);
    var adom = $(".questiondiv .alternatives .altlist div.alternative:nth-child(" + String(alternative.idx + 1) + ")");
    adom.find(".edittext").val(alternative.text);
    adom.find(".edittext").tinymce(tinyConfigs);
    adom.find(".astatic").hide();
    adom.find(".aedit").show();
  }

  function cancelEditAlternative() {
    var qid = $(this).data("qid");
    var aid = $(this).data("aid");
    var alternative = alternativeFromId(questionFromId(qid), aid);
    var adom = $(".questiondiv .alternatives .altlist div.alternative:nth-child(" + String(alternative.idx + 1) + ")");
    adom.find(".astatic").show();
    adom.find(".aedit").hide();
    adom.find(".edittext").tinymce().remove();
  }

  function saveAlternative() {
    var qid = $(this).data("qid");
    var aid = $(this).data("aid");
    var alternative = alternativeFromId(questionFromId(qid), aid);
    var adom = $(".questiondiv .alternatives .altlist div.alternative:nth-child(" + String(alternative.idx + 1) + ")");
    var acontent = adom.find(".edittext").tinymce().getContent();
    ajax.post("/savealternative", {aid:aid, content:acontent}).then(function() {
      alternative.text = acontent;
      adom.find(".text").html(acontent);
      adom.find(".astatic").show();
      adom.find(".aedit").hide();
      adom.find(".edittext").tinymce().remove();
    });
  }





  /*** Init events i tab 'Användare' ***/
  function initTabUsers() {
    initUserButtons();

    // Add user
    $("#usersdiv .sectionhead .newbtn").click(function(){
      var options = "<option></option>";
      for (var i=0; i < roles.length; i++)
        options += "<option value='" + roles[i].id + "'>" + roles[i].name + "</option>";
      $("#usersdiv table.users tr.newuser").remove();
      var newtrhtml = "<tr class='newuser'>" + 
        "<td><input type='text' class='email' /></td>" + 
        "<td><input type='text' class='uname' /></td>" + 
        "<td><select class='role'>" + options + "</select></td>" + 
        "<td class='btns'>" +
          "<a title='Spara ändringar' class='savebtn icon'><img alt='Spara' src='/gfx/cd.png'></a>" +
          "<a title='Avbryt' class='cancelbtn icon'><img alt='Avbryt' src='/gfx/cancel.png'></a>" +
        "</td>" + 
      "</tr>";
      var newtr = $(newtrhtml);
      $("#usersdiv table.users tbody").prepend(newtr);
      newtr.find("input, select").focus(function(){
        $(this).removeClass("error");
      });
    
      // Cancel add user
      newtr.find("a.cancelbtn").click(function(){
        newtr.remove();
      });

      // Save new user
      newtr.find("a.savebtn").click(function(){
        var emailRegExp = new RegExp("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$", "i");
        var errsel = "";
        var email = newtr.find("input.email").val();
        var aname = newtr.find("input.uname").val();
        var roleid = newtr.find("select.role").val();
        var rolename = newtr.find("select.role option:selected").text();
        if (email.length == 0) errsel += "input.email";
        if (!emailRegExp.test(email)) errsel += ",input.email";
        if (aname.length == 0) errsel += ",input.uname";
        if (roleid.length == 0) errsel += ",select.role";
        if (errsel.indexOf(',') == 0) errsel = errsel.substring(1);
        newtr.find(errsel).addClass("error");
        if (errsel.length == 0) {
          var testid = $("#admintest .testdiv .testid").val();
          ajax.get("/adduser", {"testid":testid, "email":email, "name":aname, "roleid":roleid, "rolename":rolename}).then(function(res) {
            if (res.err == "Existing")
              newtr.find("input.email").addClass("error");
            else {
              newtr.remove();
              var oresrow = $(res.rowhtml);
              $("#usersdiv table.users tbody").prepend(oresrow);
              initUserButtons(oresrow);
            }
          });
        }
      });
    });
  }


  /*** Init user button events ***/
  function initUserButtons(sel) {

    var root = (sel ? sel : $("#usersdiv"));
    // Start edit user
    $(root).find(".btns .editbtn").click(function(){
      var tr = $(this).parent().parent();
      var roleid = tr.find(".rolecol span.stat").data("roleid");
      tr.find(".rolecol select.role").val(roleid);
      var aname = tr.find(".namecol span").text();
      tr.find(".namecol input.uname").val(aname);
      tr.addClass("editrow");
    });
    
    // Cancel edit user
    $(root).find(".btns .cancelbtn").click(function(){
      $(this).parent().parent().removeClass("editrow");
    });

    // Save edit user
    $(root).find(".btns .savebtn").click(function(){
      var testid = $("#admintest .testdiv .testid").val();
      var tr = $(this).parent().parent();
      var userdata = {
        "testid": testid,
        "uid": tr.data("uid"),
        "name": tr.find(".namecol input.uname").val(),
        "roleid": tr.find(".rolecol select.role").val()
      };
      var rolename = tr.find(".rolecol select.role option:selected").text();
      ajax.get("/saveedituser", {"userdata":userdata}).then(function() {
        tr.find(".namecol span").text(userdata.name);
        tr.find(".rolecol span").text(rolename);
        tr.removeClass("editrow");
      });
    });

    // Delete user
    $(root).find(".btns .delbtn").click(function(){
      var tr = $(this).parent().parent();
      var aname = tr.find(".namecol span").text();
      var uid = tr.data("uid");
      var testid = $("#admintest .testdiv .testid").val();
      if (confirm("Är du säker på att du vill ta bort användare " + aname + " från testet?")) {
        ajax.get("/deleteuser", {"uid":uid, "testid":testid}).then(function() {
          tr.remove();
        });
      }
    });
  }


  init();

});
