var db = require("../helpers/db.js"); 
var common = require("../helpers/common.js"); 
var Q = require("q"); 


/*** Render page ***/
exports.index = function(req, res) {   
  var groupid = (req.query.id ? req.query.id : 0);
  if (common.hasGroupPermission(res.user, groupid, 'supervisor')) {
    db.runQuery("select * from testgroups where id=?", [groupid]).then(
      function(groupinfo) {
        return getUsers(res.user, groupid).then(
          function(response){
            res.render("admingroup", {
              pagetitle: "Resident certifier - Redigera test", 
              title1: groupinfo[0].name,
              title2:groupinfo[0].description,
              groupinfo: groupinfo[0],
              allowedit: common.hasGroupPermission(res.user, groupid, 'testadmin'),
              notallowedit: !common.hasGroupPermission(res.user, groupid, 'testadmin'),
              users: response.html,
              roles: JSON.stringify(response.roles, null, 2)
            });
          },
          function(err){
            res.render("admingroup", {
              pagetitle: "Resident certifier - Redigera test", 
              pageerror: err
            });
          }
        );
      },
      function(err){
        res.render("admingroup", {
          pagetitle: "Resident certifier - Redigera test", 
          pageerror: err
        });
      }
    );
  }
  else {
    res.redirect("/");
    return;
  }
};

