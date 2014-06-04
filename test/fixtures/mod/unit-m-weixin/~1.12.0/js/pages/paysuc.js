define("unit-m-weixin@~1.12.0/js/modules/paysuc/orderinfo/controller", ["../../../entities/orderdetail","zepto-wepp@~1.1.0","wepp@~2.7.0","./template.html"], function(require, exports, module) {
var Model = require('../../../entities/orderdetail');
var $ = require('zepto-wepp');
var Wepp = require('wepp');
var City = Wepp.Module.City;

var Controller = Wepp.Module.BaseController.extend({
    initModel:function(orderId){
        var self = this;
        var model =  new Model({
            cityid:City.getId(),
            orderid:orderId
        });
        model.on('change',function(){
            //修改状态
            self.changeStatus(model);
        });
        return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    changeStatus:function(model){
        var status = model.get("status");
        var dealType = model.get('dealType');
        if(status!=2 && status !=4){
            this.model.fetch();
        }
    }
});
module.exports = Controller;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/paysuc/layout.html", [], function(require, exports, module) {
module.exports = '<div class="paysuccontent"><div class="suc-box"><p class="tit"><i></i><span>订单正在处理中...</span></p><p class="tip">若团购券稍有延迟，请耐心等待: )</p></div></div><div class="appload" style="margin-top:20px;"><div class="tip"><i class="arr"></i>查看身边美食，享受低价折扣</div><a href="http://m.api.dianping.com/downloadlink?redirect=3125" class="link"><i class="logo"></i>下载大众点评客户端</a></div><div class="height-box"></div><div class="height-box"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/entities/orderdetail", ["backbone@~1.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@~1.12.0/js/modules/paysuc/orderinfo/template.html", [], function(require, exports, module) {
module.exports = '<div class="suc-box"><%if(dealType==3){%><%if(status==2){%><p class="tit"><i class="icon-suc"></i><span>抽奖成功！</span></p><p class="tip">抽奖号:<%=lotteryNumbers%>,可登录点评团电脑版查看抽奖详情~</p><%}else if(status==4){%><p class="tit"><i class="icon-fail"></i><span>抽奖失败！</span></p><%}%><%}else{%><%if(status==2){%><p class="tit"><i class="icon-suc"></i><span>购买成功！</span></p><p class="tip"><%=dealType==2?"可登录点评团电脑版查看配送信息":"若团购券稍有延迟，请耐心等待: )"%></p><%}else if(status==4){%><p class="tit"><i class="icon-fail"></i><span>支付成功购买失败！</span></p><p class="tip">您可以在网站上我的订单申请退款</p><%}else{%><p class="tit"><i></i><span>订单正在处理中...</span></p><p class="tip">若团购券稍有延迟，请耐心等待: )</p><%}%><%}%></div><div class="c-box"><%if(dealType!=3){%><a class="item" href="#receiptlist" class="J_receipt">查看团购券<i class="arrow-ent"></i></a><%}%><a class="item" href="#list">查看更多团购<i class="arrow-ent"></i></a></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/pages/paysuc", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/paysuc/orderinfo/controller","wepp@~2.7.0","../modules/paysuc/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var PayController = require("../modules/paysuc/orderinfo/controller");
var City = require('wepp').Module.City;

var Controller = Marionette.Controller.extend({
    show:function(orderId){
        var self = this;
        var controller = new PayController(orderId);

        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/paysuc/layout.html")),
                regions:{
                    'content':'.paysuccontent'
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