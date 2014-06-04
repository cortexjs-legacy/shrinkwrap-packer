define("unit-m-weixin@1.12.5/js/modules/paypromo/content/controller", ["backbone@~1.1.0", "underscore@~1.5.0", "wepp@~2.7.0", "../../../util/cache", "zepto-wepp@~1.1.0", "cookie@~0.1.0", "./template.html"], function(require, exports, module) {
var Backbone = require('backbone');
var _ = require('underscore');
var Wepp = require('wepp');
var Cache = require('../../../util/cache');
var $ = require('zepto-wepp');
var City = Wepp.Module.City;
var Cookie = require('cookie');
var UI = Wepp.UI;

module.exports = Wepp.Module.BaseController.extend({
    initModel:function(){
        var data = Cache.get('CounponListCache') || {discountList:[]};
        data.discountList.forEach(function(item){
            var time = new Date(item.expiredDate);
            item.expiredDate = time.getFullYear()+"-"+ (time.getMonth()+1) + "-" + time.getDate();
        });
        var model = new (Backbone.Model.extend())(data);

        model.fetch = function(){
            setTimeout(function(){
                model.set({
                    r:Math.random()
                });
            },0);
        };

        this.result = {
            couponType:"",
            discountId:"",
            discount:""
        };

        return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    onRender:function(){
        var el = this.view.$el;
        var self = this;
        el.find('.J_list .item').on('click',function(){
            el.find('input[type=radio]').removeAttr('checked');
            var radio = $(this).find('input[type=radio]').attr('checked','true');
            if($(this).find('.promo-code').length === 0){
                //优惠券
                var coupon = self.model.get('discountList').filter(function(item){
                    return item.id == radio.val();
                });
                if(coupon && coupon.length){
                    self.result = {
                        couponType:"coupon",
                        discountId:coupon[0].id,
                        discount:coupon[0].priceStr
                    };
                }else {
                    self.result = {
                        couponType:"",
                        discountId:"",
                        discount:""
                    };
                }
            }
        });

        el.find('.J_submit').on('click',function(){
            //确认
            if(!self._checkCode()){
                return;
            }
            ThisApp.execute("promo::update",self.result);
            history.go(-1);
        });
    },
    _checkCode:function(){
        //验证优惠代码
        var self = this;
        var model = self.model;
        var el = this.view.$el;
        var _result = true;

        var codeInput = el.find(".promo-code");

        if(el.find(".code-select").attr("checked")){
            var _val = codeInput.val().trim();
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
                        groupid : model.get("dealGroupId"),
                        dealid : model.get("dealId"),
                        count : model.get("count"),
                        cityid: City.getId(),
                        code: _val
                    },
                    type:"GET",
                    async:false,
                    dataType:"json",
                    success:function(res){
                        if(res.code == 200){
                            self.result.discountId = res.data.id;
                            self.result.discount = res.data.priceStr;
                            self.result.discountType = "code";
                            // codeInput.val("");
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
define("unit-m-weixin@1.12.5/js/modules/paypromo/content/template.html", [], function(require, exports, module) {
module.exports = '<p class="c-box-tit">选择您要使用的优惠，无效抵用券将不会显示</p><div class="c-box promo-list J_list"><div class="item">不使用优惠<input type="radio" name=\'promo\' checked></div><%_.each(discountList,function(item){%><div class="item J_promo"><p><%= item.title %></p><p><%= item.expiredDate %>&nbsp;&nbsp;过期</p><input type="radio" name=\'promo\' value="<%=item.id%>"></div><%});%><div class="item"><input class="promo-code" type="text" placeholder="填写优惠代码"><input class=\'code-select\' type="radio" name=\'promo\' value="coupon"></div></div><a href="javascript:;" class="y-btn J_submit"  style="width:90%">确认</a><a href="javascript:;" class="y-btn J_submiting hide"  style="width:90%">正在处理</a><div class="height-box"></div>'

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
define("unit-m-weixin@1.12.5/js/pages/paypromo", ["zepto-wepp@~1.1.0", "underscore@~1.5.0", "wepp@~2.7.0", "../modules/paypromo/content/controller"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Wepp = require('wepp');

var Content = require('../modules/paypromo/content/controller');

exports.Controller = Wepp.PageController.extend({
    show:function(){
        var self =  this;
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template('<div class="J_cnt"></div>'),
                regions:{
                    'content': '.J_cnt'
                }
            });
            (new Content()).render(page.layout.content);

        });
    }
});



}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});