function getUsers(user, groupid) {
  var d = Q.defer();
  var myrelevanceorder = common.getGroupPermissionOrder(user, groupid);
  getAvailableRoles(user, groupid).then(
    function(roles){
      var sql = 
        "select u.*, r.id as roleid, r.name as rolename, r.relevanceorder " +
        "from users u " +
        "inner join permissions p on " +
        "p.userid = u.id " +
        "inner join roles r on " +
        "p.roleid = r.id " +
        "where p.groupid=? and r.relevanceorder <= ? " + 
        "order by u.name";
      return db.runQuery(sql, [groupid, myrelevanceorder]).then(
        function(users) {
          var options = "";
          for (var i=0; i < roles.length; i++) 
            options += "<option value='" + roles[i].id + "'>" + roles[i].name + "</option>";

          var html = "";
          for (var i=0; i < users.length; i++) {
            html += getUserRowHtml(groupid, user, users[i], options);
          }
          d.resolve({roles:roles, html:html});
        },
        function(err){
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

function getAvailableRoles(user, groupid){
  var d = Q.defer();
  var mypermissionorder = common.getGroupPermissionOrder(user, groupid);
  db.runQuery("select * from roles where relevanceorder <= ? order by relevanceorder", [mypermissionorder]).then(
    function(roles) {
      d.resolve(roles);
    },
    function(err){
      d.reject(err);
    }
  );
  return d.promise;
}

function getUserRowHtml(groupid, curruser, user, options) {
  var html = 
    "<div class='row clearfix' data-uid='" + user.id + "'>" +
    "<div class='col col1' title='" + user.email + "'>" + user.email + "</div>" +
    "<div class='col col2'><span class='stat'>" + user.name + "</span><input type='text' class='edit uname' /></div>" + 
    "<div class='col col3'><span class='stat' data-roleid='" + user.roleid + "'>" + user.rolename + "</span><select class='edit role'>" + options + "</select></div>" +
    "<div class='col col4 btns'>" +
    "<a title='Redigera användarens egenskaper' class='editbtn stat icon'><img alt='Redigera' src='/gfx/pen.png'></a>";
  if (user.id != curruser.id)
    html += "<a title='Ta bort användaren' class='delbtn stat icon'><img alt='Ta bort' src='/gfx/x.png'></a>";
  html += 
    "<a title='Spara ändringar' class='savebtn edit icon'><img alt='Spara' src='/gfx/cd.png'></a>" +
    "<a title='Avbrytredigering' class='cancelbtn edit icon'><img alt='Avbryt' src='/gfx/cancel.png'></a>" +
    "</div></div>";
  return html;
}

exports.saveEditGroup = function(req, res) {
  var data = req.body.groupdata;
  var sql = 
    "update testgroups set " +
    "name=?, description=? " +
    "where id=?"; 
  db.runQuery(sql, [data.name, data.description, parseInt(data.id)]).then(
    function(result) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}


exports.saveEditUser = function(req, res) {
  var data = req.body.userdata;
  db.runQuery("update users set name=? where id=?", [data.name, data.uid]).then(
    function(){
      return db.runQuery("update permissions set roleid=? where userid=? and groupid=?", [data.roleid, data.uid, data.groupid]);
    }
  ).then(
    function(result) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.addUser = function(req, res) {
  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  };

  function getPassword() {
    function ch() {
      var ascii = 0;
      while (ascii < 65 || (ascii > 90 && ascii < 97))
        ascii = Math.floor(Math.random()*122) + 1;
      return ascii;
    }
    return String.fromCharCode(ch(), ch(), ch(), ch(), ch(), ch());
  }

  function sendPassword(email, password) {
    common.sendMail(
      'Resident certifier<info@patientbesked.se>',
      email,
      'Resident certifier login',
      "Ett konto har skapats till dig på Resident certifier.\n\nGå till <a href='http://residentcertifier.se'>residentcertifier.se</a> och logga in med\nE-postadress: " + email + "\nLösenord: " + password,
      "<b>Ett konto har skapats till dig på Resident certifier.</b><br /><br />Gå till <a href='http://residentcertifier.se'>residentcertifier.se</a> och logga in med<br/>E-postadress: " + email + "<br />Lösenord: " + password
    );
  };

  function getHtml(user, newuser, groupid) {
    var d = Q.defer();
    getAvailableRoles(user, groupid).then(
      function(roles){
        var options = "";
        for (var i=0; i < roles.length; i++) 
          options += "<option value='" + roles[i].id + "'>" + roles[i].name + "</option>";

        var html = getUserRowHtml(groupid, user, newuser, options);
        d.resolve(html);
      },
      function(err) {
        d.reject(err);
      }
    );
    return d.promise;
  }

  var newuser = {
    id:0,
    email:req.body.email,
    name:req.body.name,
    roleid:req.body.roleid,
    rolename:req.body.rolename
  };

  db.runQuery("select id from users where email=?", [req.body.email]).then(
    function(result) {
      if (result.length == 0) {
        var pw = getPassword();
        db.runQuery("insert into users (guid, email, password, name, addedby) values(?, ?, ?, ?, ?)", [guid(), newuser.email, pw, newuser.name, res.user.id]).then(
          function(resuser) {
            newuser.id = resuser.insertId;
            return db.runQuery("insert into permissions (userid, roleid, groupid) values(?, ?, ?)", [newuser.id, newuser.roleid, req.body.groupid]);
          }
        ).then(
          function(response){
            return getHtml(res.user, newuser, req.body.groupid);
          }
        ).then(
          function(html){
            sendPassword(newuser.email, pw);
            res.json({err:null, rowhtml:html});
          },
          function(err){
            res.end(err);
          }
        );
      }
      else {
        newuser.id = result[0].id;
        db.runQuery("insert into permissions (userid, roleid, groupid) values(?, ?, ?)", [newuser.id, newuser.roleid, req.body.groupid]).then(
          function(response){
            return getHtml(res.user, newuser, req.body.groupid);
          }
        ).then(
          function(html){
            res.json({err:null, rowhtml:html});
          },
          function(err){
            res.json({err:"Existing", rowhtml:null});
          }
        );
      }
    },
    function(err){
      res.end(err);
    }
  );
}
  
exports.deleteUser = function(req, res) {
  db.runQuery("delete from permissions where userid=? and groupid=?", [req.body.uid, req.body.groupid]).then(
    function(result) {
      return db.runQuery("select count(*) as nof from permissions where userid=?", [req.body.uid]);
    }
  ).then(
    function(result) {
      if (result[0].nof == 0) 
        return db.runQuery("delete from users where id=?", [req.body.uid]);
      else
        return null;
    }
  ).then(
    function () {
      return res.json({});
    }, 
    function(err){
      res.end(err);
    }
  );
}

