define("unit-m-weixin@1.12.6/js/modules/alertinfo/layout.html", [], function(require, exports, module) {
module.exports = '<%if(/51ping/.test(location.href)){%><img src="http://si1.s1.51ping.com/m/css/app/weixin/img/alert-icon.png" style="width:100%;height:auto;display:block;"/><%}else{%><img src="http://m1.s1.dpfile.com/m/css/app/weixin/img/alert-icon.png" style="width:100%;height:auto;display:block;"/><%}%>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/pages/alertinfo", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/alertinfo/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var AlertInfoController = Marionette.Controller.extend({
    show:function(){
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/alertinfo/layout.html"))
            });
        });
    }
});

exports.Controller = AlertInfoController;


}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});