var ajax = {

  post: function(url, param, handleError) {
    return this.exec("post", url, param, handleError);
  },

  get: function(url, param, handleError) {
    return this.exec("get", url, param, handleError);
  },

  exec: function(type, url, params, handleError){
    var d = Q.defer();
    var obj = this;
    var settings = {
      type: type,
      data:params,
      dataType:"json",
      error: function(jqXHR, status) {
        var loggedout = jqXHR.responseText == "loggedout";
        var mess = (loggedout ? "Du har blivit utloggad." : "Ett fel har uppstått:<br />" + jqXHR.responseText);
        if (!handleError || loggedout) {
          $("#ajaxerror").html(mess);
          $("#bgdim, #ajaxerror").show();
          setTimeout(function(){
            $("#bgdim, #ajaxerror").hide();
          }, 3000);
        }
        if (loggedout) {
          setTimeout(function(){
            window.location.href = "/";
          }, 3000);
        }
        d.reject(jqXHR.responseText);
      },
      success: function(response, status){
        d.resolve(response);
      }
    };
    $.ajax(url, settings);
    return d.promise;
  }

};