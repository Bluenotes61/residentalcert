var db = require("../helpers/db.js");
var common = require("../helpers/common.js");
var Q = require('q');

/*** Render page ***/
exports.index = function(req, res) {  
  var testid = req.query.id;
  var isstudent, testinfo;
  common.hasTestPermission(res.user, testid, 'student').then(
    function(ok) {
      if (!ok) {
        res.redirect("/");
        return;
      }
      return common.hasTestPermission(res.user, testid, "supervisor");
    }
  ).then(
    function(notstudent){
      isstudent = !notstudent;
      return common.getTestInfoForUser(testid, res.user.id);
    }
  ).then(
    function(info){
      testinfo = info;
      return getStartedTest(res.user, testinfo, isstudent);
    }
  ).then(
    function(response) {
      if (response.id > 0) {
        res.redirect("/test?id=" + testid + "&sid=" + response.id);
        return
      }
      else {
        testinfo.hm = hmFromMin(testinfo.testtime);
        res.render("starttest", {
          pagetitle:"Resident certifier - Starta test", 
          title1:testinfo.groupname,
          title2:testinfo.name,
          title3:testinfo.description,
          test:testinfo,
          startedid:response.id,
          isstudent:isstudent,
          ok:!response.mess,
          nomore:(response.mess == "nomore"),
          err:(response.mess != null && response.mess != "nomore"),
          errmess:response.mess
        });
      }
    },
    function(err) {
      console.log("555");
      res.render("starttest", {
        pagetitle:"Resident certifier - Starta test", 
        pageerror: err
      });
    }
  );
};

function hmFromMin(min) {
  var h = Math.floor(min/60);  
  var m = min - h*60;
  return {h:h, m:m};
}


function getStartedTest(user, test, isstudent) {
  var d = Q.defer();
  db.runQuery("select * from startedtests where userid=? and testid=? order by starttime desc", [user.id, test.id]).then(
    function(rows) {
      if (rows.length == 0 || (rows.length < test.noftries || !isstudent) && rows[0].finishtime) {
        d.resolve({mess:null, id:0});
      }
      else if (!rows[0].finishtime) {
        d.resolve({mess:null, id:rows[0].id});
      }
      else {
        d.resolve({mess:"nomore", id:0});
      }
    },
    function(err){
      d.reject(err);
    }
  );
  return d.promise;
}

