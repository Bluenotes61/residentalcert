var db = require("../helpers/db.js");
var common = require("../helpers/common.js");
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
/*** Render page ***/
exports.index = function(req, res) {
  if (res.user) res.redirect("/selectgroup");
  else res.render("index", {
    pagetitle:"Resident certifier", 
    title1:"Resident certifier", 
    error:false
  });
};

exports.login = function(req, res) {
  var sql = "select * from users where email=? AND password=?";
  db.runQuery(sql, [req.body.email, req.body.password]).then(
    function(rows) {
      if (rows.length == 0) {
        res.render("index", {title:"Resident certifier", error:true});
      }
      else {
        return common.createUser(rows[0].guid);
      }
    }
  ).then(
    function(user){
      common.setGuidCookie(req, res, user.guid);
      req.session.user = user;
      res.redirect("/selectgroup");
    },
    function(err){
      res.render("index", {title:"Resident certifier", error:true});
    }
  );
};

exports.logout = function(req, res) {
  common.setGuidCookie(req, res, null);
  req.session.user = null;
  res.render("index", {title:"Resident certifier"});
};

exports.sendPassword = function(req, res) {
  var sql = "select password from users where email=?";
  db.runQuery(sql, [req.body.email]).then(
    function(rows) {
      if (rows.length == 0)
        res.json("Ingen användare med adressen " + req.body.email + " hittades.");
      else {
        common.sendMail(
          'Resident certifier<info@patientbesked.se>',
          req.body.email,
          'Resident certifier login',
          "Inloggningsuppgifter till Resitential certifier\n\nE-postadress: " + req.body.email + "\nLösenord: " + rows[0].password,
          "<b>Inloggningsuppgifter till Resitential certifier</b><br /><b>E-postadress:</b> " + req.body.email + "<br /><b>Lösenord:</b> " + rows[0].password
        );
        res.json("Ett e-postmeddelande med inloggningsuppgifter har skickats till " + req.body.email);
      }
    },
    function(err){
      res.end(err);
    }
  );

};