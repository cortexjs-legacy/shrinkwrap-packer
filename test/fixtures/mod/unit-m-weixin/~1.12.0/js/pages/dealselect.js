define("unit-m-weixin@~1.12.0/js/modules/dealselect/content/controller", ["wepp@~2.7.0","../../../util/cache","backbone@~1.1.0","../../../entities/detail","./template.html"], function(require, exports, module) {
var Wepp = require('wepp');
var Cache = require('../../../util/cache');
var Model = require('backbone').Model.extend();

module.exports = Wepp.Module.BaseController.extend({
    initModel:function(options){
        var cache = Cache.get('DealCache');
        if(cache && cache.id === options.groupId){
            //有cache
            var model  = new Model(cache);
            model.fetch = function(){
                setTimeout(function(){
                    model.set('r',1);
                });
            };
            return model;
        }else {
            return new (require('../../../entities/detail'))({
                id:options.groupId,
                cityid:Wepp.Module.City.getId()
            });
        }
    },
    initTpl:function(){
        return require('./template.html');
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/dealselect/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_cnt"><div>'

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
define("unit-m-weixin@~1.12.0/js/modules/dealselect/content/template.html", [], function(require, exports, module) {
module.exports = '<p class="c-box-tit">请选择套餐</p><div class="c-box dealselect"><%dealSelects.forEach(function(item){if(item.status == 1){%><a class="item mult" style="padding-right:100px;" href="#order~g_<%=id %>~d_<%=item.id%>" onclick="ThisApp.mv({module:\'order_choice\'})"><%= item.title %><span class="arrow-txt">￥<%=item.priceStr%></span><i class="arrow-ent"></i></a><% }else if(item.status == 2){ %><div class="item mult"><span class="Orange">[已卖光]</span><%=item.title %></div><% }}); %></div><div class="height-box"></div>'

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
define("unit-m-weixin@~1.12.0/js/pages/dealselect", ["zepto-wepp@~1.1.0","underscore@~1.5.0","wepp@~2.7.0","../modules/dealselect/content/controller","../modules/dealselect/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Wepp = require('wepp');

var content = require('../modules/dealselect/content/controller');

exports.Controller = Wepp.PageController.extend({
    show:function(gId){
        var self =  this;
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/dealselect/layout.html")),
                regions:{
                    'header': '.J_header',
                    'content': '.J_cnt'
                }
            });
            (new content({groupId:gId})).render(page.layout.content);
        });
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});