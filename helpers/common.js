/*** Common functions ***/

var db = require("../helpers/db.js"); 
var Cookies = require("cookies");
var Q = require("q");
var nodemailer = require('nodemailer');
//var smtpTransport = require('nodemailer-smtp-transport');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'magnus.ehlde@gmail.com',
    pass: 'JW.Lennon61'
  }
});

/*var transporter = nodemailer.createTransport(smtpTransport({
  host: 'mail.patientbesked.se',
  port: 2525,
  auth: {
    user: 'info@patientbesked.se',
    pass: 'Lennon',
    debug:true
  }
}));
*/
/*var transporter = nodemailer.createTransport({
  host: 'smtp.googlemail.com',
  port: 465,
  auth: {
    user: 'magnus.ehlde@gmail.com',
    pass: 'JW.Lennon61'
  }
});
*/

exports.sendMail = function(from, to, subject, text, html) {
  return;
  transporter.sendMail({
    from: from,
    to: to,
    subject: subject,
    text: text,
    html: html,
    callback: function(err, info){
      if (err)
        console.log("Mejlskickning, fel: " + err2);
    }
  });
}

exports.hasGroupPermission = function(user, groupid, role) {
  if (!user) return false;
  for (var i=0; i < user.groups.length; i++)
    if (user.groups[i].id == groupid && user.groups[i].roleorder >= user.roles[role])
      return true;
  return false;
}

exports.getGroupPermissionOrder = function(user, groupid) {
  if (!user) return 0;
  var order = 0;
  for (var i=0; i < user.groups.length && !order; i++)
    if (user.groups[i].id == groupid)
      order = user.groups[i].roleorder;
  return order;
}

exports.hasTestPermission = function(user, testid, role) {
  var d = Q.defer();
  var thismod = this;
  db.runQuery("select groupid from tests where id=?", [testid]).then(
    function(rows) {
      d.resolve(rows.length > 0 && thismod.hasGroupPermission(user, rows[0].groupid, role));
    },
    function(err){
      d.reject(err);
    }
  );
  return d.promise;
}

exports.createUser = function(guid, uid) {
  if (!guid) guid = '';
  if (!uid) uid = 0;
  var d = Q.defer();
  var thismod = this;
  var user = 0;
  var sql = 
    "select u.*, p.groupid, r.relevanceorder " +
    "from users u " +
    "inner join permissions p on " +
    "p.userid = u.id " +
    "inner join roles r on " +
    "r.id = p.roleid " +
    "where u.guid=? or u.id=?";
  db.runQuery(sql, [guid, uid]).then(
    function(rows) {
      if (rows.length == 0) {
        d.reject("User not found"); 
      }
      else {
        user = rows;
        return db.runQuery("select name from users where id=?", [user[0].addedby]);
      }
    }
  ).then(
    function(rows) {
      if (rows.length > 0)
        user[0].supervisor = rows[0].name;
      return db.runQuery("select id, relevanceorder from roles", []);
    }
  ).then(
    function(rows) {
      var roles = {};
      for (var i=0; i < rows.length; i++)
        roles[rows[i].id] = rows[i].relevanceorder;

      var newuser = {
        id: user[0].id,
        guid: user[0].guid,
        email: user[0].email,
        name: user[0].name,
        supervisor:user[0].supervisor,
        roles: roles,
        groups: []
      };
      var isadmin = false;
      for (var i=0; i < user.length; i++) {
        isadmin = isadmin || user[i].relevanceorder >= 40;
        newuser.groups.push({
          id: user[i].groupid,
          roleorder: user[i].relevanceorder
        });
        isadmin = isadmin || thismod.hasGroupPermission(newuser, user[i].groupid, "testadmin");
      }
      newuser.isadmin = isadmin;
      
      d.resolve(newuser);
    },
    function(err){
      d.reject(err);
    }
  );
  return d.promise;
}

exports.setGuidCookie = function(req, res, guid){
  var cookies = new Cookies(req, res);
  var cookietimeout = 4*3600*1000
  req.session.cookie.maxAge = cookietimeout;
  cookies.set("guid", guid, {expires:new Date(new Date().getTime() + cookietimeout)});
}; 

exports.getTestInfoForUser = function(testid, userid) {
  var d = Q.defer();
  var obj = this;
  var test;
  var sql = 
    "select t.*, tg.name as groupname, tg.description as tgdescription, " +
    "(select count(*) from startedtests s where s.userid=? and s.testid=t.id) as noffinished " +
    "from tests t " +
    "inner join testgroups tg on " +
    "tg.id = t.groupid " + 
    "where t.id=?"; 
  db.runQuery(sql, [userid, testid]).then(
    function(trows) {
      test = trows[0];
      var qsql = 
        "select q.id, q.text, q.type, q.randomalternatives " + 
        "from questions q " +
        "left outer join usedquestions u on " +
        "u.questionid = q.id and u.userid=? " +
        "where q.testid=? " +
        "order by u.counter, q.orderno";
      return db.runQuery(qsql, [userid, testid]);
    }
  ).then(
    function(qrows) {
      if (qrows.length == 0) {
        test.questions = [];
        d.resolve(test);
        return;
      }
      var questions = qrows;
      var promises = [];
      for (var i=0; i < questions.length; i++) {
        questions[i].idx = i;
        promises.push(obj.getAlternatives(questions[i]));
      }
      Q.all(promises).then(
        function(){
          test.questions = questions;
          d.resolve(test);
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

exports.getTestInfo = function(testid) {
  return this.getTestInfoForUser(testid, 0);
}; 
 
exports.getAlternatives = function(question) {
  var d = Q.defer();
  db.runQuery("select * from alternatives where questionid=? order by orderno", [question.id]).then(
    function(arows) {
      for (var i=0; i < arows.length; i++)
        arows[i].idx = i;
      question.alternatives = arows;
      d.resolve();
    },
    function(err){
      d.reject(err);
    }
  );
  return d.promise;
};

exports.formatDate = function(adate) {
  var yyyy = adate.getFullYear().toString();
  var mm = (adate.getMonth()+1).toString();
  var dd  = adate.getDate().toString();
  return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
}

