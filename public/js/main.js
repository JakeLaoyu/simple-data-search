if ($('body').hasClass('student-list')) {
  $('#side-menu').find('.student-list').addClass('active')
}

if ($('body').hasClass('qrcode')) {
  $('#side-menu').find('.qrcode').addClass('active')
}

function parseQueryString(url) {
  var obj = {},
    keyvalue = [],
    key = "",
    value = "";
  var paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
  for (var i in paraString) {
    keyvalue = paraString[i].split("=");
    key = keyvalue[0];
    value = keyvalue[1];
    obj[key] = value;
  }
  return obj;
}