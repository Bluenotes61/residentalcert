var db = require("../helpers/db.js");
var common = require("../helpers/common.js");
var Q = require('q');

/*** Render page ***/
exports.index = function(req, res) {  
  var testid = req.query.id;
  var testinfo;
  var curruser;
  getUser(req, res).then(
    function(user) {
      curruser = user;
      return common.getTestInfo(testid);
    }
  ).then(
    function(info){
      testinfo = info;
      return getResults(curruser, testid);
    }
  ).then(
    function(results){
      var reshtml = "";
      var selhtml = "";
      for (var i=0; i < results.length; i++) {
        var rno = results.length - i;
        reshtml += getOneResult(results[i], rno);
        selhtml += "<a data-idx='" + rno + "' " + (i==0 ? "class='selected'" : "") + ">" + rno + "</a>";
      }
      res.render("myresult", {
        pagetitle:"Resident certifier - Testresultat",
        title1:testinfo.groupname,
        title2:testinfo.name,
        title3:testinfo.description,
        resultshtml:reshtml,
        selecthtml:selhtml, 
        testinfo:testinfo,
        userid:curruser.id
      });
    },
    function(err){
      res.render("myresult", {
        pagetitle:"Resident certifier - Testresultat",
        pageerror: err
      });
    }
  );
};

function getUser(req, res) {
  var d = Q.defer();
  if (req.query.uid && req.query.uid.length > 0) {
    common.createUser(null, req.query.uid).then(
      function(user) {
        d.resolve(user);
      }
    );
  }
  else
    d.resolve(res.user);
  return d.promise;
}

function getOneResult(result, rno) {
  var table = "<div class='tablediv'><div class='thead'><div class='row clearfix'><div class='col col1'>Fråga</div><div class='col col2'>Svar</div><div class='col col3'></div></div></div><div class='tbody'>";
  var correct = 0;
  for (var i=0; i < result.questions.length; i++) {
    if (result.questions[i].iscorrect)
      correct++;
    var alttext = "";
    for (var j=0; j < result.questions[i].selalts.length; j++) {
      alttext += "<div>" + result.questions[i].selalts[j] + "</div>";
    }
    table += "<div class='row clearfix'><div class='col col1'>" + removerImgAndIframe(result.questions[i].text) + "</div>" +
      "<div class='col col2'>" + removerImgAndIframe(alttext) + "</div>" +
      "<div class='col col3'><img src='" + (result.questions[i].iscorrect ? "/gfx/correct.png" : "/gfx/incorrect.png") + "' /></div></div>";
  }
  table += "</div></div>";
  var header = "<div class='reshead'><h2>Resultat " + rno + "</h2><p>Antal rätta svar: " + correct + " av " + result.questions.length + "</p><p>Datum: " + common.formatDate(result.starttime) + "</p><p>Testtid: " + getDuration(result) + "</div>";
  return "<div class='browseitem item" + rno + "'>" + header + table + "</div>";
}

function getDuration(result) {
  var duration = result.finishtime - result.starttime;
  var h = parseInt(Math.floor(duration/1000/3600));  
  var m = parseInt(duration/1000/60 - h*60);
  return h + " timmar " + m + " minuter";
}

function removerImgAndIframe(src) {
  if (!src) return "";
  src = src.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  src = src.replace(/<img[^>]+\>/i, "");
  return src;
}

function getResults(user, testid) {
  var d = Q.defer();
  var test;
  common.getTestInfo(testid).then(
    function(atest){
      test = atest;
      var sql = "select id, starttime, finishtime from startedtests where userid=? and testid=? and not finishtime is null order by starttime desc";
      return db.runQuery(sql, [user.id, testid]);
    }
  ).then(
    function(starts) {
      var results = [];
      var promises = [];
      for (var i=0; i < starts.length; i++)
        promises.push(getResult(test, starts[i], results));
      Q.all(promises).then(
        function(){
          d.resolve(results);
        },
        function(err) {
          d.reject(err);
        }
      );
    },
    function(err){
      d.reject(err);
    }
  );
  return d.promise;
}

function getResult(test, start, results) {
  var d = Q.defer();
  var sql =
    "select r.startedid, q.id as questionid, q.text, r.iscorrect , ra.altid, ra.alttext " +
    "from testresults r " +
    "inner join testresultsalt ra on " +
    "ra.questionid=r.questionid and ra.startedid=r.startedid " +
    "inner join questions q on " +
    "q.id = r.questionid " +
    "where r.startedid = ?";
  db.runQuery(sql, [start.id]).then(
    function(altrows) {
      start.questions = [];
      for (var i=0; i < test.questions.length; i++) {
        var aquestion = {
          id:test.questions[i].id,
          text:test.questions[i].text
        };
        var answer = getAnswer(aquestion.id, altrows);
        aquestion.iscorrect = answer.iscorrect;
        aquestion.selalts = answer.selalts;
        start.questions.push(aquestion);
      }
      results.push(start);
      d.resolve();
    },
    function(err){
      d.reject(err);
    }
  );
  return d.promise;
}

function getAnswer(questionid, altrows) {
  var iscorrect = false;
  var selalts = [];
  for (var i=0; i < altrows.length; i++) {
    if (questionid == altrows[i].questionid) {
      iscorrect = altrows[i].iscorrect;
      selalts.push(altrows[i].alttext);
    }
  }
  return {iscorrect:iscorrect, selalts:selalts};
}