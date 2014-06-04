define("unit-m-weixin@1.12.6/js/pages/test", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');
/*
 * 专门用来测试的
*
* */
exports.Controller = Marionette.Controller.extend({
    show:function(){
        ThisApp.openPage().then(function(page){
            var accountUrl = encodeURIComponent('http://m.51ping.com/loginbridge/app?cross=1&token=620625bfa96b98ff8ff0ea158fe9a9b643b4f6e9d0b87333649d23239d2558fa');
            var url = 'dianping://loginweb?url='+accountUrl+'&goto=dianping://home';
            page.initRegion({
                template:_.template('<a style ="font-size:30px;" href="wechat://home">打开点评app</a>')
            });
        });
    }
});


}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});