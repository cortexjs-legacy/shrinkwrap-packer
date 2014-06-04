define("unit-m-weixin@1.12.5/js/modules/promo/content/controller", ["marionette@~1.4.0", "./view", "backbone@~1.1.0", "underscore@~1.5.0"], function(require, exports, module) {
var Marionette = require('marionette');
var View = require("./view");
var Backbone = require('backbone');
var Router = new Backbone.Router();
var _ = require('underscore');

module.exports = Marionette.Controller.extend({
    initialize:function(options){
        this.orderId = options.orderId;
    },


    show: function(region) {
        var data = JSON.parse(localStorage["orderConfirm"]);


        _.map(data.discountList,function(item){
            var time = new Date(item.expiredDate);
            item.expiredDate = time.getFullYear()+"-"+ (time.getMonth()+1) + "-" + time.getDate();
        }) 



        if(this.orderId != data.orderId){
            Router.navigate("#",true);
        }

        var DataModel = Backbone.Model.extend({
            initialize:function(options){
                this.set(options);
            }
        })

        this.view  = new View({
            model:new DataModel(data)
        });

        region.show(this.view);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/promo/content/template.html", [], function(require, exports, module) {
module.exports = '<div class="Box"><h5>选择您要使用的优惠，无效抵用券将不会显示</h5><div class="order-box no-p"><ul id="J_couponList"><li><a class="fill J_promo" href="javascript:void(0);"><label>不使用优惠</label></td><input name="couponIDString" class="radio-input" type="radio" checked value=""></a></li><%_.each(discountList,function(item){ %><li><a class="fill J_promo" href="javascript:void(0);"><table cellpadding="0" cellspacing="0" width="100%"><tbody><tr><td><span><%= item.title %></span><p><%= item.expiredDate %>&nbsp;&nbsp;过期</p></td><td width="30" align="right" valign="middle"><input  name="couponIDString"  class="radio-input" type="radio" value="<%= item.id %>"></td></tr></tbody></table></a></li><% }) %><li><a class="fill J_promo" href="javascript:void(0);"><input id="couponcode" type="text" placeholder="填写优惠代码" class="test-input J_promo_code" name="couponCode"></td><input  name="couponIDString" class="radio-input J_promo_input" type="radio" value="coupon"></tr></tbody></table></a></li></ul></div></div><div class="Box"><a href="javascript:void(0)"  type="submit" class="y-btn J_promo_submit"  style="width:100%">确认</a><a href="javascript:void(0)"  type="submit" class="y-btn J_un_promo_submit hide"  style="width:100%">正在处理</a></div><div class="height-box"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/promo/content/view", ["marionette@~1.4.0", "backbone@~1.1.0", "underscore@~1.5.0", "zepto-wepp@~1.1.0", "cookie@~0.1.0", "wepp@~2.7.0", "./template.html"], function(require, exports, module) {
var Marionette = require('marionette');
var Backbone = require('backbone');
var Router = new Backbone.Router();
var _ = require('underscore');
var $ = require('zepto-wepp');
var Cookie = require('cookie');

var UI = require("wepp").UI;

module.exports = Marionette.ItemView.extend({
    template: _.template(require('./template.html')),
    tagName: "div",
    events:{
        "click .J_promo":"couponSelect",
        "click .J_promo_submit":"promo_send"
    },
    initialize: function(){
        this.value = "";
    },
    couponSelect: function(e){
        var target = $(e.currentTarget),
        self = this,
        model,
        discountList,
        result;

        $("input[type='radio']").removeAttr("checked");

        target.find("input[type='radio']").attr("checked","true");

        self.value = target.find("input[type='radio']").val();

        model = self.model;


        discountList = model.get("discountList") || [];


        result = _.filter(discountList,function(item){

            if(item.id == self.value)
                return true
            return false
        })

        this.result = result.length ? result[0] : false;

    },
    promo_send: function(e){

        e.preventDefault();

        if(!this.checkPromoCode())
            return false;


        var model = this.model;

        ThisApp.execute("order::promo::update",this.result || "");


        history.go(-1);

        //Router.navigate("#orderconfirm/"+model.get("orderId"),true);

    },

    checkPromoCode:function(){
        var self = this;
        var model = self.model;
        var _result = true;



        if($(".J_promo_input").attr("checked")){
            var _val = $(".J_promo_code").val();
            if(!_val){
                UI.alert("代码不能为空");
                return false;
            }else{
                var sendCount =  parseInt(Cookie("promoNum")) || 0;

                if(sendCount > 10 ){
                    UI.alert("操作频繁，请20分后再试。");
                    return false;
                }

                $.ajax({
                    url: "/ajax/tuan/verifyCouponCodegn.json",
                    data: {
                        groupid : model.get("groupId"),
                        dealid : model.get("dealId"),
                        count : model.get("count"),
                        cityid: model.get("cityId"),
                        code: $(".J_promo_code").val()
                    },
                    type:"POST",
                    async:false,
                    dataType:"json",
                    success:function(res){
                        if(res.code == 200){
                            self.result = res.data;
                            $(".J_promo_code").val("");

                        }else{
                            var data = res.data;
                            _result = false;
                            UI.alert(data.content);

                        }

                    }
                });
                if(sendCount){
                    Cookie("promoNum",parseInt(sendCount)+1);
                }else{
                    Cookie("promoNum",1,{expires:(1/72)});
                }

            }
        }
        return _result;
    }

});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/promo/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_cnt"><div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/pages/promo", ["zepto-wepp@~1.1.0", "underscore@~1.5.0", "marionette@~1.4.0", "../modules/promo/content/controller", "../modules/promo/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var content = require('../modules/promo/content/controller');

var PromoController = Marionette.Controller.extend({
    show:function(id){
        var self =  this;
        self.contentController = new content({orderId:id});
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/promo/layout.html")),
                regions:{
                    'header': '.J_header',
                    'content': '.J_cnt'
                }
            });
            self.contentController.show(page.layout.content);
        });
    }
});

exports.Controller = PromoController;


}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});