$(document).ready(function(){

  function init() {
    $("#forgot a.openforgot").click(function(){
      $("#forgot .forgotform").slideToggle(); 
    });

    $("#forgot .forgotform a").click(function(){
      ajax.post("/sendpassword", {email:$("#forgot .forgotform .emailforgot").val()}).then(function(response) {
        $("#forgot .forgotform .sendresponse").html(response);
        setTimeout(function(){
          $("#forgot .forgotform").slideUp(); 
        }, 5000);
      });
    });
  }

  init();

});
