window.onload = function(){
	document.getElementById("upload_image").onchange = function(){
		document.getElementById("upload_image").style.display = "none";
		document.getElementById("progress").style.display = "block";
		document.getElementById("upload_form").submit();
	};
}

function uploadDone() {
  var ed = window.parent.tinyMCE.activeEditor;
  var filename = document.getElementById("upload_target").contentWindow.document.body.innerHTML;
  if (filename.length > 0 && filename.indexOf("ERROR") < 0) {
    var html = "<img src='/uploads/" + filename + "' />";
    ed.execCommand('mceInsertContent', false, html);
    ed.windowManager.close(window);
  }
}