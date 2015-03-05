var db = require("../helpers/db.js"); 
var common = require("../helpers/common.js"); 
var fs = require("fs");
var images = require("images");


/*** Render page ***/
exports.index = function(req, res) {   
  var testid = (req.query.id ? req.query.id : 0);
  var editpermission = false;
  common.hasTestPermission(res.user, testid, 'supervisor').then(
    function(ok) {
      if (ok) return common.hasTestPermission(res.user, testid, 'questionadmin');
      else res.redirect("/");
    }
  ).then(
    function(perm) {
      editpermission = perm;
      return common.getTestInfo(testid);
    }
  ).then(
    function(testinfo) {
      res.render("admintest", {
        pagetitle: "Resident certifier - Redigera deltest", 
        title1: testinfo.groupname,
        title2: testinfo.name,
        title3: testinfo.description,
        editpermission:editpermission,
        noteditpermission:!editpermission,
        testinfo: testinfo,
        questions: JSON.stringify(testinfo.questions, null, 2)
      });
    },
    function(err){
      res.render("admintest", {
        pagetitle: "Resident certifier - Redigera deltest", 
        pageerror: err
      });
    }
  );
};

 
exports.saveEditTest = function(req, res) {
  var data = req.body.testdata;
  var sql = 
    "update tests set " +
    "name=?, description=?, testtime=?, randomquestions=?, nofquestions=?, noftries=? " +
    "where id=?"; 
  db.runQuery(sql, [data.name, data.description, parseInt(data.testtime), parseInt(data.randomquestions), parseInt(data.nofquestions), parseInt(data.noftries), parseInt(data.id)]).then(
    function(result) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}


/***
  Question functions
***/

exports.saveQuestion = function(req, res) {
  var sql = "update questions set text=? where id=?";
  db.runQuery(sql, [req.body.content, req.body.id]).then(
    function(result) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
};


exports.deleteQuestion = function(req, res) {
  var sql = "delete from alternatives where questionid=?;delete from questions where id=?";
  db.runQuery("delete from alternatives where questionid=?", [req.body.qid]).then(
    function(){
      return db.runQuery("delete from questions where id=?", [req.body.qid]);
    }
  ).then(
    function() {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.moveQuestion = function(req, res) {
  var sql = "select orderno from questions where id=?";
  var order1, order2;
  db.runQuery(sql, [req.body.q1id]).then(
    function(result) {
      order1 = result[0].orderno;
      return db.runQuery(sql, [req.body.q2id]);
    }
  ).then(
    function(result) {
      order2 = result[0].orderno;
      return db.runQuery("update questions set orderno=? where id=?", [order1, req.body.q2id]);
    }
  ).then(
    function() {
      return db.runQuery("update questions set orderno=? where id=?", [order2, req.body.q1id]);
    }
  ).then(
    function() {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.getNewQuestion = function(req, res) {
  var orderno;
  db.runQuery("select max(orderno) as maxorder from questions", []).then(
    function(rows) {
      orderno = rows[0].maxorder + 1;
      var sql = "insert into questions (testid, text, orderno, type, randomalternatives) values(?, '', ?, 'single', 1)";
      return db.runQuery(sql, [req.body.testid, orderno]);
    }
  ).then(
    function(response) {
      res.json({
        "id":response.insertId,
        "testid": req.body.testid,
        "text":"",
        "orderno":orderno,
        "type":"single",
        "randomalternatives":1,
        "alternatives":[]
      });
    },
    function(err){
      res.end(err);
    }
  );
}

exports.setQuestionType = function(req, res) {
  var sql = "update questions set type=? where id=?";
  db.runQuery(sql, [req.body.type, req.body.qid]).then(
    function(result) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.setRandomAlt = function(req, res) {
  var sql = "update questions set randomalternatives=? where id=?";
  db.runQuery(sql, [req.body.randomalt, req.body.qid]).then(
    function(result) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}

/***
  Alternatives functions
***/

exports.getNewAlternative = function(req, res) {
  var qid = req.body.qid;
  var orderno;
  db.runQuery("select max(orderno) as maxorder from alternatives where questionid=?", [qid]).then(
    function(rows) {
      orderno = rows[0].maxorder + 1;
      return db.runQuery("insert into alternatives (questionid, text, correctanswer, orderno) values(?, '', 0, ?)", [qid, orderno]);
    }
  ).then(
    function(response) {
      var aid = response.insertId;
      res.json({
        "id":aid,
        "questionid":qid,
        "text" : '',
        "correctanswer":0,
        "orderno":orderno
      });
    },
    function(err){
      res.end(err);
    }
  );
}

exports.deleteAlternative = function(req, res) {
  var sql = "delete from alternatives where id=?";
  db.runQuery(sql, [req.body.aid]).then(
    function(result) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.moveAlternative = function(req, res) {
  var sql = "select orderno from alternatives where id=?";
  var order1, order2;
  db.runQuery(sql, [req.body.a1id]).then(
    function(result) {
      order1 = result[0].orderno;
      return db.runQuery(sql, [req.body.a2id]);
    }
  ).then(
    function(result) {
      var order2 = result[0].orderno;
      return db.runQuery("update alternatives set orderno=? where id=?", [order1, req.body.a2id]);
    }
  ).then(
    function() {
      sql = "update alternatives set orderno=? where id=?;update alternatives set orderno=? where id=?";
      return db.runQuery("update alternatives set orderno=? where id=?", [order2, req.body.a1id]);
    }
  ).then(
    function() {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.setCorrectAlternative = function(req, res) {
  var sql = "update alternatives set correctanswer=? where id=?";
  db.runQuery(sql, [req.body.correct, req.body.aid]).then(
    function(result) {
      res.json(null);
    },
    function(err){
      res.end(err);
    }
  );
}

exports.saveAlternative = function(req, res) {
  var sql = "update alternatives set text=? where id=?";
  db.runQuery(sql, [req.body.content, req.body.aid]).then(
    function(result) {
      res.json(null);
    },
    function(err){
      console.log(err);
      res.end(err);
    }
  );
}

var guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  };
})();

exports.uploadFile = function(req, res) { 
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    var fsplit = filename.split('.');
    if (fsplit.length > 1 && (fsplit[1].toLowerCase() == "jpg" || fsplit[1].toLowerCase() == "jpeg" || fsplit[1].toLowerCase() == "gif" || fsplit[1].toLowerCase() == "png")) {
      var newfname = guid() + "." + fsplit[1].toLowerCase();
      fstream = fs.createWriteStream(__dirname + '/../public/uploads/' + newfname);
      file.pipe(fstream);
      fstream.on('close', function () {    
        var img = images(__dirname + '/../public/uploads/' + newfname);
        if (img.width() > 1000)
          img.size(1000).save(__dirname + '/../public/uploads/' + newfname);
        res.send(newfname);
      });
    }
    else {
      res.send("ERROR");
    }
  });
}
