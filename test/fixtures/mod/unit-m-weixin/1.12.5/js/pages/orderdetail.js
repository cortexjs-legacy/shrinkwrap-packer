define("unit-m-weixin@1.12.5/js/entities/orderdetail", ["backbone@~1.1.0"], function(require, exports, module) {
var Backbone = require('backbone');
var OrderDetail = Backbone.Model.extend({
    parse:function(res){
        if(res.data.time){
            res.data.time = this._parseTime(res.data.time);
        }
        res.data.refund = res.data.relativeDeal ? res.data.relativeDeal.refund : false;

        var extra = res.data.extra || [];
        if(extra.length){
            extra = extra.map(function(item){
                return item.id;
            });
        }
        res.data.lotteryNumbers = extra.join(',');
        return res.data;
    },
    url:function(){
        return '/ajax/tuan/ordergn.json?orderid='+this.get('orderid');
    },
    _parseTime:function(time){
        var t = new Date(time);
        return t.getFullYear()+"-"+this._fix(t.getMonth()+1)+"-"+t.getDate()+" "+this._fix(t.getHours())+":"+this._fix(t.getMinutes());
    },
    _fix:function(n){
        var s = '0' + n;
        return s.substr(s.length-2);
    }
});

module.exports = OrderDetail;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/orderdetail/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_ordercontent"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/orderdetail/orderinfo/controller", ["marionette@~1.4.0", "./view", "../../../entities/orderdetail", "wepp@~2.7.0", "./template.html"], function(require, exports, module) {
var Marionette = require('marionette');
var View = require('./view');
var Model = require('../../../entities/orderdetail');
var Wepp = require('wepp');
var City = Wepp.Module.City;

var Controller = Wepp.Module.BaseController.extend({
    initModel:function(orderId){
        return  new Model({
            cityid:City.getId,
            orderid:orderId
        });
    },
    initTpl:function(){
        return require('./template.html');
    }
});

module.exports = Controller;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/orderdetail/orderinfo/template.html", [], function(require, exports, module) {
module.exports = '<div class="c-box-tit">订单信息</div><div class="c-box"><a class="item" href="#detail~<%=relativeDeal.id%>">团购项目<span class="Right order-detail-tit"><%=title%></span><i class="arrow-ent"></i></a><div class="item">总价<span class="Right">¥<%=priceStr%></span></div><div class="item">购买数量<span class="Right"><%=count%></span></div></div><div class="c-box"><div class="item">订单编号<span class="Right"><%=id%></span> </div><div class="item">下单时间<span class="Right"><%=time%></span></div><div class="item">订单状态<span class="Right"><%=statusMemo%></span></div></div><div class="height-box"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/orderdetail/orderinfo/view", ["marionette@~1.4.0", "underscore@~1.5.0", "../../../util/cache", "zepto-wepp@~1.1.0", "backbone@~1.1.0", "./template.html"], function(require, exports, module) {
var Marionette = require('marionette');
var _ = require('underscore');
var Cache = require("../../../util/cache");
var $ = require('zepto-wepp');
var Backbone = require('backbone');
var Router = new Backbone.Router();


module.exports = Marionette.ItemView.extend({
    template: _.template(require('./template.html')),
    events:{
    	"click .J_refund":"applyRefund"
    },
    applyRefund:function(e){
    	e.preventDefault();
        var elem = $(e.currentTarget);
        Cache.set("refundTitle",elem.attr("data-title"));
        Router.navigate("refund~"+elem.attr("data-id"),true);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/util/cache", [], function(require, exports, module) {
var hash = {};
var supportLocalStorage = ('localStorage' in window) && window['localStorage'] !== null;

function getHash(key){
    return key in hash ?hash[key]:null;
}
function getStorage(key){
    if(supportLocalStorage){
        return JSON.parse(localStorage.getItem(key));
    }else {
        return null;
    }
}

var Cache = {
    has:function(key){
        return (key in hash) || (supportLocalStorage && localStorage.getItem(key)!==null);
    },
    get:function(key){
        return getHash(key)!==null ?getHash(key):getStorage(key);
    },
    set:function(key,value){
        hash[key] = value;
        supportLocalStorage && localStorage.setItem(key,JSON.stringify(value));
    },
    remove:function(key){
        delete hash[key];
        supportLocalStorage && localStorage.removeItem(key);
    }
};

module.exports = Cache;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/pages/orderdetail", ["zepto-wepp@~1.1.0", "underscore@~1.5.0", "marionette@~1.4.0", "../modules/orderdetail/orderinfo/controller", "wepp@~2.7.0", "../modules/orderdetail/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var OrderDetailController = require("../modules/orderdetail/orderinfo/controller");
var City = require('wepp').Module.City;

var Controller = Marionette.Controller.extend({
    show:function(orderId){
        var self = this;
        var controller = new OrderDetailController(orderId);

        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/orderdetail/layout.html")),
                regions:{
                    'content':'.J_ordercontent'
                }
            });
            controller.render(page.layout.content);
        },function(page){
            controller.render(page.layout.content);
        });
    }
});
exports.Controller = Controller;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});