define("unit-m-weixin@~1.12.0/js/modules/refund/button/template.html", [], function(require, exports, module) {
module.exports = '<div class="refund-btn J_buy"><%if(submiting){%><a href="javascript:void(0)" class="n-btn">正在处理</a><%}else{%><a href="javascript:void(0)" class="y-btn J_submit" style="">确认退款</a><%}%></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/base/share", ["wepp@~2.7.0","underscore@~1.5.0","zepto-wepp@~1.1.0"], function(require, exports, module) {
var Url = require('wepp').Url;
var config = {
    "appid":'wx841a97238d9e17b2',
    "img_url":'',
    "img_width":"640",
    "img_height":"640",
    "link":'',
    "desc":'',
    "title":'',
    "timelineTitle":""
};
var _ = require('underscore');

var enable = false;

var binded = false;
function linkPre(){
    //把url加上 utm=wxshare
    var match = config.link.match(/\?([^#$]*)/),
    param = {};
    if(match){
        param = Url.parse(match[1]);
    }
    param.utm = 'wxshare';

    var link = config.link.replace(/(\?[^#$]*)/,'');

    config.link = link.replace(/((:?#[\w\W]*)|$)/,function(w,w1){
        return '?'+Url.stringify(param)+w1;
    });
    console.log(config.link);
}

function bindShare(){
    if(binded){
        return;
    }
    if(window.WeixinJSBridge){
        binded = true;
        //分享好友
        WeixinJSBridge.on('menu:share:appmessage', function(argv){
            if(enable){
                //交给每个页面自己去控制要不要设置分享的具体内容
                linkPre();
                WeixinJSBridge.invoke('sendAppMessage',config, function(res) {});
            }
        });

        //分享朋友圈
        WeixinJSBridge.on('menu:share:timeline', function(argv){
            if(enable){
                linkPre();
                var cfg = _.clone(config);
                cfg.title = cfg.timelineTitle || cfg.title;
                WeixinJSBridge.invoke('shareTimeline',cfg, function(res) {});
            }
        });

        //去除导航
        if(require('zepto-wepp').os.ios){
            WeixinJSBridge.call('hideToolbar');
        }
    }
}
bindShare();
document.addEventListener('WeixinJSBridgeReady', bindShare, false);


module.exports= {
    config:function(mycfg){
        config = _.extend(config,mycfg);
    },
    enable:function(isEnable){
        enable = isEnable;
        try{
            if(binded){
                if(enable){
                    WeixinJSBridge.call('showOptionMenu');
                }else {
                    WeixinJSBridge.call('hideOptionMenu');
                }
            }else {
                if(enable){
                    document.addEventListener('WeixinJSBridgeReady', function(){
                        WeixinJSBridge.call('showOptionMenu');
                    }, false);
                }else {
                    document.addEventListener('WeixinJSBridgeReady', function(){
                        WeixinJSBridge.call('hideOptionMenu');
                    }, false);
                }
            }
        }catch(e){
        }
    },
    linkPre:linkPre,
    __config__:config
};

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/common/footmenu/controller", ["marionette@~1.4.0","wepp@~2.7.0","./template.html","zepto-wepp@~1.1.0","../overlay","underscore@~1.5.0"], function(require, exports, module) {
var Marionette = require('marionette');
var View = require("wepp").Module.BaseView(require('./template.html'));
var $ = require('zepto-wepp');
var Overlay = require('../overlay');
var City = require('wepp').Module.City;
var _ = require('underscore');
var NOTIFICATION_KEY = 'food_bubble';

var Controller = Marionette.Controller.extend({
    initialize:function(){
        this.view = new View();
        this.view.render();
        if(!localStorage.getItem(NOTIFICATION_KEY)){
            this.view.$el.find('.noti').removeClass('hide');
        }

        this.setCity();

        //设置到body级别
        $('body').append(this.view.$el.hide());

        this.menus = this.view.$el.find('.menu-banner a');
        this.more = this.view.$el.find('.more-banner');
        this.overlay = new Overlay();

        this.currentIndex = -1;

        //标记暂时关闭更多，下次show的时候再展示出来
        this.tempCloseMore = false;

        this.events();
    },
    show:function(ignoreTemp){
        if(this.tempCloseMore && !ignoreTemp){
            this.tempCloseMore = false;
            this.showMore();
        }

        this.view.$el.show();
        return this;
    },
    hide:function(){
        this.view.$el.hide();
        return this;
    },
    switchTo:function(i,record,force){
        /*
         * if record is false
         * set current
         *
         * */
        if(i===this.currentIndex && !force){
            return;
        }
        //只是高亮切换
        if(record !== false){
            this.currentIndex = i;
        }
        this.menus.removeClass('on').eq(i).addClass('on');
        if(i===0){
            localStorage.setItem(NOTIFICATION_KEY,true);
            this.view.$el.find('.noti').addClass('hide')
        }
        return this;
    },
    events:function(){
        //3个tab
        var self = this;
        var menus = this.menus;
        menus.each(function(i,menu){
            if(i==menus.length-1){
                return;
            }
            $(menu).on('click',function(){
                self.hideMore();
                self.switchTo(i);
            });
        });

        //更多
        menus.eq(menus.length-1).on('click',_.bind(self.toggleMore,self));
        this.more.find('a').on('click',function(){
            //标记下暂时隐藏，show的时候直接展示
            //在切换了页面再后退回来的时候 

            self.tempCloseMore = true;
            self.hideMore();
        });

        //overlay
        this.overlay.on('hide',function(){
            self.switchTo(self.currentIndex,true,true);
            self.more.hide();
        });

        //City change
        City.on('change',_.bind(self.setCity,self));

    },
    showMore:function(){
        this.switchTo(2,false);
        this.more.show();
        this.overlay.show();
        this._more_show = true;
    },
    hideMore:function(){
        this.overlay.hide();
        this._more_show = false;
    },
    toggleMore:function(){
        if(this._more_show){
            this.hideMore();
        }else {
            this.showMore();
        }
    },
    setCity:function(){
        this.view.$el.find('.J_c_city').html(City.getName());
    },
    setUrl:function(index,url){
        //设置某一个tab的url
        this.menus.eq(index).attr('href',url);
    }
});

module.exports = Controller;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/util/geolocation", ["backbone@~1.1.0","zepto-wepp@~1.1.0","underscore@~1.5.0","cookie@~0.1.0"], function(require, exports, module) {
var Backbone = require('backbone');
var $ = require('zepto-wepp');
var _ = require('underscore');
var cookie = require('cookie');
var COOKIE_EXPIRES = 30/60/60/24; //30s
var COOKIE_KEY_LNG = "lng";
var COOKIE_KEY_LAT = "lat";
var defer ;

var cookieGeolocation = function(){
    //get lat lng from cookie
    if(cookie(COOKIE_KEY_LNG)){
        return {
            lat:cookie(COOKIE_KEY_LAT),
            lng:cookie(COOKIE_KEY_LNG)
        };
    }
    return null;
};
var cookieGeoLocationSet = function(lat,lng,cityid){
    cookie('lng',lng,{
        expires:COOKIE_EXPIRES
    });
    cookie('lat',lat,{
        expires:COOKIE_EXPIRES
    });
    cookie('geocityid',cityid,{
        expires:COOKIE_EXPIRES
    });
};

var html5Geolocation = function(suc,fail){
    navigator.geolocation.getCurrentPosition(function(pos){
        var crd = pos.coords;
        var lng = crd.longitude;
        var lat = crd.latitude;

        suc({
            lng:lng,
            lat:lat
        });
    },fail,{
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 3000
    });
};

var GeoLocation = {
    fetching:false,
    get:function(needCity){
        /*
         * 如果needCity true
         * resolve 的数据中会有city数据
         * */
        if(GeoLocation.fetching){
            return  defer;
        }
        GeoLocation.fetching = true;
        defer = new $.Deferred();
        var crd;
        function resolve(crd){
            //set cookie
            GeoLocation.fetching = false;
            if(needCity){
                GeoLocation.getCityByGeo(crd,function(city){
                    /*
                     * merge city和经纬度的信息，一起resolve
                    * */
                   if(city){
                       cookieGeoLocationSet(crd.lat,crd.lng,city.id);
                       defer.resolve(_.extend(crd,city));
                   }else {
                       GeoLocation.fetching = false;
                       defer.reject()
                   }
                });
            }else {
                cookieGeoLocationSet(crd.lat,crd.lng);
                defer.resolve(crd);
            }
        }

        //try cookie first
        if(crd = cookieGeolocation()){
            setTimeout(function(){
                resolve(crd);
            },0);
        }else {
            //try html5 geolocation
            html5Geolocation(resolve,function(){
                GeoLocation.fetching = false;
                defer.reject();
            });
        }
        return defer;
    },
    getCityByGeo:function(crd,cb){
        //通过经纬度获取city接口
        $.ajax({
            url:"/ajax/tuan/cityidgn.json",
            data:{
                lat:crd.lat,
                lng:crd.lng
            },
            dataType:"json",
            success:function(res){
                //cb city info
                if(res.code==200 && res.data && res.data.id>0){
                    cb({
                        cityid:res.data.id,
                        cityname:res.data.name,
                        cityenname:res.data.enName
                    });
                }else {
                    cb(null);

                }
            }
        });
    },
    cookieGeo:cookieGeolocation
};

module.exports = GeoLocation;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/common/first", ["wepp@~2.7.0"], function(require, exports, module) {
/*
 * 检验用户是否是第一次
 *
 * 第一次进入去选择城市页面
 *
 * */

var Url = require('wepp').Url;

module.exports = {
    firstVisit:function(){
        //第一次访问页面
        return localStorage.getItem('cityselect') === null;
    },
    firstSelect:function(){
        //选了城市后的第一次访问
        return  localStorage.getItem('cityselect') === "first";
    },
    checkFirst:function(){
        var urlCity = Url.get('cityid');

        //如果用户是第一次访问，强制到city选择页面
        if(!urlCity && this.firstVisit()){
            localStorage.setItem('cityrefer' , location.hash);
            ThisApp.redirect('#citylist',true);
            return true;
        }
        return false;
    }
};

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/refund/layout.html", [], function(require, exports, module) {
module.exports = '<div class="refund-box"><div class="J_cnt"></div><div class="J_cause"></div><div class="J_button"></div><div class="J_alert"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/config/routeconfig", [], function(require, exports, module) {
var listShareConfig = {
    title:'点评团·放心团',
    desc:'吃喝玩乐，应有尽有，随时随地，想团就团，快来试试吧！'
};

module.exports = {
    "":{
        pv:{
            pageId:'172001'
        },
        share:listShareConfig,
        appjs:['./pages/index'],
        method:"show"
    },
    "chosen":{
        appjs:['./pages/chosen'],
        method:"show",
        pv:{
            pageId:"172019"
        },
        share:{
            title:'吃喝玩乐尽在大众点评',
            desc:'好吃，好玩，还省钱'
        }
    },
    "list(~k_:keyword)(~c_:category)(~r_:region)(~f_:filter)(~lng_:lng)(~lat_:lat)":{
        pv:{
            pageId:'172001'
        },
        share:listShareConfig,
        appjs:['./pages/index'],
        method:"show"
    },
    "detail~:id":{
        pv:{
            pageId:'172002'
        },
        share:{
        },
        appjs:["./pages/detail"],
        method:"show"
    },
    "detailmore~:id":{
        pv:{
            pageId:'172003'
        },
        appjs:["./pages/detailmore"],
        method:"show"
    },
    "shoplist~:id":{
        pv:{
            pageId:'172004'
        },
        appjs:["./pages/shoplist"],
        method:"show"
    },
    "order~g_:groupId~d_:dealId":{
        pv:{
            pageId:'172006'
        },
        appjs:["./pages/pay"],
        method:"show"
    },
    "orderconfirm~:id":{
        pv:{
            pageId:'172009'
        },
        appjs:["./pages/orderconfirm"],
        method:"show"
    },
    "orderdetail~:id":{
        pv:{
            pageId:'172014'
        },
        appjs:["./pages/orderdetail"],
        method:"show"
    },
    'paypromo':{
        appjs: ['./pages/paypromo'],
        method: "show"
    },
    'promo~:orderid':{
        pv:{
            pageId:'172010'
        },
        appjs: ['./pages/promo'],
        method: "show"
    },
    'receiptlist':{
        pv:{
            pageId:'172012'
        },
        appjs: ['./pages/receiptlist'],
        method: "show",
        filters:['login']
    },
    'receiptdetail~:id':{
        pv:{
            pageId:'172013'
        },
        appjs: ['./pages/receiptdetail'],
        method: "show",
        filters:['login']
    },
    'deliveryadd~:index':{
        pv:{
            pageId:'172007'
        },
        appjs: ['./pages/deliveryadd'],
        method: "show"
    },
    'deliverylist':{
        pv:{
            pageId:'172008'
        },
        appjs: ['./pages/deliverylist'],
        method: "show"
    },
    'dealselect~g_:id':{
        pv:{
            pageId:'172005'
        },
        appjs: ['./pages/dealselect'],
        method: "show"
    },
    'paysuc~:id':{
        pv:{
            pageId:'172011'
        },
        appjs: ['./pages/paysuc'],
        share:listShareConfig,
        method: "show"
    },
    'alertinfo':{
        appjs: ['./pages/alertinfo'],
        method: "show"
    },
    'couponlist':{
        appjs: ['./pages/couponlist'],
        method: "show",
        pv:{
            pageId:"172015"
        },
        filters:['login']
    },
    'my':{
        appjs: ['./pages/my'],
        method: "show",
        pv:{
            pageId:"172016"
        },
        filters:['login']
    },
    'citylist':{
        appjs: ['./pages/citylist'],
        method: "show",
        pv:{
            pageId:"172017"
        }
    },
    'refund~:id':{
        appjs: ['./pages/refund'],
        method: "show"
    },   
    'innertest':{
        appjs:['./pages/test'],
        method:"show"
    },
    'orderlist':{
        appjs: ['./pages/orderlist'],
        method: "show",
        filters:['login'],
        pv:{
            pageId:"172018"
        }
    }
};

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/config/envconfig", ["wepp@~2.7.0"], function(require, exports, module) {
var ENV = require('wepp').ENV;


ENV.config('appid',{
    beta:"wx1613983303fce900",
    pre :"wx841a97238d9e17b2",
    online :"wx841a97238d9e17b2"
});

ENV.config('cpsUrl',{
    beta:"http://tcps.51ping.com",
    pre :"http://cps.dianping.com",
    online:"http://cps.dianping.com"
});

ENV.config('mmUrl',{
    beta:"http://mm.51ping.com",
    pre:"http://ppe.mm.dianping.com",
    online:"http://mm.dianping.com"
});

ENV.config('payDomain',{
    beta:"http://api.p.51ping.com",
    pre:"http://ppe.api.p.dianping.com",
    online:"http://api.p.dianping.com"
});

ENV.config('accountDomain',{
    beta:"http://m.51ping.com",
    pre:"http://ppe.m.dianping.com",
    online:"http://m.dianping.com"
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/common/overlay", ["zepto-wepp@~1.1.0","underscore@~1.5.0","backbone@~1.1.0"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Backbone = require('backbone');

var createOverlay = function(){
    return $('<div class="overlay" style="z-index:200;"></div>');
};

function Overlay(container){
    var self = this;
    this.container = container || 'body';
    var ol = this.overlay = createOverlay();

    ol.on('touchstart touchmove touchend',function(e){
        e.preventDefault();

    });

    ol.on('touchstart click',function(e){ self.hide(); });
}

Overlay.prototype.show = function(){
    this.overlay.appendTo(this.container).show();
    this.trigger('show');
};
Overlay.prototype.hide = function(){
    this.overlay.hide();
    this.trigger('hide');
};

_.extend(Overlay.prototype,Backbone.Events);

module.exports = Overlay;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/filters/login", ["zepto-wepp@~1.1.0","wepp@~2.7.0"], function(require, exports, module) {
var $ = require('zepto-wepp');
var ENV = require('wepp').ENV;

var jumpToLoginPage = function(){
    var state = encodeURIComponent('type=quan,url='+location.href);
    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='+ENV.get('appid')+'&redirect_uri='+ENV.get('cpsUrl')+'/weiXinRedirect&response_type=code&scope=snsapi_base&state='+state+'#wechat_redirect';

    location.href = url;
};

var ajaxLogCheck = function(onFail){
    $.ajax({
        url: '/ajax/tuan/tuanprofilegn.json?',
        type:"POST",
        dataType:"json",
        success:function(res){
            if(res.code!==200){
                onFail();
            }
        }
    });

};

module.exports = {
    check:function(){
        var defer = $.Deferred();

        if(ThisApp.isLogin){
            //可能不准,后面会用接口校验
            setTimeout(function(){
                defer.resolve();
            },0);

            //继续做ajax校验
            ajaxLogCheck(jumpToLoginPage);

        }else {
            jumpToLoginPage();
            setTimeout(function(){
                defer.reject();
            },0);
        }
        return defer.promise();
    }
};

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/refund/content/view", ["marionette@~1.4.0","underscore@~1.5.0","zepto-wepp@~1.1.0","./template.html"], function(require, exports, module) {
var Marionette  = require('marionette');
var _ = require('underscore');
var $ = require('zepto-wepp');

module.exports = Marionette.ItemView.extend({
    template: _.template(require('./template.html')),
    className: "div",
    events:{
        "click .J_count_add":"addNum",
        "click .J_count_sub":"subNum"
    },
    addNum:function(e){
    	e.preventDefault();
    	var elem = $(e.target);
    	var model = this.model;
    	if(elem.hasClass("J_un"))
    		return ;
    	var value = model.get("selectIndex");
    	model.set("selectIndex",value+1);

    },
    subNum:function(e){
    	e.preventDefault();
    	var elem = $(e.target);
    	var model = this.model;
    	if(elem.hasClass("J_un"))
    		return ;
    	var value = model.get("selectIndex");

    	model.set("selectIndex",value-1);
    }

});

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
define("unit-m-weixin@~1.12.0/js/modules/refund/cause/view", ["marionette@~1.4.0","underscore@~1.5.0","zepto-wepp@~1.1.0","./template.html"], function(require, exports, module) {
var Marionette  = require('marionette');
var _ = require('underscore');
var $ = require('zepto-wepp');

module.exports = Marionette.ItemView.extend({
    template: _.template(require('./template.html')),
    tagName: "div",
    events:{
        "click .J_cause_select":"causeSelect"
    },
    causeSelect:function(e){
    	e.preventDefault();
        var elem = $(e.currentTarget);

    	var model = this.model;
    	model.set("causeIndex",elem.attr("data"));
    }

});

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
define("unit-m-weixin@~1.12.0/js/modules/refund/button/view", ["marionette@~1.4.0","underscore@~1.5.0","zepto-wepp@~1.1.0","wepp@~2.7.0","./template.html"], function(require, exports, module) {
var Marionette  = require('marionette');
var _ = require('underscore');
var $ = require('zepto-wepp');
var UI = require("wepp").UI;

module.exports = Marionette.ItemView.extend({
    template: _.template(require('./template.html')),
    className: "div",
    events:{
        "click .J_submit":"formSubmit"
    },
    formSubmit:function(e){
    	e.preventDefault();
    	var elem = $(e.target);
        var model = this.model;

        if(!model.get("causeIndex")){
            UI.alert("请选择退款原因");
            return ;
        }
        
        this.page.message("alert:show");
        
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/refund/button/controller", ["marionette@~1.4.0","./view","underscore@~1.5.0"], function(require, exports, module) {
var Marionette = require('marionette');
var View = require("./view"),
    _ = require('underscore');


module.exports = Marionette.Controller.extend({
    initialize: function(model) {
        var view = this.view = new View({model:model}); 
    },
    show: function(region,pageController) {
    	this.view.page = pageController;
        region.show(this.view);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/common/alert/template.html", [], function(require, exports, module) {
module.exports = '<div class="overlay"></div><div class="confirm_alert"><div class="alert_content"><%=content%></div><div class="alert_buttons"><%buttons.forEach(function(btn){%><a href="<%=(btn.url||\'javascript:;\')%>"><%=btn.text%></a><%});%></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/refund/cause/controller", ["marionette@~1.4.0","./view","underscore@~1.5.0"], function(require, exports, module) {
var Marionette = require('marionette');
var View = require("./view"),
    _ = require('underscore');


module.exports = Marionette.Controller.extend({
    initialize: function(model) {
        var view = this.view = new View({model:model}); 
    },
    show: function(region) {
        region.show(this.view);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/common/footmenu/template.html", [], function(require, exports, module) {
module.exports = '<footer class="footer-menu"><div class="more-banner on Fix" style="display:none;"><div class="row Fix"><a href="#citylist" onclick="ThisApp.mv({\'module\':\'more_city\'})"><i class="icon city"></i><span class="sub"><b>当前城市</b><span class="J_c_city"></span></span></a><a href="#receiptlist" onclick="ThisApp.mv({\'module\':\'more_coupon\'})"><i class="icon group"></i><span class="sub">团购券</span></a><a href="#my" onclick="ThisApp.mv({\'module\':\'more_account\'})"><i class="icon userinfo"></i><span class="sub">账号</span></a></div></div><div class="menu-banner Fix"><a href="#chosen" class="on" onclick="ThisApp.mv({module:\'navi_index\'})"><i class="icon select"></i><span class="sub">精选美食</span><i class="noti hide"></i></a><a href="#list~f_2~c_10" onclick="ThisApp.mv({module:\'navi_nearby\'})"><i class="icon nearby"></i><span class="sub">附近团购</span></a><a href="javascript:;" onclick="ThisApp.mv({module:\'navi_more\'})"><i class="icon more"></i><span class="sub">更多</span></a></div></footer>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/refund/content/controller", ["marionette@~1.4.0","./view","underscore@~1.5.0"], function(require, exports, module) {
var Marionette = require('marionette');
var View = require("./view"),
    _ = require('underscore');


module.exports = Marionette.Controller.extend({
    initialize: function(model) {
        var view = this.view = new View({model:model}); 
    },
    show: function(region) {
        region.show(this.view);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/refund/content/template.html", [], function(require, exports, module) {
module.exports = '<div class="tit-box"><h3><%=title%></h3><div class="intro">你有<strong><%=count%></strong>张可退的团购券，请选择要退回的数量</div></div><div class="dv-box count Fix"><div class="sub">退回数量</div><div class="f-r"><a class="<%if(selectIndex==0){%>dis J_un<%}%> op J_count_sub" href="javascript:void(0)">-</a><input readonly type="text" value="<%=(selectIndex+1)%>" class="buy-cnt"><a class="<%if(selectIndex==arrIndex){%>dis J_un<%}%> op J_count_add" href="javascript:void(0)">+</a></div></div><table class="tb-box"><thead><tr><td class="w-70">退回金额<%if(notePush[selectIndex]){%><div class="tip"><%=notePush[selectIndex]%></div><%}%></td><td  class="Fix w-30 t-r"><span class="total-price">¥<%=amountPush[selectIndex]%></span></td></tr></thead></table><div class="sb-box"><div class="tit">退款方式</div><div class="cnt"><table class="tb-box"><thead><tr><td class="w-80"><div class="sub">原路退回</div><div class="tip gray">3-10个工作日完成，暂不收手续费</td><td  class="Fix w-20 t-r"><div class="checked-icon on"></div></td></tr></thead></table></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/entities/refund", ["backbone@~1.1.0"], function(require, exports, module) {
var Backbone = require('backbone');
var RefundModel = Backbone.Model.extend({
    baseUrl: '/ajax/tuan/refundgn.json',
    initialize:function(orderId){
        this.orderId = orderId;
        this.setUrl();
         
        return this;
    },
    parse: function(res) {
        var self =this;
         var data = res.data;
        if(res.code == 200){
            data.amountPush = data.amount.split(",");
            data.notePush = data.note.split("|");
            data.receiptListPush = data.receiptList.split(",");
            data.arrIndex = data.receiptListPush.length-1 || 0 ;
            data.count = data.receiptListPush.length || 0;
            data.selectIndex = 0;
            data.causeIndex = "";
            data.orderId = self.orderId;
            data.submiting = false;

        }else if(res.code == 400){
            data.error = "400";
        }else{
            data.error = "500"
        }
        return data;
    },
    setUrl: function(){
        this.url = this.baseUrl+"?orderid="+this.orderId;
    }
});

module.exports = RefundModel;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/refund/cause/template.html", [], function(require, exports, module) {
module.exports = '<div class="sb-box"><div class="tit">退款原因</div><div class="cnt"><a href="javascrpt:void(0)"  data="1" class="dv-box on J_cause_select Fix"><div class="sub">买多了/买错了</div><div class="f-r"><div class="checked-icon <%if(causeIndex==1){%>on<%}%>"></div></div></a><a href="javascrpt:void(0)"  data="2" class="J_cause_select dv-box Fix"><div class="sub">计划有变，没时间消费</div><div class="f-r"><div class="checked-icon <%if(causeIndex==2){%>on<%}%>"></div></div></a><a href="javascrpt:void(0)" data="3" class="J_cause_select dv-box Fix"><div class="sub">预约有变</div><div class="f-r"><div class="checked-icon <%if(causeIndex==3){%>on<%}%>"></div></div></a><a href="javascrpt:void(0)" data="4" class="J_cause_select dv-box Fix"><div class="sub">评价不好</div><div class="f-r"><div class="checked-icon <%if(causeIndex==4){%>on<%}%>"></div></div></a><a href="javascrpt:void(0)" data="5" class="J_cause_select dv-box Fix"><div class="sub">后悔了,不想要了</div><div class="f-r"><div class="checked-icon <%if(causeIndex==5){%>on<%}%>"></div></div></a><a href="javascrpt:void(0)" data="6" class="J_cause_select dv-box Fix"><div class="sub">其他原因</div><div class="f-r"><div class="checked-icon <%if(causeIndex==6){%>on<%}%>"></div></div></a></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/app", ["wepp@~2.7.0","./base/share","./modules/common/footmenu/controller","./util/geolocation","./util/cache","zepto-wepp@~1.1.0","./modules/common/first","./config/deviceconfig","./config/routeconfig","./config/envconfig","./modules/common/overlay","hippo@~1.2.0","./filters/login"], function(require, exports, module) {
var Wepp = require("wepp");
var Share = require('./base/share');
var Menu = require('./modules/common/footmenu/controller');
var Geo = require('./util/geolocation');
var Performance = Wepp.Module.Performance;
var Cache = require('./util/cache');
var $ = require('zepto-wepp');

//设置cityselect true
if(!require('./modules/common/first').firstVisit()){
    localStorage.setItem('cityselect',true);
}

//page不去require app，避免打包冗余，但是多了个全局变量
var App = module.exports = window.ThisApp = Wepp.App.create({
    device:require('./config/deviceconfig'),
    router:require("./config/routeconfig")
});

//env config
require('./config/envconfig');

//初始化菜单
App.Menu = new Menu();

App.routerManager.pageLoader = function(js,cb){
    require.async(js[0],cb);
};

//第一次不显示转圈
var first = true;
App.routerManager.on('before:route:change',function(){
    if(!first){
        Wepp.UI.loading.show();
    }
    first = false;
    App.Menu.hide();
});


App.routerManager.on('route:change',function(config,controller){
    Wepp.UI.loading.hide();

    //设置分享
    if(config.share){
        controller.trigger && controller.trigger('before_share_config',config.share);
        Share.enable(true);
        Share.config(config.share);
    }else {
        Share.enable(false);
    }
});

App.Geo = Geo;
App.Share = Share;
App.Overlay = require('./modules/common/overlay');
App.mv = function(data){
    require('hippo').push(['mv',data]);
};
App.Cache = Cache;

//后端输出在页面上的变量
App.isLogin = window.WEIXIN_CONFIG && +window.WEIXIN_CONFIG.userId;

//config filters
//a little ugly...
App.routerManager.constructor.filters =  {
    login:require('./filters/login')
};

Performance.setFrameTime();

//删除welcome div
$('.welcome').remove();

//app start
App.start();

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/config/deviceconfig", [], function(require, exports, module) {
module.exports = {
    "iphone4":{
        pageLength:4
    },
    "iphone5":{
        pageLength:5
    },
    "android2x":{
        pageLength:3
    },
    "android3+":{
        pageLength:3
    },
    "default":{
        pageLength:3
    }
};

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/pages/refund", ["zepto-wepp@~1.1.0","underscore@~1.5.0","wepp@~2.7.0","../app","../entities/refund","../modules/refund/content/controller","../modules/refund/cause/controller","../modules/refund/button/controller","../util/cache","../modules/common/alert/controller","../modules/refund/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Wepp = require('wepp');
var App = require('../app');
var RefundModel = require('../entities/refund');
var CntController= require("../modules/refund/content/controller");
var CauseController= require("../modules/refund/cause/controller");
var ButtonController= require("../modules/refund/button/controller");
var Cache = require("../util/cache");
var UI = Wepp.UI;
var Confirm = require('../modules/common/alert/controller');

var refundModel;
var RefundController = Wepp.PageController.extend({
    initialize:function(){
        var self = this;
        this.onMessage('alert:show',function(){
            self.showAlert();
        });
        this.onMessage('alert:submit',function(){

            var model = self.model;
            var selectIndex = model.get("selectIndex");
            model.set("submiting",true);

            $.ajax({
                url:"/ajax/tuan/submitrefundgn.json",
                type:"POST",
                data:{
                    orderid:model.get("orderId"),
                    amount:model.get("amountPush")[selectIndex],
                    type:2,
                    reason:model.get("causeIndex"),
                    // 选择机型
                    pcode:$.os.ios ? 20010500 : 20010400,
                    receiptid:model.get("receiptListPush").splice(0,selectIndex+1).join(',')
                },
                success:function(res){
                    if(res.code == 200){
                        UI.alert("退款申请已提交，客服会尽快为您处理");
                        setTimeout(function(){ThisApp.redirect("#receiptlist",true);},1200);
                    }else{
                        UI.alert("系统错误");
                        model.set("submiting",false);
                    }
                },
                error:function(){
                    UI.alert("系统繁忙");
                    model.set("submiting",false);
                }
            });
        });
    },
    show:function(orderId){
        var self =  this;

        App.openPage().then(function(page){
            refundModel =  self.model = new RefundModel(orderId);

            refundModel.set("title",Cache.get("refundTitle") || "test");


            page.initRegion({
                template:_.template(require("../modules/refund/layout.html")),
                regions:{
                    'header': '.J_header',
                    'cnt': '.J_cnt',
                    'cause': '.J_cause',
                    'button': '.J_button',
                    'alert': 'J_alert'
                }
            });


            refundModel.on("change",function(){
                var _error = refundModel.get("error");
                if(!_error){
                    self.showCnt(page.layout.cnt);
                    self.showCause(page.layout.cause);
                    self.showButton(page.layout.button);
                    self.showButton(page.layout.button);
                }else if(_error == 400){
                    UI.alert("本订单已有退款申请正在处理。退款成功后，你可以申请退款本订单的其它团购券。",3000);
                    setTimeout(function(){
                        ThisApp.redirect("#receiptlist",true);
                    },3000);
                }else{
                    UI.alert("系统错误");
                    setTimeout(function(){
                        ThisApp.redirect("#receiptlist",true);
                    },1200);
                }
            });
            refundModel.fetch();
        },function(){
            refundModel.fetch();
        });
    },

    showCnt: function(region){
        var cntController = new CntController(this.model,this);
        cntController.show(region);
    },
    showCause: function(region){
        var causeController = new CauseController(this.model,this); 
        causeController.show(region);
    },
    showButton:function(region){
        var buttonController = new ButtonController(this.model);
        buttonController.show(region,this);
    },
    showAlert:function(){
        var self = this;
        var cfm = new Confirm({
            content:"退款申请一旦提交，团购券将不能恢复",
            buttons:[{
                text:"取消",
                click:function(){
                    cfm.hide();
                }
            },{
                text:"确认退款",
                click:function(){
                    cfm.hide();
                    self.message("alert:submit");
                }
            }]
        });
        cfm.show();
    }
});

exports.Controller = RefundController;


}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});