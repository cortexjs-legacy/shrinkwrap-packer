define("unit-m-weixin@~1.12.0/js/modules/bindphone/content/controller", ["marionette@~1.4.0","backbone@~1.1.0","./view"], function(require, exports, module) {
var Marionette = require('marionette');
var Backbone = require('backbone');

var View = require("./view");

module.exports = Marionette.Controller.extend({
    initialize:function(options){

        var DataModel = Backbone.Model.extend({
            initialize:function(options){
                this.set(options);
            }
        });

        this.dataModel = new DataModel(options);
    },
    show: function(region) {

        this.view  = new View({
            model:this.dataModel
        });

        region.show(this.view);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/bindphone/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_content"><div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/bindphone/content/view", ["backbone@~1.1.0","marionette@~1.4.0","wepp@~2.7.0","zepto-wepp@~1.1.0","underscore@~1.5.0","./template.html"], function(require, exports, module) {
var Backbone = require('backbone');
var Marionette  = require('marionette');
var UI = require("wepp").UI;
var Router = new Backbone.Router();
var $ = require('zepto-wepp');
var _ = require('underscore');

module.exports = Marionette.ItemView.extend({
    template: _.template(require('./template.html')),
    tagName: "div",
    events:{
        "click .J_getCaptcha":"sendCaptch",
        "click .J_bind_submit":"verifyCode"
    },
    initialize: function(){

    },
    sendCaptch:function(){
        var _phone = $(".J_bind_phone").val();
        var self = this;
        if(/^1\d{10}$/.test(_phone)){
            $(".J_bind_phone").attr("readonly",true);

            $.ajax({
                url:"/ajax/tuan/sendverifycodegn.json",
                data:{
                    phone:_phone,
                    callid:parseInt((Math.random()+"").substr(2,15)),
                    rebind:1
                },
                type:"POST",	
                success:function(res){
                    var data = res.data;
                    if(res.code == 200){
                        self._timeout();
                        UI.alert("验证码已发送");
                        $(".J_order_verify_code").removeClass("hide");
                    }else{
                        UI.alert('验证码发送失败');
                        $(".J_bind_phone").removeAttr("readonly");
                    }
                    // else if(res.code == 400 && data.flag ==1){
                    // 	UI.alert("手机号已绑定");
                    // 	$(".J_bind_phone").removeAttr("readonly");
                    // }
                }
            });


        }else{
            UI.alert("无效手机号");
        }

    },
    _timeout:function(){
        $(".J_getCaptcha").addClass("hide");
        $(".J_getCaptcha_ing").removeClass("hide").html("60秒后重发");

        self.timer = setInterval(function(){
            var _time = parseInt($(".J_getCaptcha_ing").html());
            if(_time == 1){
                clearInterval(self.timer);
                $(".J_getCaptcha_ing").addClass("hide");
                $(".J_getCaptcha").removeClass("hide");

                $(".J_bind_phone").removeAttr("readonly");
            }
            $(".J_getCaptcha_ing").html((_time - 1)+"秒后重发");
        },1000);
    },

    verifyCode:function(){
        var _code = $(".J_login_bindphone_input").val();
        var _phone = $(".J_bind_phone").val();
        var model = this.model;

        if(!/^1\d{10}$/.test(_phone)){
            UI.alert("无效手机号");
            return false;
        }

        $(".J_bind_submit").addClass("hide");		
        $(".J_un_bind_submit").removeClass("hide");

        $.ajax({
            url:"/ajax/tuan/BindPhonegn.json",
            data:{
                phone:_phone,
                code:_code,
                callid:parseInt((Math.random()+"").substr(2,15))
            },
            type:"POST",
            success:function(res){
                var data = res.data;

                if(res.code == 200){
                    ThisApp.execute("order::phone::update",_phone);
                    history.go(-1);
                    $(".J_bind_submit").removeClass("hide");
                    $(".J_un_bind_submit").addClass("hide");
                }else{
                    UI.alert("验证码有误");
                    $(".J_bind_submit").removeClass("hide");
                    $(".J_un_bind_submit").addClass("hide");
                }
            }
        });
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/bindphone/content/template.html", [], function(require, exports, module) {
module.exports = '<div class="Box"><h5>为保障团购安全，请绑定手机号</h5><div class="order-box"><ul><li><span class="infor">手机号&nbsp;</span><input id="J_phoneNum" class="phone-input J_bind_phone" placeholder="请输入手机号" type="text" name="mobile"><a class="s-btn Right J_getCaptcha"  href="javascript:void(0)">获取验证码</a><a class="g-btn Right J_getCaptcha_ing hide"  href="javascript:void(0)"></a></li><li><span class="infor">验证码&nbsp;</span><input  class="phone-input J_login_bindphone_input" placeholder="请输入验证码" type="text" name="mobile"></li></ul></div></div><div class="Box"><a class="y-btn J_bind_submit"  href="javascript:void(0)">提交</a><a class="n-btn hide J_un_bind_submit"  title="" href="javascript:void(0)">正在处理</a></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/pages/bindphone", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/bindphone/content/controller","../modules/bindphone/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var content = require('../modules/bindphone/content/controller');

var BindPhoneController = Marionette.Controller.extend({
    show:function(gId,dId){
        var self =  this;
        self.contentController = new content({groupId:gId,dealId:dId});
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/bindphone/layout.html")),
                regions:{
                    'content': '.J_content'
                }
            });
            self.contentController.show(page.layout.content);
        });
    }
});

exports.Controller = BindPhoneController;



}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});