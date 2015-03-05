function initTabNavigation() {
  $(".tabs .tab").click(function(){
    var selid = $(".tabs .selected").data("frame");
    var newid = $(this).data("frame");
    $(".tabs .tab").removeClass("selected");
    $(this).addClass("selected");
    $("#" + selid).fadeOut(500);
    $("#" + newid).css("position", "absolute").fadeIn(500, function(){
      $("#" + newid).css("position", "relative");
    });
  });
}

function initBrowseNavigation() {
  $(".browse a").click(function(){
    var selidx = $(".browse a.selected").data("idx");
    var newidx = $(this).data("idx");

    $(".browse a").removeClass("selected");
    $(this).addClass("selected");

    $(".browseitem.item" + selidx).fadeOut(500);
    $(".browseitem.item" + newidx).css("position", "absolute").fadeIn(500, function(){
      $(".browseitem.item" + newidx).css("position", "relative");
    });
  });
}
