module.exports = function() {

  var Cookies = require("cookies");
  var common = require("../helpers/common.js"); 
  var db = require("../helpers/db.js"); 
  var Q = require("q");
    
  return function(req, res, next) { 
    getCurrentUser(req, res).then(
      function(user){
        if (!user && req.url.length > 1 && req.url != "/sendpassword") {
          if (req.headers["x-requested-with"]) {
            res.end("loggedout");
          }
          else {
            res.redirect("/");
          }
          return;
        }
        res.user = user;
        res.locals.user = user;
        next();
      },
      function(err) {
        res.render("index", {
          pagetitle:"Resident certifier", 
          pageerror:err
        });
      }
    );
  }
    
  function getCurrentUser(req, res) {
    var d = Q.defer();
    var user = req.session.user;
    if (user) {
      d.resolve(user);
    }
    else {
      var guid = getGuidCookie(req, res);
      if (guid) {
        return common.createUser(guid).then(
          function(newuser){
            common.setGuidCookie(req, res, newuser.guid);
            req.session.user = newuser;
            d.resolve(newuser);
          },
          function() {
            d.reject(null);
          }
        );
      }
      else 
        d.resolve(null);
    }
    return d.promise;
  };

  function getGuidCookie(req, res) {
    var cookies = new Cookies(req, res);
    return cookies.get("guid");
  }

};
