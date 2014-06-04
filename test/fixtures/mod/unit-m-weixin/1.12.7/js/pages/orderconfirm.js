define("unit-m-weixin@1.12.7/js/modules/orderconfirm/content/controller", ["./view","backbone@~1.1.0","marionette@~1.4.0","underscore@~1.5.0","../../../entities/getuserprofilegn"], function(require, exports, module) {
var View = require("./view");
var Backbone = require('backbone');
var Router = new Backbone.Router();
var Marionette = require('marionette');
var _ = require('underscore');

module.exports = Marionette.Controller.extend({
    initialize:function(options){
        //options are the conditions to fetch the list
        this.orderId = options.orderId || 0;

        // this.OrderModel = require("entities/orderconfirm").OrderModel;

    },
    show: function(region) {

        // this.OrderModel = new this.OrderModel({id:this.id});


        var self = this;

        var data = JSON.parse(localStorage["orderConfirm"]);

        this.UserProfilegnModel = require("../../../entities/getuserprofilegn").UserModel;

        this.userProfilegnModel = new this.UserProfilegnModel(data);



        this.view  = new View({
            model:this.userProfilegnModel
        });

        this.userProfilegnModel.on("change",_.bind(function(){

            data = _.extend(data,{   
                enPay:this.userProfilegnModel.get("balance") - data.paymentamount > 0 ? 0 : parseFloat(data.paymentamount - this.userProfilegnModel.get("balance")).toFixed(2)
            });

            this.userProfilegnModel.set("data",data)

            region.show(this.view);

            this.view.discountPlay();

        },this));




    },
    getView:function(){
        //close the current view and create a new one
        // var self = this;

        // var data = JSON.parse(localStorage["orderConfirm"]);

        // if(this.orderId != data.orderId){
        //     Router.navigate("#",true);
        // }

        // var DataModel = Backbone.Model.extend({
        //     initialize:function(options){
        //         this.set(options);
        //     }
        // })



        // this.view  = new View({
        //      model:new DataModel(data)
        // });




        return this.view;
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/orderconfirm/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_cnt"><div class="loading" style="height:300px;"></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/orderconfirm/content/view", ["marionette@~1.4.0","backbone@~1.1.0","wepp@~2.7.0","underscore@~1.5.0","zepto-wepp@~1.1.0","./template.html"], function(require, exports, module) {
var Marionette = require('marionette');
var Backbone = require('backbone');
var Url = require('wepp').Url;
var UI = require("wepp").UI;
var Router = new Backbone.Router();
var _ = require('underscore');
var $ = require('zepto-wepp');

module.exports = Marionette.ItemView.extend({
    template: _.template(require('./template.html')),
    tagName: "div",
    events:{
        "touchstart .J_orderconfirm_submit":"orderConfrimSend"
    },
    initialize: function(){

        this.discountPrice = 0;

    },

    orderConfrimSend: function(e){
        e.preventDefault();

        var self = this;

        var model = self.model;

        var _payment = model.get("paymentType").length && model.get("paymentType")[0] || {id:false};

        var _paymentamount = model.get("paymentamount");// - self.discountPrice  - model.get("balance") > 0 ? model.get("paymentamount") - self.discountPrice  - model.get("balance") : 0

        var _paytype = _payment.id;


        if(self.discountId && model.get("canUseDiscount")){

            _paymentamount = parseFloat(_paymentamount - self.discountPrice > 0 ?  _paymentamount - self.discountPrice : 0).toFixed(2);

            _paytype = _paymentamount > 0 ? _paytype : "";
        }

        if(model.get("canUseBalance") && model.get("balance")){

            _paymentamount = parseFloat(_paymentamount - model.get("balance") > 0 ? _paymentamount - model.get("balance") : 0).toFixed(2);

            _paytype = _paymentamount > 0 ? _paytype : "";

        }



        $(".J_orderconfirm_submit").addClass("hide");
        $(".J_un_orderconfirm_submit").removeClass("hide");


        $.ajax({
            url:"/ajax/tuan/confirmordergn.json?"+(new Date()).valueOf(),
            type:"POST",
            dataType:"json",
            data:{
                channel:"weixin",
                dealid: model.get("groupId"),
                orderid: model.get("orderId"),
                paymentamount: _paymentamount,
                paymenttype: _paytype,
                discountid: self.discountId || "" 
            },
            success:function(res){
                var data = res.data;
                $(".J_orderconfirm_submit").removeClass("hide");
                $(".J_un_orderconfirm_submit").addClass("hide");


                if(res.code == 200 ){
                    if(data.flag == 0){
                        Router.navigate("#paysuc~"+model.get("orderId"),true);
                    }else{
                        var _match = navigator.userAgent.match(/MicroMessenger\/([^\.]+)/);

                        if(_match&&(parseInt(_match[1])>4)){

                            var content = JSON.parse(data.content);

                            WeixinJSBridge.invoke('getBrandWCPayRequest',content,function(res){
                                if(res.err_msg == "get_brand_wcpay_request:ok"){
                                    Router.navigate("#paysuc~"+model.get("orderId"),true);
                                }else if(res.err_msg == "get_brand_wcpay_request:cancel"){
                                    UI.alert("支付取消");
                                }else{
                                    UI.alert("支付失败");
                                }

                            });
                        }else{
                            UI.alert("您的微信版本过低，不能使用支付功能，请升级客户端版本。");
                        }
                    }
                }else{
                    UI.alert(data.content);
                }
            }
        });

    },


    discountPlay: function(){
        var self = this;
        var model = this.model;

        var _discount;



        if(!model.get("canUseDiscount")){

            $(".J_discount_href").attr("href","javascript:void(0)");

            $(".J_discount_mes").html("本单不可使用");

        }else{

            if(model.get("discountList") && model.get("discountList").length != 0){
                $(".J_discount_mes").html("有可用优惠");
            }else{
                $(".J_discount_mes").html("");
            }

            ThisApp.commands.setHandler("order::promo::update",function(result){


                if(result){

                    $(".J_discount_mes").html(result.title).removeClass("Right");

                    var _enpay = model.get("data").enPay - (result.priceStr || 0)   ;

                    $(".J_pay").html(  _enpay >  0 ? parseFloat(_enpay > 0 ? _enpay : 0).toFixed(2) : 0);

                    if( !(_enpay > 0) ){
                        $(".J_payment_ofter").addClass("hide");
                    }

                    self.discountPrice = result.priceStr;

                    self.discountId = result.id;

                }else{

                    $(".J_discount_mes").addClass("Right").html("选择优惠类型")

                    $(".J_pay").html(model.get("data").enPay);

                    self.discountPrice = 0;

                    if(model.get("data").enPay > 0 ){

                        $(".J_payment_ofter").removeClass("hide");


                    }

                    self.discountId = "";

                }

            });

        }
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/entities/getuserprofilegn", ["backbone@~1.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/modules/orderconfirm/content/template.html", [], function(require, exports, module) {
module.exports = '<div class="Box"><h5><%= title %></h5><div class="order-box"><ul><li>数量：<span class="infor Right"><%= count %></span></li><li>总价：<span class="Right">¥<%= paymentamount %></span></li></ul></div></div><div class="Box"><div class="order-box"><ul><li><span class="info">我的余额：</span><span class="Right">¥<%= balance %></span></li><li class="no-p "><a onclick="ThisApp.mv({module:\'cashier_coupon\'})" class="fill arrow J_discount_href" href="#promo~<%= orderId%>"><span class="tip">抵用券/优惠代码：</span><span class="mes J_discount_mes Right"></span><i class="arrow-ent right arrow-pos d"></i></a></li><li><div class="dz"><span class="tip">还需支付：</span><strong class="price J_pay Clear Right">¥<%= data.enPay %></strong></div></li></ul></div></div><div class="Box"><a onclick="ThisApp.mv({module:\'cashier_topay\'})" href="javascript:void(0)"  class="y-btn J_orderconfirm_submit" name="" style="width:95%;margin:0 auto;">确认订单，付款</a><a href="javascript:void(0)"  class="n-btn J_un_orderconfirm_submit hide" name="" style="width:95%;margin:0 auto;">正在处理</a></div><div style="height:50px;width:100%"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/pages/orderconfirm", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/orderconfirm/content/controller","../modules/orderconfirm/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var content = require('../modules/orderconfirm/content/controller');


var OrderConfirmController = Marionette.Controller.extend({
    show:function(id){
        var self =  this;
        self.OrderConfirmController = new content({orderId:id});

        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/orderconfirm/layout.html")),
                regions:{
                    'header': '.J_header',
                    'content': '.J_cnt'
                }
            });
            self.OrderConfirmController.show(page.layout.content);

        });
    }
});

exports.Controller = OrderConfirmController;


}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});