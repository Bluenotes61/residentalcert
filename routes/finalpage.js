var db = require("../helpers/db.js");
var common = require("../helpers/common.js");

/*** Render page ***/
exports.index = function(req, res) {  
  var testid = req.body.testid;
  var startedid = req.body.startedid;
  var now = new Date();
  db.runQuery("update startedtests set finishtime=? where id=?", [now, startedid]).then(
    function(response){
      return common.getTestInfo(testid);
    }
  ).then(
    function(testinfo){
      res.render("final", {
        pagetitle:"Resident certifier - Testet avslutat", 
        title1:testinfo.groupname,
        title2:testinfo.name,
        title3:testinfo.description,
        testid: testid
      });
    },
    function(err){
      res.render("final", {
        pagetitle:"Resident certifier - Testet avslutat", 
        pageerror:err
      });
    }
  );
};
