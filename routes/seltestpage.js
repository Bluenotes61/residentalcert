var db = require("../helpers/db.js"); 
var common = require("../helpers/common.js");
var Q = require('q');
 
/*** Render page ***/
exports.index = function(req, res) {
  var groupid = req.query.id;
  var studentsopt = "<option value='" + res.user.id + "' selected='selected'>" + res.user.name + "</option>";
  if (common.hasGroupPermission(res.user, groupid, 'student')) {
    var newicon = (common.hasGroupPermission(res.user, groupid, "testadmin") ? "<a class='newtest icon right' title='Skapa ett nytt deltest'><img src='/gfx/plus_white.png' alt='Nytt deltest' /></a>" : "");
    getStudents(res.user.id, groupid, studentsopt).then(
      function(response) {
        studentsopt = response;
        return getTests(res.user, groupid); 
      }
    ).then(
      function(response) {
        var testshtml = getTestHtml(response.tests);
        var results = getResultHtml(res.user, response.tests);
        res.render("seltest", {
          pagetitle:"Resident certifier - Välj deltest", 
          title1:response.group.name,
          title2:response.group.description,
          showres:(req.query.tab == "r"),
          uid: (req.query.uid ? req.query.uid : 0),
          summary:results.summary,
          tests:testshtml, 
          results:results.html, 
          printresults:results.printhtml,
          newicon:newicon,
          group: response.group,
          studentsopt:studentsopt
        });
      },
      function(err){
        res.render("seltest", {
          pagetitle:"Resident certifier - Välj deltest", 
          pageerror: err
        });
      }
    );
  }
  else {
    res.redirect("/");
  }
}; 


function getStudents(userid, groupid, studentsopt) {
  var d = Q.defer();
  var sql = 
    "select u.id, u.name from users u " +
    "inner join permissions p on " +
    "p.userid=u.id " +
    "where p.roleid=? and p.groupid=? and u.addedby=?";
  db.runQuery(sql, ['student', groupid, userid]).then(
    function(rows) {
      if (rows.length == 0)
        d.resolve(studentsopt);
      else {
        var promises = [];
        for (var i=0; i < rows.length; i++) {
          studentsopt += "<option value='" + rows[i].id + "'>" + rows[i].name + "</option>";
          promises.push(getStudents(rows[i].id, groupid, studentsopt));
        }
        Q.all(promises).spread(
          function(response) {
            d.resolve(studentsopt);
          },
          function(err) {
            d.reject(err);
          }
        );
      }
    }
  );
  return d.promise;
}


function getTestHtml(tests) {
  var thtml = "";
  for (var i=0; i < tests.length; i++) {
    thtml += "<div class='row clearfix'>" +
      "<div class='col col1'>" + tests[i].name + "</div>" +
      "<div class='col col2'>" + tests[i].description + "</div>" + 
      "<div class='col col3 btns'>" + tests[i].icons + "</div></div>";
  } 
  return thtml;
}
      
function getResultHtml(user, tests) {
  var rhtml = "";
  var rphtml = "";
  var summaxcorrect = 0;
  var sumcorrect = 0;
  var sumquestions = 0;
  var sumdone = 0;
  for (var i=0; i < tests.length; i++) {
    if (tests[i].results.length > 0)
      sumdone++;
    var maxcorrect = tests[i].results.length*tests[i].nofquestions;
    var trieshtml = "";
    var dates = "";
    for (var j=0; j < tests[i].results.length; j++) {
      var nofcorrect = (tests[i].results[j].nofcorrect ? tests[i].results[j].nofcorrect : 0);
      var percent = (tests[i].nofquestions == 0 ? 0 : Math.round(nofcorrect/tests[i].nofquestions*100));
      trieshtml += "<div>" + nofcorrect + " av " + tests[i].nofquestions + " (" + percent + "%)</div>";
      dates += "<div>" + common.formatDate(tests[i].results[j].finishtime) + "</div>";
      summaxcorrect += tests[i].nofquestions;
      sumcorrect += tests[i].results[j].nofcorrect;
    }
    sumquestions += tests[i].nofquestions;
    if (tests[i].results.length > 0) {
      rhtml += 
        "<div class='row clearfix'>" +
        "<div class='col col1'><div class='name'>" + tests[i].name + "</div><div class='description'>" + tests[i].description + "</div></div>" +
        "<div class='col col2'>" + trieshtml + "</div>" + 
        "<div class='col col3'>" + dates + "</div>" + 
        "<div class='col col4'><a class='icon tooltipstered' href='/resultat?id=" + tests[i].id + "&uid=" + user.id + "'><img alt='Detaljer' src='/gfx/info.png'></a></div></div>";
      rphtml +=
        "<tr><td><div class='name'>" + tests[i].name + "</div><div class='description'>" + tests[i].description + "</div></td>" +
        "<td>" + dates + "</td><td>" + trieshtml + "</td></tr>";
    }
  } 
  var summary = {
    noftests:tests.length,
    nofdonetests: sumdone,
    nofquestions:sumquestions,
    supervisor:user.supervisor,
    username:user.name,
    total:(summaxcorrect == 0 ? 0 : Math.round(sumcorrect/summaxcorrect*100))
  };
  return {summary:summary, html:rhtml, printhtml:rphtml};
}

