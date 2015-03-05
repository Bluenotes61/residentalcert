var db = require("../helpers/db.js"); 
var common = require("../helpers/common.js");
var Q = require("q"); 
 

/*** Render page ***/
exports.index = function(req, res) {
  var newicon = (res.user.isadmin ? "<a class='newgroup icon right' title='Skapa en nytt test'><img src='/gfx/plus_white.png' alt='Nytt test' /></a>" : "");
  getAvailableGroups(res.user).then(
    function(groups){
      var html = "";
      for (var i=0; i < groups.length; i++) {
        html += "<div class='row clearfix'>" +
          "<div class='col col1'>" + groups[i].name + "</div>" +
          "<div class='col col2'>" + groups[i].description + "</div>" + 
          "<div class='col col3 btns'>" + groups[i].icons + "</div></div>";
      } 
      res.render("selgroup", {
        pagetitle:"Resident certifier - Välj test", 
        title1:"Resident certifier",
        groups:html, 
        newicon:newicon
      });
    },
    function(err){
      res.render("selgroup", {
        pagetitle:"Resident certifier - Välj test", 
        title1:"Resident certifier",
        pageerror: err
      });
    }
  );
}; 


/*** Get the available testgroups and tests for the current user together with icons, based on permissions, for each testgroup. ***/
function getAvailableGroups(user) { 
  var d = Q.defer();
  db.runQuery("select * from testgroups", []).then(
    function(groups) {
      var resgroups = [];
      for (var i=0; i < groups.length; i++) {
        if (common.hasGroupPermission(user, groups[i].id, "student")) {
          groups[i].icons = "";
          if (common.hasGroupPermission(user, groups[i].id, "testadmin")) 
            groups[i].icons += "<a href='/admingroup?id=" + groups[i].id + "' class='icon' title='Administrera testets egenskaper och användare'><img src='/gfx/pen.png' alt='Redigera' /></a>";
          else if (common.hasGroupPermission(user, groups[i].id, "supervisor")) 
            groups[i].icons += "<a href='/admingroup?id=" + groups[i].id + "' class='icon' title='Testets användare'><img src='/gfx/info.png' alt='Användare' /></a>";
          if (common.hasGroupPermission(user, groups[i].id, "testadmin")) 
            groups[i].icons += "<a class='delete icon' title='Ta bort testet' data-id='" + groups[i].id + "'><img src='/gfx/x.png' alt='Ta bort' /></a>";
          groups[i].icons += "<a href='/selecttest?id=" + groups[i].id + "' class='icon' title='Visa testets deltest'><img src='/gfx/start.png' alt='Deltest' /></a>";
          resgroups.push(groups[i]);
        }
      }
      d.resolve(resgroups);
    },
    function(err){
      d.reject(err);
    }
  );
  return d.promise;
}

exports.newGroup = function(req, res) {
  var groupid = 0;
  var sql = "insert into testgroups (name, description) values(?, ?)";
  db.runQuery(sql, [req.body.name, req.body.description]).then(
    function(response){
      groupid = response.insertId;
      sql = "insert into permissions (userid, roleid, groupid) values(?, ?, ?)";
      return db.runQuery(sql, [res.user.id, 'testadmin', groupid]);
    }
  ).then(
    function(response) {
      req.session.user.groups.push({
        id:groupid,
        roleorder:res.user.roles.testadmin
      });
      res.json(groupid);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.deleteGroup = function(req, res) {
  var sql = "delete from testgroups where id=?";
  db.runQuery(sql, [req.body.id]).then(
    function(response) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}
