var db = require("../helpers/db.js");
var common = require("../helpers/common.js"); 
var Q = require('q');

var questiontmpl =
  "<div class='questiondiv' id='{qid}'>" +
    "<div class='question'>{qtext}</div>" +
    "<div class='info'>{info}</div>" +
    "<div class='alternatives'>{alt}</div>" +
  "</div>";
var alttmpl = 
  "<div id='{aid}' class='alternative'>" + 
    "<input type='{inptype}' name='{qid}' value='{aid}' />" + 
    "<div class='alttext'>{atext}</div>" +
  "</div>";
 

/*** Render page ***/
exports.index = function(req, res) {
  var testid = (req.query.id ? req.query.id : 0);
  var startedid = req.query.sid;
  var testinfo;
  common.hasTestPermission(res.user, testid, 'student').then(
    function(ok) {
      if (ok) 
        return common.getTestInfoForUser(testid, res.user.id);
      else
        res.redirect("/");
    }
  ).then(
    function(info) {
      testinfo = info;
      return getStartedTest(res.user, testid, startedid);
    }
  ).then(
    function(started) {
      started.testtime = testinfo.testtime;

      if (testinfo.nofquestions > 0 && testinfo.nofquestions < testinfo.questions.length) 
        testinfo.questions.length = testinfo.nofquestions;

      if (testinfo.randomquestions)
        testinfo.questions = randomizeArray(testinfo.questions);

      var usedsql = 
        "insert into usedquestions (questionid, userid, counter) " +
        "values (?, ?, 1) " +
        "on duplicate key update counter = counter + 1"
      var qhtml = "";
      for (var i=0; i < testinfo.questions.length; i++) {
        db.runQuery(usedsql, [testinfo.questions[i].id, res.user.id]);
        var althtml = "";
        var alts = testinfo.questions[i].alternatives;
        if (testinfo.questions[i].randomalternatives)
          alts = randomizeArray(alts);
        var inptype = (testinfo.questions[i].type == 'multiple' ? 'checkbox' : 'radio');
        for (var j=0; j < alts.length; j++) {
          var checked = (started.prevsel.indexOf(alts[j].id) >= 0 ? "checked" : "");
          althtml += alttmpl.replace("{qid}", "q" + testinfo.questions[i].id)
            .replace(/{aid}/g, "a" + alts[j].id)
            .replace("{atext}", alts[j].text)
            .replace("{inptype}", inptype);
        }
        var info = (testinfo.questions[i].type == 'multiple' ? 'Välj ett eller flera alternativ' : 'Välj ett alternativ');
        qhtml += questiontmpl.replace("{qid}", "q" + testinfo.questions[i].id)
          .replace("{qid}", "q" + testinfo.questions[i].id)
          .replace("{qtext}", testinfo.questions[i].text)
          .replace("{info}", info)
          .replace("{alt}", althtml);
      }

      res.render("test", {
        pagetitle:"Resident certifier - Test", 
        title1:testinfo.groupname,
        title2:testinfo.name,
        title3:testinfo.description,
        started:JSON.stringify(started, null, 2),
        prevselected:JSON.stringify(started.prevsel, null, 2),
        questions:qhtml
      });
    },
    function(err){
      res.render("test", {
        pagetitle:"Resident certifier - Test", 
        pageerror:err
      });
    }
  );
}

function randomizeArray(arr) {
  var idx = arr.length;
  while (idx != 0) {
    rndIdx = Math.floor(Math.random() * idx);
    idx--;
    var val = arr[idx];
    arr[idx] = arr[rndIdx];
    arr[rndIdx] = val;
  }
  return arr;
}


function getStartedTest(user, testid, startedid) {
  var d = Q.defer();
  var started;
  if (startedid == 0) {
    var now = new Date();
    db.runQuery("insert into startedtests (userid, testid, starttime) values(?, ?, ?)", [user.id, testid, now]).then(
      function(result) {
        d.resolve({
          id:result.insertId, 
          starttime:now, 
          testid:testid,
          prevsel:[]
        });
      },
      function(err){
        d.reject(err);
      }
    );
  }
  else {
    db.runQuery("select * from startedtests where id=? and userid=? and testid=?", [startedid, user.id, testid]).then(
      function(rows) {
        if (rows.length == 0) 
          d.reject(); 
        else if (!rows[0].finishtime) {
          started = rows[0];
          return db.runQuery("select altid from testresultsalt where startedid=?", [started.id]);
        }
        else
          d.reject();
      }
    ).then(
      function(alts) {
        var prevsel = [];
        for (var i=0; i < alts.length; i++)
          prevsel.push(alts[i].altid);
        started.prevsel = prevsel;
        d.resolve(started);
      },
      function(err){
        d.reject();
      }
    );
  }
  return d.promise;
}

function isAnswerCorrect(answerlist, correctlist) {
  if (answerlist.length != correctlist.length)
    return false;
  var iscorrect = true;
  for (var i=0; i < correctlist.length && iscorrect; i++) {
    var found = false;
    for (var j=0; j < answerlist.length && !found; j++) {
      if (parseInt(answerlist[j].id) == parseInt(correctlist[i].id))
        found = true;
    }
    iscorrect = found;
  }
  return iscorrect;
}

exports.saveAnswer = function(req, res) {
  var startedid = req.body.startedid;
  var questionid = req.body.questionid;
  var selectedalt = req.body.selectedalt;
  db.runQuery("delete from testresultsalt where startedid=? and questionid=?", [startedid, questionid]).then(
    function(){
      return db.runQuery("delete from testresults where startedid=? and questionid=?;", [startedid, questionid]);
    }
  ).then(
    function(response) {
      var sql = 
        "select a.id from alternatives a " + 
        "inner join questions q on " +
        "a.questionid = q.id " +
        "inner join startedtests s on " + 
        "s.testid = q.testid " + 
        "where s.id=? and q.id=? and a.correctanswer=1"; 
      return db.runQuery(sql, [startedid, questionid]);
    }
  ).then(
    function(correctlist) {
      var sql = "insert into testresultsalt (startedid, questionid, altid, alttext) values(?, ?, ?, ?)";
      for (var i=0; i < selectedalt.length; i++) 
        db.runQuery(sql, [startedid, questionid, selectedalt[i].id, selectedalt[i].text]);
      var correct = isAnswerCorrect(selectedalt, correctlist);
      sql = "insert into testresults (startedid, questionid, iscorrect) values(?, ?, ?)";
      db.runQuery(sql, [startedid, questionid, (correct ? "1" : "0")]);
      res.json({});
    },
    function(err){
      res.end(err);
    }
  );
}