/*** Get the available testgroups and tests for the current user together with icons, based on permissions, for each test. ***/
function getTests(user, groupid) { 
  var d = Q.defer();
  var currgroup = null;
  db.runQuery("select * from testgroups where id=?", [groupid]).then(
    function(group) {
      currgroup = group;
      var sql = "select t.id, t.name, t.description, count(q.id) as nofquestions " +
        "from tests t " +
        "left outer join questions q on " +
        "q.testid=t.id " +
        "where groupid=? " +
        "group by t.id, t.name, t.description";
      return db.runQuery(sql, [groupid]);
    }
  ).then(
    function(tests) {
      var appends = [];
      for (var i=0; i < tests.length; i++) 
        appends.push(appendResult(user, groupid, tests[i]));
      Q.all(appends).then(
        function(){
          d.resolve({group:currgroup[0], tests:tests});
        },
        function(err) {
          d.reject(err);
        }
      );
    },
    function(err){
      console.log("Reject");
      d.reject(err);
    }
  );
  return d.promise;
}

function appendResult(user, groupid, test) {
  var d = Q.defer();
  var sql = 
    "select st.id, st.finishtime, sum(tr.iscorrect) as nofcorrect " +
    "from startedtests st " +
    "left outer join testresults tr on " +
    "tr.startedid = st.id " +
    "where st.testid=? and st.userid=? and not st.finishtime is null " +
    "group by st.id " +
    "order by st.starttime desc";
  db.runQuery(sql, [test.id, user.id]).then(
    function(rows) {
      test.results = rows;

      test.icons = "";
      if (common.hasGroupPermission(user, groupid, "questionadmin"))
        test.icons += "<a href='/admintest?id=" + test.id + "' class='icon' title='Redigera deltestet'><img src='/gfx/pen.png' alt='Redigera' /></a>";
      else if (common.hasGroupPermission(user, groupid, "supervisor"))
        test.icons += "<a href='/admintest?id=" + test.id + "' class='icon' title='Deltestets egenskaper'><img src='/gfx/info.png' alt='Egenskaper' /></a>";
      if (common.hasGroupPermission(user, groupid, "testadmin"))
        test.icons += "<a class='delete icon' data-id='" + test.id + "' title='Ta bort deltestet'><img src='/gfx/x.png' alt='Ta bort' /></a>";
      test.icons += "<a href='/starttest?id=" + test.id + "' class='icon' title='Starta deltestet'><img src='/gfx/start.png' alt='Starta testet' /></a>";

      d.resolve();
    },
    function(err){
      d.reject(err);
    }
  );
  return d.promise;
}


exports.newTest = function(req, res) {
  var sql = 
    "insert into tests (groupid, name, description, testtime, randomquestions, nofquestions, noftries) " +
    "values(?, ?, ?, 90, 1, 0, 2)";
  db.runQuery(sql, [req.body.groupid, req.body.name, req.body.description]).then(
    function(response) {
      res.json(response.insertId);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.deleteTest = function(req, res) {
  db.runQuery("delete from tests where id=?", [req.body.id]).then(
    function(response) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.getUserResults = function(req, res) {
  var user;
  common.createUser(null, req.body.userid).then(
    function(auser) {
      user = auser;
      return getTests(user, req.body.groupid);
    }
  ).then(
    function(response) {
      res.json(getResultHtml(user, response.tests));
    },
    function(err){
      res.end(err);
    }
  );
}
