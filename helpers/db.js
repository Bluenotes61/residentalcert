/*** Database functionality ***/

var Q = require('q');
var mysql = require('mysql');
var config = require("../config.js")

module.exports.pool = mysql.createPool(config.database);

module.exports.runQuery = function(sql, parameters) {
  var d = Q.defer();
  var obj = this;
  obj.pool.getConnection(function(err, connection) {
    if (err) {
      obj.logError("Connection error", err);
      d.reject("Connection error: " + err);
      return;
    }
    var query = connection.query(sql, parameters, function(sqlerr, response) {
      if (sqlerr) {
        obj.logError("Sql error", sqlerr.message + " - " + query.sql);
        d.reject("Sql error: " + sqlerr.message);
      }
      else {
        d.resolve(response);
      }
      connection.release();
    });
  });
  return d.promise;
}

module.exports.logError = function(subject, errmess) {
  console.log(subject, errmess);
  this.pool.getConnection(function(err, connection) {
    if (err) return;
    connection.query("insert into debug (debugdate, subject, message) values(NOW(), ?, ?)", [subject, errmess], function(err2, response) {
      if (err2) console.log(err2);
      connection.release();
    });
  });
}

