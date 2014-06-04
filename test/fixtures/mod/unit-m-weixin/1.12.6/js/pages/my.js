define("unit-m-weixin@1.12.6/js/modules/my/info/controller", ["wepp@~2.7.0","../../../entities/getuserprofilegn","zepto-wepp@~1.1.0","../layout.html"], function(require, exports, module) {
var Wepp = require('wepp');
var Profile = require('../../../entities/getuserprofilegn').UserModel;
var $ = require('zepto-wepp');
var UI = Wepp.UI;

module.exports = Wepp.Module.BaseController.extend({
    initModel:function(){
        return  new Profile();
    },
    initTpl:function(){
        return require('../layout.html');
    },
    onRender:function(model,view){
        view.$el.find('#J_unbind').click(function(e){
            $.ajax({
                url:'/ajax/account/thirdunbind',
                dataType:'json',
                type:'POST',
                data:{
                    ft:15
                },
                success:function(res){
                    if(res){
                        if(res.code===200){
                            UI.alert('解绑成功');
                            model.set('code',400);
                        }else {
                            UI.alert(res.msg.err || res.msg.message || "");
                        }
                    }
                },
                error:function(){
                    UI.alert('服务暂不可用，请稍后再试');
                }
            });
        });

    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/entities/getuserprofilegn", ["backbone@~1.1.0"], function(require, exports, module) {
var Backbone = require('backbone');

var UserModel = Backbone.Model.extend({
    url: '/ajax/tuan/tuanprofilegn.json?',
    initialize:function(options){
        this.fetch();
    },
    parse: function(res) {
        var data = res.data;

        return {
            phone:data.mobilePhone,
            userId:data.userId,
            balance:data.balance,
            nickName:data.nickName,
            couponCount:data.couponCount,
            receiptCount:data.unusedReceiptCount,
            orderCount:data.unpayedOrderCount,
            code:res.code
        };
    }
});
exports.UserModel = UserModel;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/my/layout.html", [], function(require, exports, module) {
module.exports = '<div class="account_info"><%if(/51ping/.test(location.href)){%><img src="http://si1.s1.51ping.com/m/css/app/weixin/img/my.png" style="width:100%;height:auto;display:block;"/><%}else{%><img src="http://m1.s1.dpfile.com/m/css/app/weixin/img/my.png" style="width:100%;height:auto;display:block;"/><%}%><div class="info_area"><%if(code==200){%><p class="name"><%=nickName%></p><p class="rest">余额: <%=balance%></p><%}else{%><p id="J_bind" style="text-align:center;height:40px;line-height:40px;">点击“返回”，再点击“我的账户”可以重新登录</p><%}%></div></div><%if(code==200){%><div class="c-box" style="margin-bottom:30px;"><a class="item" href="#receiptlist">我的团购券<span class="arrow-txt"><%=receiptCount||""%></span><i class="arrow-ent"></i></a><a class="item" href="#orderlist">我的订单<i class="arrow-ent"></i></a><a class="item" href="#couponlist">我的抵用券<span class="arrow-txt"><%=couponCount||""%></span><i class="arrow-ent"></i></a></div><%}%><%if(code==200){%><a href="javascript:;" id="J_unbind"  class="r-btn"  style="width:87.5%;margin:0 auto;">退出当前账号</a><div class="height-box"></div><%}%>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/pages/my", ["underscore@~1.5.0","wepp@~2.7.0","../modules/my/info/controller"], function(require, exports, module) {
var _ = require('underscore');
var Wepp = require('wepp');
var Info = require('../modules/my/info/controller');

exports.Controller = Wepp.PageController.extend({
    show:function(){
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template('<div class="J_info"><div class="loading" style="height:200px;"></div></div>'),
                regions:{
                    info:'.J_info'
                }
            });
            (new Info()).render(page.layout.info);
        });
        
        ThisApp.Menu.show(true);
        ThisApp.Menu.switchTo(2);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});