define("unit-m-weixin@latest/js/modules/order/content/controller", ["./view","marionette@~1.4.0","zepto-wepp@~1.1.0","cookie@~0.1.0","underscore@~1.5.0","../../../entities/order"], function(require, exports, module) {
var View = require("./view");
var Marionette = require('marionette');
var $ = require('zepto-wepp');
var cookie = require('cookie');
var _ = require('underscore');

module.exports = Marionette.Controller.extend({
    initialize:function(options){
        this.dealId = options.dealId || 0;
        this.groupId = options.groupId || 0;
    },
    show: function(region) {
        var self = this;

        this.OrderModel = require("../../../entities/order").OrderModel;

        this.orderModel = new this.OrderModel({groupId:this.groupId,dealId:this.dealId});

        this.getView();

        this.orderModel.on("change",_.bind(function(){

            region.show(self.getView());

            this.view.dataInit();

        },this));
    },
    getView:function(){
        var self = this;

        var wCookie = cookie("_thirdu.c") || false;

        this.orderModel.set("wCookie",wCookie);

        this.view  = new View({
            model:this.orderModel
        });

        return this.view;
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@latest/js/modules/order/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_cnt"><div class="loading" style="height:200px;"></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@latest/js/modules/order/content/view", ["wepp@~2.7.0","backbone@~1.1.0","zepto-wepp@~1.1.0","marionette@~1.4.0","underscore@~1.5.0","./template.html","../../../entities/getuserprofilegn","../../../entities/deliverylist"], function(require, exports, module) {
var Wepp = require('wepp');
var UI = Wepp.UI;
var Backbone = require('backbone');
var Router = new Backbone.Router();
var $ = require('zepto-wepp');
var Marionette = require('marionette');
var _ = require('underscore');

module.exports =  Marionette.ItemView.extend({
    template: _.template(require('./template.html')),
    tagName: "div",
    events:{
        "click .J_order_submit":"checkForm",
        "touchstart .J_count_delete":"priceOp",
        "touchstart .J_count_add":"priceOp",
        "click .J_deliver_save":"saveOrderInfo",
        "blur .J_order_unbind_phone":"phoneEdit",
        "touchstart .J_order_getCaptcha":"sendCaptch"
    },
    initialize:function(){
        // 城市信息
        this.cityId = Wepp.Module.City.getId();

        //拿手机号
        this.UserProfilegnModel = require("../../../entities/getuserprofilegn").UserModel;

        this.userProfilegnModel = new this.UserProfilegnModel();

        this.isDeliver = this.model.get("dealType") == 2 ?  true : false;

        this.userProfilegnModel.on("change",_.bind(function(){

            this.getUserInfo();

        },this));
    },
    phoneEdit: function(e){
        $(".J_order_unbind_phone").attr("data",$(".J_order_unbind_phone").val());
    },
    saveOrderInfo: function(e){
        e.preventDefault();
        var model  =this.model;

        localStorage.setItem("orderInfo",JSON.stringify({gId:model.get("groupId"),dId:model.get("dealId")}));

        //location.href = "#deliverylist";
        Router.navigate("#deliverylist",true);
    },
    priceOp: function(e){
        e.preventDefault();
        var model = this.model;

        var tarDom = $(e.currentTarget);
        var priceDom = $(".J_total_price");
        var countDom = $(".J_total_count");
        var _plus = $(".J_count_add");
        var _mul = $(".J_count_delete");
        var priceCount = parseFloat(priceDom.html());
        var price = parseFloat(model.get("price"));
        var count = parseInt(countDom.val());
        var _min =  model.get("minCount");
        var _max = model.get("maxCount");

        if(tarDom.hasClass("J_count_delete") && (parseInt(countDom.val()))< _min){
            return false;
        }else if(tarDom.hasClass("J_count_add") && _max != 0 && (parseInt(countDom.val())) > _max){
            return false;
        }


        $(priceDom).html(
            tarDom.hasClass("J_count_delete") ? (priceCount - price > 0 ? parseFloat(priceCount-price).toFixed(2) : parseFloat(price).toFixed(2) ) :
            tarDom.hasClass("J_count_add")  ? parseFloat(priceCount+price).toFixed(2) : priceCount
        );

        $(countDom).val(
            tarDom.hasClass("J_count_delete") ? (count - 1 > 0 ? count - 1 : count ) :
            tarDom.hasClass("J_count_add")  ? count+1 : count
        )


        _plus.removeClass("n-bytn")
        _mul.removeClass("n-btn");

        if(tarDom.hasClass("J_count_delete") && (parseInt(countDom.val())) == _min){
            _mul.addClass("n-btn");
        }else if(tarDom.hasClass("J_count_add") && _max != 0 && (parseInt(countDom.val())) == _max){
            _plus.addClass("n-btn");
        }




    },
    sendOrder: function (e){
        var model = this.model;
        var self = this;
        var _delivery;

        $(".J_order_submit").addClass("hide");
        $(".J_un_order_submit").removeClass("hide");

        var data = {
            "groupid": model.get("groupId"),
            "dealid": model.get("dealId"),
            "cityid": self.cityId,
            "phoneNo": self.phoneNo || "",
            "count": self.count,
            "paymentamount": self.paymentamount,
            "callid": "",
            "deliveryid": self.deleveryData && self.deleveryData.id || "",
            "deliverytype": $(".J_delivery_type").val(),
            "orderId": "0",
            "memo": $(".J_order_text").val().trim(),
            "invoicetitle": ($(".J_order_receipt").val() || "" ).trim(),
            "cardid": "",
            "productid": "",
            "source": "",
            "ismembercard": "0",
            "channel":"weixin",
            utm:Wepp.Url.get('utm')|""
        };
        var _b =  parseFloat(self.userProfilegnModel.get("balance")) ;
        var _p =  parseFloat(self.paymentamount);

        $.ajax({
            url: model.get("dealType") != 3  ? "/ajax/tuan/createordergn.json?"+(new Date()).valueOf() : "/ajax/tuan/submitLotterygn.json?" + (new Date()).valueOf(),
            data:data,
            type:"POST",
            dataType:"json",
            success:function(res){
                var data = res.data || {};

                $(".J_order_submit").removeClass("hide");
                $(".J_un_order_submit").addClass("hide");

                if(res.code == 200){
                    if(model.get("dealType") == 3){
                        localStorage.setItem("lottery",data.content);

                        Router.navigate("#paysuc~lottery",true);
                    }else{
                        localStorage.setItem("orderConfirm",JSON.stringify({
                            "orderId":data.orderId,
                            "title":model.get("title"),
                            "price":model.get("price"),
                            "groupId":model.get("groupId"),
                            "count":self.count,
                            "dealId":model.get("dealId"),
                            "canUseBalance" : model.get('canUseBalance'),
                            "canUseDiscount" : model.get('canUseDiscount'),
                            "paymentamount":_p,
                            "paymentType":data.paymentType,
                            "userId":self.userProfilegnModel.get("userId"),
                            // "balance":_b,
                            // "enPay":  parseFloat(model.get('canUseBalance') ? (_b - _p   < 0  ?  _p - _b  : 0 ) : _p).toFixed(2) ,
                            // "balanceAlert": _p - (model.get('canUseBalance') ? _b : 0) > 0 ? "余额不足" : "",
                            "shortTitle":model.get("shortTitle"),
                            "discountList":data.discountList || [],
                            "cityId":self.cityId
                        }));
                        if(location.search){
                            if(location.search.indexOf('showwxpaytitle')==-1){
                                location.href = location.search+"&showwxpaytitle=1#orderconfirm~"+ data.orderId;
                            }else {
                                location.href = "#orderconfirm~"+ data.orderId;
                            }
                        }else {
                            location.href= "?showwxpaytitle=1#orderconfirm~"+ data.orderId;
                        }
                    }
                }else{
                    UI.alert(data.content);
                    // setTimeout(function(){location.reload();},1000);
                }
            }
        });


    },

    checkForm:function(e){
        var self = this;
        var model  = self.model;
        e.preventDefault();
        var isThird = model.get('isThird');
        var isLottery = model.get('dealType') ==3;
        var isZero = model.get('price')==0;

        if( !self.unLogin && (self.isDeliver && !self.deleveryData) ){
            UI.alert("请选择配送信息");
            return false;
        }

        this.count = parseInt($(".J_total_count").val());

        this.paymentamount = parseFloat($(".J_total_price").html());

        if(self.unLogin){
            function getNoAndCode(){
                var _code = $(".J_code_input").val().trim();
                self.phoneNo = $(".J_order_unbind_phone").val().trim();

                if(!/^1\d{10}$/.test(self.phoneNo)){
                    UI.alert("无效手机号");
                    return false;
                }

                if(!_code){
                    UI.alert("验证码不能为空");
                    return false;
                }
                return  {
                    mobile:self.phoneNo,
                    vcode:_code
                };
            }


            var loginUrl,data;
            var hasThirdCookie = model.get('wCookie');
            if(hasThirdCookie && (isThird || isLottery || isZero)){
                loginUrl = "/ajax/account/mobiledynamiclogin/3";
                data = getNoAndCode();
                if(!data){
                    return ;
                }

            }else if(!hasThirdCookie){
                loginUrl = "/ajax/account/mobiledynamiclogin/2";
                data = getNoAndCode();
                if(!data){
                    return ;
                }
            }else if(hasThirdCookie && !isThird && !isLottery && !isZero) {
                loginUrl = "/ajax/account/thirdpartlogin";
                data = {};
            }

            $(".J_order_submit").addClass("hide");
            $(".J_un_order_submit").removeClass("hide");

            $.ajax({
                url: loginUrl ,
                data:data,
                type:"POST",
                dataType:"json",
                success:function(res){
                    if(res.code == 200){
                        if(self.isDeliver){
                            location.reload();
                        }else{
                            self.sendOrder.call(self,arguments[0]);
                        }
                    }else{
                        UI.alert( (res.msg&&res.msg.err));
                        $(".J_order_submit").removeClass("hide");
                        $(".J_un_order_submit").addClass("hide");
                        return false;
                    }
                }

            });
        }else{
            if((isThird || isLottery || isZero) && !self.checkPhone($(".J_order_bind_phone").attr("data"))){
                UI.alert("无效手机号");
                return false;
            }else{
                this.phoneNo = $(".J_order_bind_phone").attr("data") || "";
            }
            self.sendOrder.call(self,arguments[0]);
        }
    },


    showDealInfo: function(region){
        var self = this;
        var model = this.model;

        if(model.get("status") == 2){
            $(".J_un_order_submit").removeClass("hide").html("已卖光");
            $(".J_order_submit").addClass("hide");
        }

        if(self.isDeliver){

            self.UserDeliveryListModel = require("../../../entities/deliverylist").DeliveryModel;

            var userDeliveryListModel = self.userDeliveryListModel = new self.UserDeliveryListModel();

            userDeliveryListModel.on("change",_.bind(function(){

                self.isDeliver && $(".J_order_delivery").removeClass("hide");

                self.deliveryUpdate(userDeliveryListModel.get("indexSelected"));

                self.iscrollInstance && self.iscrollInstance.refresh();

            },self));


            ThisApp.commands.setHandler("order::delivery::update",function(index){
                self.deliveryUpdate(index);
            })

            ThisApp.commands.setHandler("order::deliveryList::add",function(delivery){

                userDeliveryListModel.set("list",delivery)

                $(".J_delivey_alert").html("更改收货地址");

            })

        }else{
            self.iscrollInstance && self.iscrollInstance.refresh();
        }

        // self.iscrollInstance && self.iscrollInstance.refresh();
    },

    deliveryUpdate:function(index){
        var self  = this;
        var deliveryModel = this.userDeliveryListModel;



        var result = deliveryModel.get("list") && deliveryModel.get("list")[index];

        if(!result){
            $(".J_delivey_order").html("");
            $(".J_delivey_alert").html("添加新地址");
            return false;
        }

        $(".J_delivey_order").removeClass("hide").html('<div class="item">'+result.receiver+'&nbsp;&nbsp;'+result.phoneNo+' <br>'+result.showAddress+'<br>'+result.postCode+'</div>')

        deliveryModel.set("indexSelected",index);

        this.deleveryData = result;

        //self.iscrollInstance && self.iscrollInstance.refresh();


    },


    getUserInfo: function(e){
        var self =this;
        var data = this.userProfilegnModel;
        var model = this.model;
        var isThird = model.get('isThird');
        var isLottery = model.get('dealType') ==3;
        var isZero = model.get('price')==0;
        var hasThirdCookie = model.get('wCookie');
        var phoneTitle = $('.J_phone_title');

        if(data.get("code") == 200){
            //登录的

            $(".J_order_un_login").addClass("hide");
            $(".J_order_login").removeClass("hide");

            var _phone = data.get("phone");
            phoneTitle.html("您绑定的手机号");
            if(_phone){
                phoneTitle.removeClass('hide');
                $(".J_order_bind_phone").attr({"data":_phone,"readonly":true}).html('手机号：<input type="text" class="nolog-input " placeholder="填写手机号码" value="'+_phone.replace(/\d{3}(\d{4})/,function(match){return match.substr(0,3)+"****"})+'">');
            }else if(isThird || isLottery || isZero){
                ThisApp.commands.setHandler("order::phone::update",function(phone){
                    $(".J_order_bind_phone").removeClass("no-p").attr({"data":phone,"readonly":true}).html('手机号：<input type="text" class="nolog-input " placeholder="填写手机号码" value="'+phone.replace(/\d{3}(\d{4})/,function(match){return match.substr(0,3)+"****"})+'">');
                    self.phoneNo = phone;
                });
                $(".J_order_bind_phone").addClass("no-p").html('<a class="fill arrow" href="#bindphone~g_'+model.get("groupId")+"~d_"+model.get("dealId")+'"> <span class="info">请绑定手机号</span> <i class="arrow-ent right d"></i> </a>')
                phoneTitle.removeClass('hide');
            }else {
                phoneTitle.parent().hide();
            }
            self.showDealInfo();
        }else{
            self.unLogin = true;
            $(".J_order_delivery").addClass("hide");
            if(!hasThirdCookie || (hasThirdCookie && (isThird || isLottery || isZero))){
                phoneTitle.removeClass('hide');
                $(".J_order_un_login").removeClass("hide");
            }else {
                $(".J_order_un_login").addClass("hide");
                var _location = encodeURIComponent(location.href);
                var host =  location.host.indexOf('51ping')!==-1?"http://m.51ping.com/":"http://m.dianping.com/";
                var url = host+"bind?redir="+_location;
                phoneTitle.html('<a href="'+url+'">绑定已有点评账号</a>').removeClass('hide');
            }
            self.iscrollInstance && self.iscrollInstance.refresh();
        }
    },

    checkPhone:function(num){
        return /^1\d{10}$/.test(parseInt(num));
    },

    dataInit: function(){
        var model = this.model;
        this.count = model.get("minCount");

    },

    sendCaptch:function(){
        var _phone = $(".J_order_unbind_phone").val();
        var self = this;
        var model = this.model;
        if(/^1\d{10}$/.test(_phone)){
            $(".J_order_unbind_phone").attr("readonly",true);

            $.ajax({
                url:model.get("wCookie") ? "/ajax/account/mobiledynamiclogincode/3" : "/ajax/account/mobiledynamiclogincode/2",
                data:{
                    mobile:_phone
                },
                type:"POST",
                dataType:"json",
                success:function(res){

                    var data = res.data;
                    if(res.code == 200){
                        self._timeout();
                        UI.alert("验证码已发送");
                        $(".J_order_verify_code").removeClass("hide");
                    }else{
                        UI.alert( (res.msg && res.msg.err) || "验证码发送失败");
                        $(".J_order_unbind_phone").removeAttr("readonly");
                    } 
                    // if(res.code == 400 && data.flag == 0){
                    //     UI.alert("频繁操作");
                    //     $(".J_order_bind_phone").removeAttr("readonly");
                    // }else if(res.code == 400 && data.flag ==1){
                    //     UI.alert("手机号已绑定");
                    //     $(".J_order_bind_phone").removeAttr("readonly");
                    // }
                }
            });


        }else{
            UI.alert("无效手机号");
        }
    },

    _timeout:function(){
        $(".J_order_getCaptcha").addClass("hide");
        $(".J_order_getCaptcha_ing").removeClass("hide").html("60秒后重发");

        self.timer = setInterval(function(){
            var _time = parseInt($(".J_order_getCaptcha_ing").html());
            if(_time == 1){
                clearInterval(self.timer);
                $(".J_order_getCaptcha_ing").addClass("hide");
                $(".J_order_getCaptcha").removeClass("hide");

                $(".J_order_unbind_phone").removeAttr("readonly");

            }
            $(".J_order_getCaptcha_ing").html((_time - 1)+"秒后重发");
        },1000);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@latest/js/entities/order", ["backbone@~1.1.0","./city"], function(require, exports, module) {
var Backbone = require('backbone');
var OrderModel = Backbone.Model.extend({
    baseUrl: '/ajax/tuan/dealgn.json?',
    initialize:function(options){
        this.set(options);  
        this.setUrl();
        this.fetch();
    },
    parse: function(res) {
        var self =this;
        var data = res.data;

        result = (data.dealSelects && data.dealSelects.filter(function(item){
            if(self.get("dealId") && item.id == self.get("dealId")){
                return true;
            }
            return false;
        })[0]) || {};

        return{
            title: result.title || "",
            price: result.priceStr || -0,
            minCount:data.buyMixCount,
            total : parseFloat(parseInt(data.buyMixCount)*parseFloat(result.priceStr)).toFixed(2),
            deliveryType:data.deliveryType,
            dealType:result.dealType,
            maxCount:data.buyLimit,
            dealId:result.id,
            groupId : self.get("groupId"),
            dealSelects:data.dealSelects,
            shortTitle:data.shortTitle,
            canUseBalance : data.canUseBalance,
            canUseDiscount : data.canUseDiscount,
            status : result.status,
            refund : data.refund,
            hasReceipt:data.hasReceipt,
            isThird:data.isThirdParty,
            isLimitPerUser:data.isLimitPerUser
        };
    },
    setUrl: function() {
        var city = require("./city");

        this.url = this.baseUrl + 'id=' + this.get('groupId')+"&cityid="+city.getId();
    }
});

exports.OrderModel = OrderModel;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@latest/js/modules/order/content/template.html", [], function(require, exports, module) {
module.exports = '<div class="Box"><div class="order-box order-info"><ul><li class="item-cls"><span class="infor"><%= title %></span><%if(minCount != 1 || isLimitPerUser){%><div class="o-alert"><%if(minCount != 1){%>  至少买<%= minCount %>份<%}%> <%if(isLimitPerUser){%>最多可买<%= maxCount %>份<%}%></div><%}%></li><% if(dealType != 3){%><li>单价：<span class="infor Right" id="J_price">¥<%= price %></span></li><li>数量：<span class="Right"><a onclick="ThisApp.mv({module:\'order_reducenum\'})" class="num-operating J_count_delete y-btn n-btn"  href="javascript:void(0)" data-min="1">-</a><input id="J_amount" readonly type="text" name="quantity" autocomplete="off" maxlength="5" value="<%= minCount %>" class="s-input J_total_count"><a onclick="ThisApp.mv({module:\'order_addnum\'})" class="noDirect num-operating plus J_count_add y-btn" href="javascript:void(0)" data-max="9999" data-maxperuser="0" >+</a></span></li><li>总价：<span class="Right"><strong>¥</strong> <strong class="price J_total_price"><%= total %></strong></span> </li><li class="refund"><span class="support Left"><% if(refund){%><i class="icon-s"></i>支持随时退</span><span class="support Left"><i class="icon-s"></i>支持过期退</span><%}else{%><i class="icon-e"></i>不支持随时退</span><span class="support Left"><i class="icon-e"></i>不支持过期退</span><%}%></li><%}%></ul></div></div><div class="Box"><h5 class="J_phone_title hide">请输入您的手机号<b style="color:red">*</b> <% if(wCookie){ %>或 <a onlick="ThisApp.mv({module:\'order_login\'})" href="<%  var _location = encodeURIComponent(location.href); if(location.host.indexOf(\'51ping\')!==-1){%>  http://m.51ping.com/bind?redir=<%= _location %> <%}else{%>http://m.dianping.com/bind?redir=<%= _location %><%}%>">绑定已有点评账号</a><%}%></h5><div class="order-box"><ul class="J_order_un_login hide"><li class="J_order_phone"><span class="infor">手机号&nbsp;</span><input id="J_phoneNum" class="nolog-input J_order_unbind_phone" style="width:40%" placeholder="请输入手机号" type="text" name="mobile"><a class="s-btn Right J_order_getCaptcha"  href="javascript:void(0)">获取验证码</a><a class="g-btn Right J_order_getCaptcha_ing hide"  href="javascript:void(0)"></a></li><li class="J_order_verify_code"><span class="infor">验证码&nbsp;</span><input class="nolog-input J_code_input" placeholder="请输入验证码" type="text" name="mobile"></li></ul><ul class="J_order_login hide"><li class="J_order_bind_phone"></li></ul></div></div><div class="Box J_order_delivery hide"><h5>收货地址</h5><div class="order-box"><ul><li class="J_delivey_order hide"></li><li class="no-p"><a class="fill arrow J_deliver_save" href="javascript:void(0)"><span class="info J_delivey_alert">更改收货地址</span><i class="arrow-ent right"></i></a></li></ul></div></br><h5>配送要求</h5><div class="nom-box"><select class="test-select J_delivery_type" name="deliverTime"><%_.each(deliveryType,function(item){%><option value="<%= item.id %>"><%= item.name %></option><% }); %></select></div><br/><div class="order-box"><ul><li class=""><span class="infor">备注：</span><input id="" class="nolog-input J_order_text" style="width:60%" placeholder="在此填写特殊配送要求" type="text" name="mobile"></li><% if(hasReceipt){ %><li><span class="infor">发票抬头：</span><input id="" class="nolog-input J_order_receipt" style="width:60%" placeholder="在此填发票抬头" type="text" name="mobile"></li><%}%></ul></div></div><div class="Box"><a onclick="ThisApp.mv({module:\'order_submit\'})" href="javascript:void(0)" id="J_order_submit" type="submit" class="y-btn  J_order_submit" name=""  style="width:95%;margin:0 auto;">提交订单</a><a href="javascript:void(0)" id="J_un_order_submit" type="submit" class="n-btn  hide J_un_order_submit" name=""  style="width:95%;margin:0 auto;">正在处理</a></div><div style="height:50px;width:100%"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@latest/js/entities/getuserprofilegn", ["backbone@~1.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@latest/js/entities/deliverylist", ["backbone@~1.1.0","underscore@~1.5.0"], function(require, exports, module) {
var Backbone = require('backbone');
var _ = require('underscore');

var DeliveryModel = Backbone.Model.extend({

    url: '/ajax/tuan/deliverylistgn.json?',

    initialize:function(options){


        this.fetch();

    },
    parse: function(res) {
        var data = res.data;

        var index = data.list && data.list.length ? (localStorage["deliveryIndex"] ||  0) : -1;

        data.list = data.list || [];

        return _.extend(data,{indexSelected:index});
    }
});
exports.DeliveryModel = DeliveryModel;




}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@latest/js/entities/city", ["wepp@~2.7.0","backbone@~1.1.0","underscore@~1.5.0"], function(require, exports, module) {
var Url = require('wepp').Url;
var Backbone = require('backbone');
var _ = require('underscore');

var KEY = {
    ID:"cityid",
    ENNAME: "cityenname",
    NAME:"cityname"
};

var urlEnable = true;

var City = {
    getId:function(){
        //如果url上传了city，就用url的，如果没有就读localStorage的，如果没有就1
        var urlCityId = Url.get(KEY.ID);
        if(urlEnable && urlCityId!== null){
            localStorage.setItem(KEY.ID,urlCityId);
            return urlCityId;
        }else {
            return localStorage.getItem(KEY.ID) || 1;
        }
    },
    getEnName:function(){
        var urlCityName = Url.get(KEY.ENNAME);
        if(urlEnable && urlCityName!== null){
            localStorage.setItem(KEY.ENNAME,urlCityName);
            return urlCityName;
        }else {
            return localStorage.getItem(KEY.ENNAME) || 'shanghai';
        }
    },
    getName:function(){
        var urlCityName = Url.get(KEY.NAME);
        if(urlEnable && urlCityName!== null){
            localStorage.setItem(KEY.NAME,urlCityName);
            return urlCityName;
        }else {
            return localStorage.getItem(KEY.NAME) || '上海';
        }
    },
    setId:function(id){
        //once set cityid , unable the url 'cityid' param
        localStorage.setItem(KEY.ID,id);
        urlEnable = false;
    },
    setEnName:function(name){
        localStorage.setItem(KEY.ENNAME,name);
        urlEnable = false;
    },
    setName:function(name){
        localStorage.setItem(KEY.NAME,name);
        urlEnable = false;
    },
    set:function(obj){
        obj.id && this.setId(obj.id);
        obj.enname && this.setEnName(obj.enname);
        obj.name && this.setName(obj.name);
        this.trigger('change');
    }
};
_.extend(City,Backbone.Events);

module.exports = City;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@latest/js/pages/order", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/order/content/controller","../modules/order/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var content = require('../modules/order/content/controller');

var OrderController = Marionette.Controller.extend({
    show:function(gId,dId){
        var self =  this;
        self.contentController = new content({groupId:gId,dealId:dId});
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/order/layout.html")),
                regions:{
                    'header': '.J_header',
                    'content': '.J_cnt'
                }
            });
            self.contentController.show(page.layout.content);
        });
    }
});

exports.Controller = OrderController;




}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});