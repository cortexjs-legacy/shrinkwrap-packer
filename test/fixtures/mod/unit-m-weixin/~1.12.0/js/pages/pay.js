define("unit-m-weixin@~1.12.0/js/modules/common/alert/template.html", [], function(require, exports, module) {
module.exports = '<div class="overlay"></div><div class="confirm_alert"><div class="alert_content"><%=content%></div><div class="alert_buttons"><%buttons.forEach(function(btn){%><a href="<%=(btn.url||\'javascript:;\')%>"><%=btn.text%></a><%});%></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/layout.html", [], function(require, exports, module) {
module.exports = '<div class="neworder"><div class="J_deal"></div><div class="J_pay"><div class="loading" style="height:140px;"></div></div><div class="J_mobile"></div><div class="J_delivery"></div><div class="J_submit"></div><div class="height-box"></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/entities/detail", ["backbone@~1.1.0","../base/weixin","wepp@~2.7.0","./dealstatus"], function(require, exports, module) {
var Backbone = require('backbone');
var Weixin = require('../base/weixin');
var ENV = require('wepp').ENV;

var DealStatus = require("./dealstatus");

module.exports = Backbone.Model.extend({
    initialize: function(param) {
        this.param = param;
        this.setUrl();
        this.fetch();
    },
    baseUrl: '/ajax/tuan/dealgn.json?',
    setUrl: function() {
        this.url = this.baseUrl + 'id=' + this.param.id + '&cityid=' + this.param.cityid+(window.HIPPO_DATA&&window.HIPPO_DATA.request_id?"&rid="+window.HIPPO_DATA.request_id:"");
    },
    parse: function(res){
        var data = res.data;
        data.price = data.price.toString().indexOf('.')!==-1?(+data.price).toFixed(2):data.price;
        data.status = this.getDealStatus(data.status);
        data.time = this.getTime(data, data.status);
        data.yuyue = data.tag===1;

        var gotoUrl,nextUrl,originGoToUrl;
        var deals = data.dealSelects;
        if(deals.length==1){
            originGoToUrl = gotoUrl = '#order~g_'+data.id+'~d_'+deals[0].id;
        }else {
            originGoToUrl = gotoUrl = "#dealselect~g_"+data.id;
        }

        if(Weixin.isInWeixin() && !ThisApp.isLogin){
            //如果是在微信里面,并且未登录，需要调到open.qq登录
            gotoUrl = encodeURIComponent(location.href.replace(/#[\w\W]+/,'')+gotoUrl);
            nextUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='+ENV.get('appid')+'&redirect_uri='+ENV.get('cpsUrl')+'/weiXinRedirect&response_type=code&scope=snsapi_base&state='+gotoUrl+'#wechat_redirect';
        }else {
            nextUrl = gotoUrl;
        }

        data.nextUrl = nextUrl;
        data.originGoToUrl = originGoToUrl;

        //extra
        data.extra = (data.extra || []).map(function(item) {
            return {
                title: item.id,
                cont: item.name.replace(/\n/g, '<br/>'),
                red: item.type == 4
            };
        });

        //shopNum
        data.shopNum = data.shopIdsStr?data.shopIdsStr.split(',').length:0;

        //已选套餐
        if(this.param.selectId){
            var self = this;
            data.selectDeal = (data.dealSelects.filter(function(deal){
                return deal.id == self.param.selectId;
            }) || [])[0];
        }
        //预设count
        data.count = data.buyMixCount;

        return data;
    },
    getDealStatus: function(status) {
        if(DealStatus.isSellOut(status)) {
            return 1; //已卖光
        } else if(DealStatus.isEnd(status)) {
            return 2; //已结束
        } else if(DealStatus.isCantBuy(status)) {
            return 3; //无法购买
        } else if(DealStatus.isToBegin(status)) {
            return 4; //尚未开始
        } else {
            return 0; //正常
        }
    },
    getTime: function(data, status) {
        var time;
        if (status == 1 || status == 2 || status == 4) {
            var date = new Date(data.time)
            time = date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日";
            if(status == 4) {
                time = "开始于" + time + date.getHours() + ":" + date.getMinutes();
            } else {
                time = "结束于" + time;
            }
        } else {
            var seconds = data.time - (new Date()).getTime(),
            days = seconds / 86400000;
            if( days >= 3) {
                time = "剩余3天以上";
            } else if(days >= 1 && days < 3) {
                time = "剩余" + parseInt(days) + "天";
            } else {
                var day = parseInt(days),
                hour = parseInt(seconds / 3600000 - day * 24),
                minute = parseInt(seconds / 60000 - day * 1440 - hour * 60);
                time = "剩余" + (day > 0 ? (day + "天") : "") + hour + "小时" + minute + "分";
            }
        }

        return time;
    }
});



}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/dealinfo/template.html", [], function(require, exports, module) {
module.exports = '<div class="titles"><h3><%= selectDeal.title %></h3><div><span class="support Left"><% if(refund){%><i class="icon-s"></i>支持随时退</span><span class="support Left"><i class="icon-s"></i>支持过期退</span><%}else{%><i class="icon-e"></i>不支持随时退</span><span class="support Left"><i class="icon-e"></i>不支持过期退</span><%}%></div></div><div class="c-box"><% if(dealType != 3){%><div class="item">单价：<span class="Right">¥<%= selectDeal.priceStr %></span></div><div class="item">数量：<%if(buyMixCount != 1){%>(至少买<%=buyMixCount%>份)<%}%><%if(isLimitPerUser){%>(可购买<%=buyLimit%>份)<%}%><span class="Right"><a onclick="ThisApp.mv({module:\'order_reducenum\'})" class="op J_delete <%=count<=buyMixCount?\'dis\':\'\'%>" href="javascript:;">-</a><input readonly type="text" value="<%=count%>" class="buy-cnt"><a onclick="ThisApp.mv({module:\'order_addnum\'})" class="op J_add <%=count>=buyLimit?\'dis\':\'\'%>" href="javascript:;" >+</a></span></div><div class="item">总价：<span class="Right">¥<%=(count*selectDeal.priceStr).toFixed(2)%></span></div><%}%></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/delivery/controller", ["wepp@~2.7.0","../../../entities/delivery","../../../util/cache","./template.html"], function(require, exports, module) {
/*
 *  配送地址模块
 * */
var Wepp = require('wepp');
var Delivery = require('../../../entities/delivery');
var Cache = require('../../../util/cache');

/*
 * 如果没有登录，地址就存在model.temp中
 * 如果有登录，就用deliveryid
 *
 * */
module.exports = Wepp.Module.BaseController.extend({
    initModel:function(dealModel){
        var model = new Delivery();
        model.set('deliveryType',dealModel.get('deliveryType'));
        model.set('temp',false);
        return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    ready:function(){
        return this._check();
    },
    _check:function(){
        if((this.model.get('temp') && this.model.get('temp').showAddress) || this.model.get('select')){
            return true;
        }else {
            Wepp.UI.alert('请先填写地址');
            return false;
        }
    },
    getData:function(){
        var data = {};
        var select = this.model.get('select');
        if(select){
            if(select.id){
                data = {
                    deliveryid:select.id
                };
            }else {
                data = select;
            }
        }else if (this.model.get('temp')){
            data = this.model.get('temp');
        }
        data.deliverytype = this.view.$el.find('select').val();
        data.memo = this.view.$el.find('.invoice').val() || "";
        return data;
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/mobile/template.html", [], function(require, exports, module) {
module.exports = '<%if(isLogin && mobilePhone){%><div class="c-box"><div class="item">您绑定的手机号<span class="Right"><%=mobilePhoneMasked%></span></div></div><%}%><%if(hasThirdCookie && !isLogin){%><div class="c-box"><a class="item" href="<%=bindUrl%>">绑定点评账号<i class="arrow-ent"></i></a></div><%}%><%if((isLogin&&needMobile&&!mobilePhone) || (!isLogin&&(needMobile||!hasThirdCookie))){%><p class="c-box-tit"><b style="color:red">*</b> 绑定手机号</p><div class="c-box mobile-bind"><div class="item">手机号&nbsp;<input class="J_mobile_input com-input" placeholder="请输入您的手机号" type="number"><div class="send"><a class="J_send"  href="javascript:;">获取验证码</a><a class="J_sending dis hide" href="javascript:;"></a></div></div><div class="item">验证码&nbsp;<input class="J_code_input com-input" placeholder="请输入短信验证码" type="number"></div></div><%}%>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/entities/payment", ["wepp@~2.7.0","zepto-wepp@~1.1.0","backbone@~1.1.0"], function(require, exports, module) {
/*
 * 获取支付信息的接口
 *
 * */
var Wepp = require('wepp');
var $ = require('zepto-wepp');

module.exports = require('backbone').Model.extend({
    url:function(){
        return Wepp.ENV.get('payDomain')+'/ajax/tuan/createordermm.jsonp?random='+(+new Date())+'&channel=weixin&groupid='+this.get('dealGroupId')+"&dealid="+this.get('dealId')+"&cityid="+Wepp.Module.City.getId();
    },
    parse:function(res){
        var d = res.data;
        d.dealDiscount = 0;
        d.isLogin = !!d.userId;
        return d;
    },
    fetch:function(){
        //jsonp
        var self = this;
        $.ajax({
            url:this.url(),
            dataType:"jsonp",
            success:function(res){
                if(res.code===200){
                    self.set(self.parse(res));
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
define("unit-m-weixin@~1.12.0/js/modules/pay/payment/template.html", [], function(require, exports, module) {
module.exports = '<div class="c-box"><%if(originPrice && isLogin && canUseDiscount){%><a class="item" href="#paypromo">优惠代码<%=discountList&&discountList.length?\'/抵用券\':\'\'%><%if(discount){%><span class="Right">￥<%=discount%></span><%}else{%><i class="arrow-ent"></i><%}%></a><%}%><%if(dealDiscount || payDiscount){%><div class="item">立减<span class="Right">￥<%=((+dealDiscount||0)+(+payDiscount||0)).toFixed(2)%></span></div><%}%><div class="item hl"> 还需支付<span class="Right">￥<%=needToPay.toFixed(2)%></span><%if(originPrice && payDiscount){%><%if(paymentType && paymentType[0] && paymentType[0].highlightTitle){%><%if(paymentType[0].highlightTitle){%><p class="paytip"><%=paymentType[0].highlightTitle%></p><%}%><%if(paymentType[0].subTitle){%><p class="paytip"><%=paymentType[0].subTitle%></p><%}}%><%}%></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/submit/template.html", [], function(require, exports, module) {
module.exports = '<a href="javascript:;"  class="y-btn J_submit" style="width:95%;margin:0 auto;">微信支付</a><a href="javascript:;"  class="n-btn J_submiting hide" style="width:95%;margin:0 auto;">正在处理</a>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/common/alert/controller", ["wepp@~2.7.0","./template.html","backbone@~1.1.0","marionette@~1.4.0","underscore@~1.5.0","zepto-wepp@~1.1.0"], function(require, exports, module) {
var View = require('wepp').Module.BaseView(require('./template.html'));
var Backbone = require('backbone');
var Marionette = require('marionette');
var _ = require('underscore');
var $ = require('zepto-wepp');

module.exports = Marionette.Controller.extend({
    initialize:function(attrs){
        /*
        * attrs 包含以下属性
        *
        * content: 提示框的内容
        * buttons: 数组， 2个按钮的配置 ,每个button可以有如下属性
        * {
        *   text:按钮的文本,
        *   url:按钮的链接,
        *   click:按钮的click实际
        * }
        *
        * */
        var self=  this;
        this.view = new View({
            model:new Backbone.Model(attrs)
        });
        this.view.render();
        this.box = this.view.$el.hide().appendTo('body');

        this.box.find('.alert_buttons a').each(function(i,btn){
            if(attrs.buttons[i].click){
                $(btn).on('click',attrs.buttons[i].click);
            }
        });

        if(attrs.buttons && attrs.buttons.length===1){
            this.box.find('.alert_buttons a').css('width','100%');
        }
    },
    show:function(){
        this.box.show();
        var box = this.box.find('.confirm_alert');
        box.css('margin-top',-box.height()/2);
    },
    hide:function(){
        this.box.hide();
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/submit/controller", ["wepp@~2.7.0","../../../util/ajax","backbone@~1.1.0","./template.html","../../common/alert/controller"], function(require, exports, module) {
var Wepp = require('wepp');
var Ajax = require('../../../util/ajax');
var UI = Wepp.UI;

module.exports = Wepp.Module.BaseController.extend({
    initModel:function(options){
        this.pageController = options.pageController;
        return new (require('backbone').Model.extend())();
    },
    initTpl:function(){
        return require('./template.html');
    },
    onRender:function(model,view){
        var self = this;
        self.btn = view.$el.find('.J_submit');
        self.unBtn = view.$el.find('.J_submiting');
        self.btn.on('click',function(){
            self.pageController.message('try:submit',function(data){
                //抛出事件给页面，页面各个模块都ok的时候，传回数据
                if(data){
                    self.submit(data);
                }
            });
        });
    },
    render:function(region){
        this.region = region;
        return this;
    },
    submit:function(postData){
        this.unBtn.removeClass('hide');
        this.btn.addClass('hide');
        var self = this;
        Ajax({
            url:Wepp.ENV.get('payDomain')+'/ajax/tuan/confirmordermm.jsonp?random='+(+new Date())+'&'+Wepp.Url.stringify(postData),
            dataType:'jsonp'
        },{},{
            finish:function(){
                self.btn.removeClass('hide');
                self.unBtn.addClass('hide');
            },
            200:function(data){
                if(data.needReconfirm){
                    //有立减或者可用抵用券
                    self.reconfirm(data,postData);
                    return;
                }
                if(data.flag === 0){
                    //不需要第三方支付
                    ThisApp.redirect("#paysuc~"+data.returnID);
                }else{
                    self.weixinPay(JSON.parse(data.content),data.returnID);
                }
            }
        });
    },
    weixinPay:function(data,orderId){
        //call weixin
        var _match = navigator.userAgent.match(/MicroMessenger\/([^\.]+)/);

        if(_match&&(parseInt(_match[1])>4)){
            //微信版本大于4

            WeixinJSBridge.invoke('getBrandWCPayRequest',data,function(res){
                if(res.err_msg == "get_brand_wcpay_request:ok"){
                    ThisApp.redirect("#paysuc~"+orderId);
                }else if(res.err_msg == "get_brand_wcpay_request:cancel"){
                    UI.alert("支付取消");
                }else{
                    UI.alert("支付失败");
                }
            });
        }else{
            UI.alert("您的微信版本过低，不能使用支付功能，请升级客户端版本。");
        }
    },
    reconfirm:function(data,postData){
        var Confirm = require('../../common/alert/controller');
        var content = '<div class="reconfirm">';
        var hasCounpon = false; //是否有可用 优惠券
        var self = this;

        if(data.reductionPrice){
            //有立减
            content += ('<p>'+data.reductionDesc+'</p>');
        }
        if(data.discountList && data.discountList.discountList && data.discountList.discountList.length && !postData.discount){
            //有可用优惠券 && 没有使用过优惠
            content += '<p>您有'+ data.discountList.discountList.length+'张优惠券可用:</p><ul class="coupon_list">';
            data.discountList.discountList.forEach(function(d,i){

                content+='<li><label><input type="radio" name="coupon" value="'+i+'" '+(i===0?'checked':"")+'>'+d.title+'</label></li>';
            });
            content+='</ul>';
            hasCounpon = true;
        }
        content+='</div>';
        var post = {
            channel:postData.channel,
            utm:postData.utm,
            dealid:postData.groupid,
            orderid: data.returnID,
            paymentamount:postData.paymentamount,
            paymenttype: postData.paymenttype,
            discountid: postData.discountid
        };

        var buttons = [{
            text:hasCounpon?"确定使用":"确定",
            click:function(){
                c.hide();
                if(hasCounpon){
                    //有优惠券
                    var index = c.view.$el.find('input[checked]').val();
                    var discountObj = data.discountList.discountList[index];
                    self.pageController.message('change:discount', discountObj ,function(needToPay){
                        post.paymentamount = needToPay;
                        post.discountid = discountObj.id;
                    });
                }

                if(data.reducePrice){
                    self.pageController.message('change:reduce',data.reducePrice,function(needToPay){
                        post.paymentamount = needToPay;
                    });
                }
                self.repay(post);
            }
        }];
        if(hasCounpon){
            //取消按钮
            buttons.push({
                text:"不使用",
                click:function(){
                    c.hide();
                    if(data.reducePrice){
                        self.pageController.message('change:reduce',data.reducePrice,function(needToPay){
                            post.paymentamount = needToPay;
                        });
                    }
                    self.repay(post);
                }
            });
        }

        var c = new Confirm({
            content:content,
            buttons:buttons
        });
        c.show();
        if(!hasCounpon){
            //2s后自动提交
            setTimeout(function(){
                buttons[0].click();
            },2000);

        }

    },
    repay:function(postData){
        //reconfirm之后 重新调用支付接口

        var self = this;

        Ajax({
            url:Wepp.ENV.get('payDomain')+'/ajax/tuan/confirmordergn.jsonp?random='+(+new Date())+"&"+Wepp.Url.stringify(postData),
            dataType:'jsonp'
        },{},{
            200:function(data){
                if(data.flag === 0){
                    //不需要第三方支付
                    ThisApp.redirect("#paysuc~"+postData.orderid);
                }else{
                    self.weixinPay(JSON.parse(data.content),postData.orderid);
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
define("unit-m-weixin@~1.12.0/js/entities/delivery", ["backbone@~1.1.0","underscore@~1.5.0"], function(require, exports, module) {
/*
 * 新支付页面地址model
* */
var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
    url: '/ajax/tuan/deliverylistgn.json?',

    parse: function(res) {
        if(res.code === 200){
            res.data.isLogin = true;
            res.data.select = res.data.list[0] || null;
            return res.data;
        }else {
            return {
                isLogin:false,
                select : null,
                list:[]
            };
        }
    }
});




}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/payment/controller", ["wepp@~2.7.0","../../../entities/payment","../../../util/cache","./template.html"], function(require, exports, module) {
var Wepp = require('wepp');
var Payment = require('../../../entities/payment');
var Cache = require('../../../util/cache');

module.exports = Wepp.Module.BaseController.extend({
    initModel:function(options){
        /*
        *  options 
        *  id,
        *  dealId
        * */
       this.options = options;
       var model = new Payment({
           dealGroupId:options.dealGroupId,
           dealId:options.dealId
       });
       model.set({
           discount:0,
           discountid:''
       });
       var self = this;

       //监听 dealModel的change，计算总金额
       this.dealModel = options.dealModel;
       options.dealModel.on('change',function(){
           self.checkModel(model);
           self._discountList();
       });
       model.on('change',function(model){
           self._discountList();
       });

       return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    onRender:function(){
        this._ready = true;
    },
    _caculate:function(){
        var model = this.model;
        var dealModel = this.dealModel;

        if(!model.get('paymentType') || !dealModel.get('count')){
            return false;
        }
        //计算各种金额

        //计算还需支付的金额

        //团单总金额 
        var total = dealModel.get('count') * dealModel.get('selectDeal').priceStr ;

        //团购立减，可能不满足条件
        var dealDiscount = 0;

        if(model.get('reductionAmountStr')&& model.get('reductionLimitStr') && total > +model.get('reductionLimitStr')){
            dealDiscount= model.get('reductionAmountStr');
            total -= dealDiscount;
        }


        //抵用券金额 或者 优惠代码 金额
        var discount = model.get('discount');

        //余额 暂不支持
        // var balance = +model.get('balanceStr');

        //支付立减，如果需要支付的 > 立减 ，就不减了
        var payDiscount = model.get('paymentType')[0].eventDiscountAmount;
        var payDiscountLimit  = model.get('paymentType')[0].eventLimitAmount;

        var needToPay = total - discount ;

        //还需支付金额大于支付立减，并且订单金额大于立减限额
        if(needToPay > payDiscount && total>payDiscountLimit){
            needToPay -= payDiscount;
        }else {
            payDiscount = 0;
        }

        needToPay = needToPay<0?0:needToPay;

        return {
            total:total,
            needToPay:needToPay,
            dealDiscount:dealDiscount,
            payDiscount:payDiscount
        };
    },
    checkModel:function(model){
        var money = this._caculate();
        if(!money){
            return false;
        }
        this.model.set({
            needToPay:money.needToPay,
            dealDiscount: money.dealDiscount,
            payDiscount:money.payDiscount,
            canUseBalance:this.dealModel.get('canUseBalance'),
            canUseDiscount:this.dealModel.get('canUseDiscount'),
            originPrice:+this.dealModel.get('selectDeal').priceStr
        });
        return true;
    },
    _discountList:function(){
        // 设置抵用券列表

        var money = this._caculate();
        if(!money){
            return ;
        }
        var model = this.model;

        var list = (model.get('discountList') ||[]).filter(function(item){
            //可用的抵用券列表
            return (+item.priceLimitStr) <= money.total;
        });

        Cache.set('CounponListCache',{
            discountList:list,
            count:this.dealModel.get('count'),
            dealGroupId:this.options.dealGroupId,
            dealId:this.options.dealId
        });

        //如果当前已选中的抵用券不在可用列表中了，去除掉
        var selectDiscountId = model.get('discountid');
        var notInList = selectDiscountId && model.get('discountType')=='coupon' && list.filter(function(item){
            return item.id== selectDiscountId;
        }).length ===0;

        if(notInList){
            model.set({
                discount:0,
                discountid:""
            });
        }
    },
    ready:function(){
        return !!this._ready;
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/delivery/template.html", [], function(require, exports, module) {
module.exports = '<div class="c-box-tit">送货信息</div><div class="c-box delivery"><%if(select || temp){var d=select || temp;var link=!isLogin?\'#deliveryadd~temp\':\'#deliverylist\'%><a class="item" style="padding-bottom:10px;padding-right:60px;" href="<%=link%>"><div class="memo"><%=d.receiver%> <%=d.phoneNo || d.phone%></div><div class="info"><%=d.showAddress%></p><p class="info"><%=d.postCode || d.postcode%></div><span class="arrow-txt">更改</span><span class="arrow-ent"></span></a><%}else{if(isLogin){%><a href="#deliveryadd~0" class="item">添加收货地址<span class="arrow-ent"></span></a><%}else{%><a href="#deliveryadd~temp" class="item">添加收货地址<span class="arrow-ent"></span></a><%}}%><div class="item">时间:<select><%deliveryType.forEach(function(t){%><option value="<%=t.id%>"><%=t.name%></option><%});%></select></div><div class="item">附言：<input type="text" placeholder="特殊配送要求，我们尽量满足" class="com-input invoice"></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/mobile/controller", ["underscore@~1.5.0","wepp@~2.7.0","zepto-wepp@~1.1.0","backbone@~1.1.0","cookie@~0.1.0","../../../util/ajax","./template.html"], function(require, exports, module) {
/*
 * 支付页面手机号模块
 * 不光是手机，用户登录相关的都在这里
 *
 * */

var _ = require('underscore');
var Wepp = require('wepp');
var $ = require('zepto-wepp');
// var UserProfile = require('../../../entities/userprofile');
var Backbone = require('backbone');
var UI = Wepp.UI;
var ENV = Wepp.ENV;
var Cookie = require('cookie');
var Ajax = require('../../../util/ajax');

function checkPhone(phone){
    return /^1\d{10}$/.test(phone);
}

module.exports = Wepp.Module.BaseController.extend({
    initModel:function(options){
        var self = this;
        var detail = options.dealModel;
        var payment = options.paymentModel;
        // var model = new UserProfile();
        var model = new (Backbone.Model.extend())();
        model.fetch = function(){};


        //等detail和payment都返回了才set
        //懒的用defer了
        var detailSet = false;
        var paymentSet = false;
        var set = function(){
            if(detailSet && paymentSet){
                var isLottery = detail.get("dealType") == 3;
                var isThird = !!detail.get("isThirdParty");
                var isZero = detail.get('price')==0;
                model.set({
                    isLottery:isLottery,
                    isThird:isThird,
                    isZero:isZero,
                    hasThirdCookie:Cookie("_thirdu.c") || false, //第三方登录预埋cookie
                    needMobile:isLottery || isThird || isZero,
                    bindUrl:ENV.get('accountDomain')+'/bind?redir='+encodeURIComponent(location.href.replace('showwxpaytitle=1','showwxpaytitle=1&x')),
                    isLogin:payment.get('isLogin'),
                    mobilePhone:payment.get('phoneNO'),
                    mobilePhoneMasked:self.maskMobile(payment.get('phoneNO'))
                });
                if(model.get('isnewlogin')===undefined){
                    //没有设置过isnewlogin的，设置
                    //isnewlogin 是用来标记用户是否在获取信息的时候是未登录的，
                    //登录后可能会有新的优惠信息

                    model.set('isnewlogin', !payment.get('isLogin'));
                }
            }
        };
        detail.on('change',function(){
            detailSet = true;
            set();
        });
        payment.on('change',function(){
            paymentSet = true;
            set();
        });

        return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    onRender:function(model,view){
        var self = this;
        view.$el.find('.J_send').on('click',function(){
            self.sendCode();
        });
    },
    finish:function(cb){
        var model = this.model;
        var modelPhone = model.get('mobilePhone');
        var needMobile = model.get("needMobile");
        // 如果没登录就去登陆
        // 没有绑定手机号就去绑定
        if(!model.get('isLogin') ||(needMobile && !modelPhone)){
            this._login(cb);
        }else {
            if(modelPhone || !needMobile){
                cb(modelPhone || "");
            }else {
                UI.alert('请先绑定手机哦~');
            }
        }
    },
    _login:function(cb){
        /*
         *  login 或者 绑定手机号
         *
         * cb会接受到一个参数，用户手机号码
         *
         * */
        var checkResult = this._check();
        var self = this;
        var model = self.model;
        var modelPhone = model.get('mobilePhone');
        var needMobile = model.get("needMobile");
        var hasThirdCookie = model.get("hasThirdCookie");
        var isLogin = model.get('isLogin');
        var loginUrl;

        if(isLogin){
            model.set('isnewlogin',false);
        }

        if(isLogin && (!needMobile ||  modelPhone)){
            //已登录
            //已经绑定手机号的 或者 不需要手机号的
            cb(modelPhone || "");
            return;
        }

        if(checkResult){
            if(!isLogin){
                if(hasThirdCookie && needMobile){
                    loginUrl = "/ajax/account/mobiledynamiclogin/3";
                }else if(!hasThirdCookie){
                    loginUrl = "/ajax/account/mobiledynamiclogin/2";
                }else if(hasThirdCookie && !needMobile) {
                    loginUrl = "/ajax/account/thirdpartlogin";
                }
            }else if(!modelPhone){
                //已登录没有手机号码 手机号绑定
                loginUrl = '/ajax/tuan/BindPhonegn.json';
                checkResult.phone = checkResult.mobile;
                checkResult.code = checkResult.vcode;
                checkResult.callid = parseInt((Math.random()+"").substr(2,15));
            }
            Ajax(loginUrl,checkResult,{
                200:function(){
                    //切换到已登录模式
                    self.model.set({
                        'isLogin':true,
                        'mobilePhone':checkResult.mobile,
                        'mobilePhoneMasked':self.maskMobile(checkResult.mobile)
                    });
                    cb(checkResult.mobile);
                },
                other:function(data,res){
                    UI.alert((res.msg && res.msg.err) ||'出错啦，请稍后再试');
                }
            });
        }
    },
    _check:function(){
        var $el = this.view.$el;
        var model = this.model;
        var needMobile = model.get("needMobile");
        var hasThirdCookie = model.get("hasThirdCookie");
        var isLogin = model.get('isLogin');
        if((needMobile && !model.get('mobilePhone'))|| (!hasThirdCookie && !isLogin)){
            var code = $el.find(".J_code_input").val().trim();
            var phoneNo = $el.find(".J_mobile_input").val().trim();
            if(!checkPhone(phoneNo)){
                UI.alert("无效手机号");
                return false;
            }
            if(!code){
                UI.alert("验证码不能为空");
                return false;
            }
            return {
                mobile:phoneNo,
                vcode:code
            };
        }else{
            return { mobile:"", vcode:"" };
        }
    },
    ready:function(){
        return this._check();
    },
    setMobile:function(phone){
        //外面绑定完后设置手机号
        var maskedPhone = this.maskMobile(phone);
        this.model.set({
            mobilePhone:phone,
            mobilePhoneMasked:maskedPhone
        });
    },
    maskMobile:function(phone){
        if(phone){
            phone = phone.toString();
            return phone.slice(0,3)+"****"+phone.slice(7);
        }
        return '';
    },
    sendCode:function(){
        // 发送验证码
        // 这里有3种情况，
        // 一种是绑定手机号的
        // 一种是有第三方cookie 用手机直接登录的，
        // 一种是没有第三方cookie，用手机直接登录的

        var phoneNo = this.view.$el.find(".J_mobile_input").val().trim();
        if(!checkPhone(phoneNo)){
            UI.alert('无效的手机号');
            return ;
        }
        var self = this;
        var model = self.model;
        var sendAjaxUrl;
        if(model.get('isLogin')){
            //已登录的，是绑定手机号
            sendAjaxUrl= '/ajax/tuan/sendverifycodegn.json';
        }else if(model.get('hasThirdCookie')) {
            sendAjaxUrl = '/ajax/account/mobiledynamiclogincode/3';
        }else {
            sendAjaxUrl = "/ajax/account/mobiledynamiclogincode/2";
        }
        Ajax(sendAjaxUrl,{
            mobile:phoneNo,
            phone:phoneNo,
            callid:parseInt((Math.random()+"").substr(2,15)),
            rebind:1
        },{
            200:function(data){
                UI.alert("验证码已发送");
                self._timeout();
            }
        });
    },
    _timeout:function(){
        var $el = this.view.$el;
        var sendBtn = $el.find(".J_send").addClass("hide");
        var sendingBtn = $el.find(".J_sending").removeClass("hide").html("60秒后重发");

        var timer = setInterval(function(){
            var _time = parseInt(sendingBtn.html());
            if(_time == 1){
                clearInterval(timer);
                sendingBtn.addClass("hide");
                sendBtn.removeClass("hide");
            }
            sendingBtn.html((_time - 1)+"秒后重发");
        },1000);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/base/weixin", [], function(require, exports, module) {
var ua = navigator.userAgent;
exports.isInWeixin = function(){
    return /MicroMessenger/.test(ua);
};
exports.version = function(){
    var match = ua.match( /MicroMessenger\/(\d+\.\d+)/);
    try{
        if(match){
            return  Number(match[1]) || 0;
        }else {
            return 0;
        }
    }catch(e){
        return 0;
    }
};

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/pay/dealinfo/controller", ["wepp@~2.7.0","../../../util/cache","backbone@~1.1.0","../../../entities/detail","./template.html"], function(require, exports, module) {
var Wepp = require('wepp');
var Cache = require('../../../util/cache');
var Backbone = require('backbone');
var DealModel = require('../../../entities/detail');
var UI = Wepp.UI;

module.exports = Wepp.Module.BaseController.extend({
    initModel:function(options){
        /*
         * options :{
         *  dealGroupId
         *  dealId
         * }
         * */
        var model;
        var cache =Cache.get('DealCache');
        if( cache && cache.id==options.dealGroupId ){
            //有cache ， 使用cache
            model = new (Backbone.Model.extend({}))();
            //设置选择的套餐
            var selectDeal = (cache.dealSelects.filter(function(deal){
                return deal.id == options.dealId;
            }) || [])[0];
            cache.selectDeal = selectDeal;

            model.fetch = function(){
                setTimeout(function(){
                    model.set(cache);
                },0);
            };
            return model;
        }else {
            model = new DealModel({
                id:options.dealGroupId,
                cityid:Wepp.Module.City.getId(),
                selectId:options.dealId
            });
        }
        return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    onRender:function(model,view){
        var el = view.$el;
        var self = this;
        this._ready = true;

        el.find('.J_add').on('click',function(){
            self.changeAmount(model.get('count')+1);
        });
        el.find('.J_delete').on('click',function(){
            self.changeAmount(model.get('count')-1);
        });
    },
    changeAmount:function(num){
        var model = this.model;
        num = +num;
        var min = +model.get('buyMixCount');
        var max = +model.get('isLimitPerUser')?model.get('buyLimit'):9999;
        var $el = this.view.$el;
        if(num>max){
            // UI.alert("最多购买"+ max+"份哦~");
        }else if(num<min) {
            // UI.alert("最少购买"+ min+"份哦~");
        }else {
            this.model.set({ count:num });
        }
    },
    ready:function(){
        return !!this._ready;
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/entities/dealstatus", [], function(require, exports, module) {
    var Status = {
            getStr: function(status) {
                return status.toString(2).split("").reverse().join("");
            },
            isNew:function(status){
                var statusStr = this.getStr(status);
                return parseInt(statusStr[0]);
            },
            isSellOut: function(status) {
                var statusStr = this.getStr(status);
                return parseInt(statusStr[1]);
            },
            isEnd: function(status) {
                var statusStr = this.getStr(status);
                return parseInt(statusStr[2]);
            },
            isCantBuy: function(status) {
                var statusStr = this.getStr(status);
                return parseInt(statusStr[3]);
            },
            isToBegin: function(status) {
                var statusStr = this.getStr(status);
                return parseInt(statusStr[4]);
            },
            isNormal: function(status) {
                var statusStr = this.getStr(status);
                return parseInt(statusStr[5]);
            }
        };

    module.exports = Status;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/util/cache", [], function(require, exports, module) {
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
define("unit-m-weixin@~1.12.0/js/util/ajax", ["wepp@~2.7.0","zepto-wepp@~1.1.0","underscore@~1.5.0"], function(require, exports, module) {
/*
 * 封装下$.ajax
 * 根据code处理
 * 用POST
 * */

var UI = require('wepp').UI;
var $ = require('zepto-wepp');
var _ = require('underscore');

var uiAlert = function(res){
    UI.alert(res.data.content,2000);
};

module.exports = function(url,data,callbacks){
    /*
     * url can be string or object
     * if is object , merge to ajax param
     * */
    var ajaxParam = {
        url:'',
        data:data ||{},
        type:"POST",
        dataType:"json",
        success:function(res){
            callbacks['finish'] && callbacks['finish']();
            callbacks['success'] && callbacks['success'](res.data);
            var code = res.code;
            if(code===200){
                callbacks['200'](res.data);
            }else {
                if(callbacks['other']){
                    callbacks['other'](res.data,res);
                }else if(callbacks[code]){
                    callbacks[code](res.data);
                }else {
                    uiAlert(res);
                }
            }
        },
        error:function(){
            callbacks['finish'] && callbacks['finish']();
            UI.alert('网络出错,请稍后再试哦~');
        }
    };
    if(typeof url ==="string"){
        ajaxParam.url = url;
    }else {
        _.extend(ajaxParam,url);
    }
    $.ajax(ajaxParam);
};

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/pages/pay", ["zepto-wepp@~1.1.0","underscore@~1.5.0","wepp@~2.7.0","../util/cache","../modules/pay/dealinfo/controller","../modules/pay/mobile/controller","../modules/pay/payment/controller","../modules/pay/submit/controller","../modules/pay/delivery/controller","../modules/pay/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Wepp = require('wepp');
var Cache = require('../util/cache');
var DealInfo = require('../modules/pay/dealinfo/controller');
var Mobile = require('../modules/pay/mobile/controller');
var Payment = require('../modules/pay/payment/controller');
var Submit = require('../modules/pay/submit/controller');
var Delivery = require('../modules/pay/delivery/controller');

var payment;
var delivery;

exports.Controller = Wepp.PageController.extend({
    initialize:function(){
        var self = this;
        this.onMessage('try:submit',function(cb){
            //尝试提交,
            //check 各个模块是否ok
            if(self.allReady()){
                //登录
                self.mobile.finish(function(mobile){
                    var data = {
                        dealid:self.deal.model.get('selectDeal').id,
                        groupid:self.deal.model.get('id'),
                        count:self.deal.model.get('count'),
                        channel:'weixin',
                        utm:Wepp.Url.get('utm'),
                        paymentamount:payment.model.get('needToPay'),
                        paymenttype:  payment.model.get('paymentType')[0].id,
                        discountid:   payment.model.get('discountid')||"",
                        phoneNo:mobile || "",
                        cityid:Wepp.Module.City.getId(),
                        isnewlogin:self.mobile.model.get('isnewlogin')||false
                    };

                    if(self.hasDelivery){
                        _.extend(data,delivery.getData());
                    }
                    cb(data);
                });
            }
        });
        this.onMessage('login',function(login){
            payment && payment.set('isLogin',login);

        });
        this.onMessage('change:discount',function(discount,cb){
            payment.model.set({
                discountid:discount.id,
                discount:discount.priceStr
            });
            cb(payment.model.get('needToPay'));
        });
        this.onMessage('change:reduce',function(reduce,cb){
            payment.model.set({
                reductionAmountStr:reduce,
                reductionLimitStr:'0.0'
            });
            cb(payment.model.get('needToPay'));
        });

        ThisApp.commands.setHandler("promo::update",function(result){
            payment && payment.model.set({
                discount:result.discount,
                discountid:result.discountId,
                discountType:result.couponType
            });
        });
        ThisApp.commands.setHandler("temp::delivery::add",function(data){
            delivery && delivery.model.set('temp',data);
        });
        ThisApp.commands.setHandler("delivery::update",function(data){
            if(delivery){
                if(data.id){
                    delivery.model.set({
                        temp:false,
                        select:data
                    });
                }else {
                    delivery.model.set({
                        temp:data,
                        select:false
                    });

                }
            }
        });
        ThisApp.commands.setHandler('delivery::add',function(data){
            delivery && delivery.model.set('select',data);
        });

        self.hasDelivery = false; //是否需要配送地址
    },
    show:function(gId,dId){
        var self =  this;
        ThisApp.openPage().then(function(page){
            self._region(page);
            var param = {
                dealGroupId:gId,
                dealId:dId
            };

            //团购单信息
            var dealInfo = self.deal = new DealInfo(param);
            var dealModel = dealInfo.model;
            dealInfo.render(page.layout.deal);

            //支付相关信息
            payment = (new Payment(_.extend(param,{dealModel:dealModel}))).render(page.layout.payment);

            //手机号信息
            self.mobile = (new Mobile({
                dealModel:dealModel ,
                paymentModel:payment.model
            })).render(page.layout.mobile);

            //提交模块
            var submit = self.submit = (new Submit({
                pageController:self
            })).render(page.layout.submit);
            payment.model.once('change',function(){
                submit.model.set('show',true); //trigger change
            });

            //地址模块
            dealModel.once('change',function(){
                if(dealModel.get('dealType') == 2){
                    //实物单
                    self.hasDelivery = true;
                    delivery = new Delivery(dealModel);
                    delivery.render(page.layout.delivery);
                }
            });
        });
    },
    _region:function(page){
        page.initRegion({
            template:_.template(require('../modules/pay/layout.html')),
            regions:{
                deal:'.J_deal',
                payment:'.J_pay',
                mobile:'.J_mobile',
                delivery:'.J_delivery',
                submit:'.J_submit'
            }
        });
    },
    allReady:function(){
        //检测所有的模块是不是都ready了
        return payment.ready() && this.deal.ready() && ((this.hasDelivery && delivery.ready()) ||!this.hasDelivery);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});