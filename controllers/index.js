var express = require('Express');
var router = express.Router();

var startpage = require("../routes/startpage.js"); 
var selgrouppage = require("../routes/selgrouppage.js");
var admingrouppage = require("../routes/admingrouppage.js");
var seltestpage = require("../routes/seltestpage.js");
var starttestpage = require("../routes/starttestpage.js");
var testpage = require("../routes/testpage.js");
var finalpage = require("../routes/finalpage.js");
var admintestpage = require("../routes/admintestpage.js");
var resultpage = require("../routes/resultpage.js");  

router.get("/", startpage.index);    
router.post("/", startpage.login);
router.get("/logout", startpage.logout);
router.post("/sendpassword", startpage.sendPassword);

router.get("/selectgroup", selgrouppage.index);
router.post("/savenewgroup", selgrouppage.newGroup);
router.post("/deletegroup", selgrouppage.deleteGroup);

router.get("/admingroup", admingrouppage.index);
router.post("/saveeditgroup", admingrouppage.saveEditGroup);
router.post("/saveedituser", admingrouppage.saveEditUser);
router.post("/adduser", admingrouppage.addUser);
router.post("/deleteuser", admingrouppage.deleteUser);

router.get("/selecttest", seltestpage.index);
router.post("/savenewtest", seltestpage.newTest);
router.post("/deletetest", seltestpage.deleteTest);
router.post("/getuserresults", seltestpage.getUserResults);

router.get("/admintest", admintestpage.index);
router.post("/saveedittest", admintestpage.saveEditTest);
router.post("/savequestion", admintestpage.saveQuestion);
router.post("/getnewquestion", admintestpage.getNewQuestion);
router.post("/deletequestion", admintestpage.deleteQuestion);
router.post("/movequestion", admintestpage.moveQuestion);
router.post("/getnewalternative", admintestpage.getNewAlternative);
router.post("/deletealternative", admintestpage.deleteAlternative);
router.post("/movealternative", admintestpage.moveAlternative);
router.post("/savealternative", admintestpage.saveAlternative);
router.post("/setquestiontype", admintestpage.setQuestionType);
router.post("/setrandomalt", admintestpage.setRandomAlt);
router.post("/setcorrectalternative", admintestpage.setCorrectAlternative);
router.post("/upload", admintestpage.uploadFile);

router.get("/starttest", starttestpage.index);

router.get("/test", testpage.index);
router.post("/saveanswer", testpage.saveAnswer);

router.post("/finalize", finalpage.index); 

router.get("/resultat", resultpage.index);

module.exports = router;