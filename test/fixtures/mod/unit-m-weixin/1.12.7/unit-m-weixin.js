define("unit-m-weixin@1.12.7/js/modules/common/alert/template.html", [], function(require, exports, module) {
module.exports = '<div class="overlay"></div><div class="confirm_alert"><div class="alert_content"><%=content%></div><div class="alert_buttons"><%buttons.forEach(function(btn){%><a href="<%=(btn.url||\'javascript:;\')%>"><%=btn.text%></a><%});%></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/config/routeconfig", [], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/config/envconfig", ["wepp@~2.7.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/modules/common/overlay", ["zepto-wepp@~1.1.0","underscore@~1.5.0","backbone@~1.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/config/deviceconfig", [], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/modules/chosen/controller", ["zepto-wepp@~1.1.0","../../entities/chosen","wepp@~2.7.0","./template.html","../../util/lazyload","hippo@~1.2.0"], function(require, exports, module) {
var $ = require('zepto-wepp');
var ChosenModel = require('../../entities/chosen');

module.exports = require('wepp').Module.BaseController.extend({
    initModel:function(options){
        return new ChosenModel(options);
    },
    initTpl:function(options){
        return require('./template.html');
    },
    onRender:function(region){
        var self = this;
        var view = self.view;
        //set img size

        var imgs = view.$el.find('.img');

        if(imgs.length){
            imgs.height(imgs.width()*200/320);
        }
        imgs.find('img').each(function(i,m){
            $(m).on('load',function(){
                $(this).parent().css('height','auto');
            });
        });
        require('../../util/lazyload')(view.$el.find('.img img'));

        //reset hide and show function 
        self.show = function(){
            view.$el.show();
        };
        self.hide = function(){
            view.$el.hide();
        };

        //hippo mv
        var hippo = require('hippo');
        hippo.push(['mv',{
            'module':'index_recom_view',
            'action':'browse',
            'reqid':this.model.get('request_id')
        }]);
        view.$el.find('.nearby-deallist a').each(function(i,item){
            $(item).on('click',function(){
                hippo.push(['mv',{
                    'module':'index_recom_item',
                    'action':'click',
                    'index':i,
                    'reqid':self.model.get('request_id')
                }]);
            });
        });

        self.trigger('render');
    },
    hide:function(){},
    show:function(){}
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/common/search/controller", ["marionette@~1.4.0","wepp@~2.7.0","./template.html","zepto-wepp@~1.1.0","underscore@~1.5.0","backbone@~1.1.0"], function(require, exports, module) {
/*
*  搜索组件
*
* */
var Marionette = require('marionette');
var WeppModule = require('wepp').Module;
var View = WeppModule.BaseView(require('./template.html'));
var $ = require('zepto-wepp');
var _ = require('underscore');
var Backbone = require('backbone');
var City = WeppModule.City;

function wrapCityName(){
    //截断2个字
    var cityName = City.getName()||"";
    return cityName.length>3?cityName.substr(0,2)+"..":cityName;
}

var Search = Marionette.Controller.extend({
    initialize:function(options){
        var default_options = {
            showCity:true,
            showBack:false
        };
        this.options = _.extend(default_options,options||{});
        this.view = new View({
            model:new Backbone.Model({
                history:Search.History.get(),
                cityname:wrapCityName(),
                showCity:this.options.showCity,
                showBack:this.options.showBack
            })
        });
    },
    show:function(region,keywords){
        region.show(this.view);

        var el = this.view.$el;


        this.searchBox = el.find('.J_search_box');
        this.cancelBtn = el.find('.J_cancel'); //取消按钮
        this.backBtn = el.find('.J_back');

        this.historyHolder = el.find('.J_history');
        this.historyList = el.find('.J_history ul');
        this.clearBtn = el.find('.J_history .clear'); //清除历史记录按钮
        this.cityBox = el.find('.city');

        this.trigger('show');

        if(keywords){
            this.setKeywords(keywords);
        }
        this.bindEvents();

    },
    search:function(keywords){
        /*
        *
        * 添加History
        * 把search事件抛出去给外面自己处理
        *
        * */
        Search.History.add(keywords);
        this.searchBox.val(keywords);
        this.trigger('search',keywords);
    },
    cancel:function(){
        var self = this;
        this.searchBox.parent().removeClass('float');
        this.cityBox.removeClass('float');
        this.searchBox.get(0).blur();
        this.backBtn.show().addClass('on');
        this.cancelBtn.hide();
        setTimeout(function(){
            self.historyHolder.hide();
        },400);
        this.trigger('blur');
    },
    setKeywords:function(keywords){
        this.view.$el.find('.J_search_box').val(keywords);
    },
    bindEvents:function(){
        var self = this;
        var el = this.view.$el;

        el.find('form').on('submit',_.bind(this.submit,this));

        //focus input
        this.searchBox.on('focus',function(){
            self.onFocus();
        });
        //touchstart 
        this.searchBox.on('touchstart',function(){
            self.trigger('touch');
        });

        this.searchBox.on('blur',function(){
            self.cancel();
        });

        //click cancel
        this.cancelBtn.on('click',function(){
            self.cancel();
        });
        //click history
        this.historyList.on('click','li',function(e){
            self.cancel();
            self.search(e.currentTarget.innerText);
        });

        //add history
        Search.History.on('add',function(value){
            self.append(value);
        });
        //pop
        Search.History.on('pop',function(){
            var items = self.historyList.children();
            items.eq(items.length-1).remove();
        });
        //clear history
        Search.History.on('clear',function(){
            self.historyList.empty();
        });

        //click clear btn
        this.clearBtn.on('click',function(){
            Search.History.clear();
            self.refresh();
        });

        //city
        City.on('change',function(){
            self.view.$el.find('.city a').html(wrapCityName());
        });
    },
    submit:function(e){
        /*
        * 提交 关键字
        *
        * */
        e.preventDefault();
        var keywords = this.searchBox.val();
        this.cancel();
        if(keywords){
            this.search(keywords);
        }
    },
    append:function(value){
        this.historyList.prepend('<li>'+value+'</li>');
        this.refresh();
    },
    showHistory:function(){
        this.historyHolder.show().css('height',$(window).height() - 40);
        this.refresh();
    },
    initIscroll:function(){
        var self = this;
        require.async('iscroll',function(IScroll){
            self.scroll = new IScroll(self.historyHolder.get(0),{
                mouseWheel:true,
                click:true,
            });
        });
    },
    refresh:function(){
        //refresh iscroll
        if(!this.scroll){
            this.initIscroll();
        }else {
            this.scroll.refresh();
        }
    },
    onFocus:function(){
        this.searchBox.parent().addClass('float');
        this.cityBox.addClass('float');
        this.showCancel();
        this.showHistory();
        this.trigger('focus');
    },
    showBack:function(){
        /*
         * 显示后退按钮
         * */
        this.backBtn.show().addClass('on');
        this.cancelBtn.hide();
    },
    showCancel:function(){
        this.backBtn.hide();
        this.cancelBtn.show();
    }
});

Search.History = {
    KEY:"search_history",
    get:function(){
        var store = window.localStorage.getItem(this.KEY);
        return store?store.split(','):[];
    },
    add:function(value){
        var current = this.get();
        if(current.indexOf(value)===-1){
            current.unshift(value);
            if(current.length>20){
                current.pop();
                this.trigger('pop');
            }
            window.localStorage.setItem(this.KEY, current.join(','));
            this.trigger('add',value);
        }
    },
    clear:function(){
        window.localStorage.removeItem(this.KEY);
        this.trigger('clear');
    }
};
_.extend(Search.History,Backbone.Events);

module.exports = Search;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/common/appdownload/controller", ["marionette@~1.4.0","wepp@~2.7.0","./template.html","backbone@~1.1.0","zepto-wepp@~1.1.0","../overlay"], function(require, exports, module) {
var Marionette = require('marionette');
var View = require('wepp').Module.BaseView(require('./template.html'));
var Backbone = require('backbone');
var $ = require('zepto-wepp');

module.exports = Marionette.Controller.extend({
    initialize: function (param) {
        /*
         * param.url
         * param.region
         * param.tipText
         * param.popText
         * */
        var model = new Backbone.Model(param);
        var view = new View({ model: model });

        param.region.show(view);

        if (model.get('mv')) {
            view.$el.find('.J_d').on('click', function () {
                ThisApp.mv(model.get('mv'));
            });
        }
        var shareBtn = view.$el.find('.J_share');
        if (shareBtn.length) {
            var ol = new (require('../overlay'))();
            var guide = $('<div class="shareguide"></div>').appendTo('body').hide();
            ol.on('show', function () {
                ol.overlay.css({
                    'background-color': 'rgba(0,0,0,.9)',
                    'z-index':900
                }); guide.show();
            });
            ol.on('hide', function () {
                guide.hide();
            });
            guide.on('click', function () {
                ol.hide();
            });
            shareBtn.on('click', function (e) {
                e.preventDefault();
                ol.show();
                setTimeout(function () {
                    ol.hide();
                }, 5000);
            });
        }

    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/common/alert/controller", ["wepp@~2.7.0","./template.html","backbone@~1.1.0","marionette@~1.4.0","underscore@~1.5.0","zepto-wepp@~1.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/modules/chosen/layout.html", [], function(require, exports, module) {
module.exports = '<div class="nearby"><div class="search_holder Fix"></div><div class="J_cnt"><div class="loading" style="height:400px;"></div></div><div class="download"></div></div><div class="height-box"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/common/first", ["wepp@~2.7.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/modules/common/footmenu/template.html", [], function(require, exports, module) {
module.exports = '<footer class="footer-menu"><div class="more-banner on Fix" style="display:none;"><div class="row Fix"><a href="#citylist" onclick="ThisApp.mv({\'module\':\'more_city\'})"><i class="icon city"></i><span class="sub"><b>当前城市</b><span class="J_c_city"></span></span></a><a href="#receiptlist" onclick="ThisApp.mv({\'module\':\'more_coupon\'})"><i class="icon group"></i><span class="sub">团购券</span></a><a href="#my" onclick="ThisApp.mv({\'module\':\'more_account\'})"><i class="icon userinfo"></i><span class="sub">账号</span></a></div></div><div class="menu-banner Fix"><a href="#chosen" class="on" onclick="ThisApp.mv({module:\'navi_index\'})"><i class="icon select"></i><span class="sub">精选美食</span><i class="noti hide"></i></a><a href="#list~f_2~c_10" onclick="ThisApp.mv({module:\'navi_nearby\'})"><i class="icon nearby"></i><span class="sub">附近团购</span></a><a href="javascript:;" onclick="ThisApp.mv({module:\'navi_more\'})"><i class="icon more"></i><span class="sub">更多</span></a></div></footer>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/util/cache", [], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/entities/chosen", ["backbone@~1.1.0","underscore@~1.5.0","wepp@~2.7.0"], function(require, exports, module) {
var Backbone = require('backbone');
var _ = require('underscore');
var Wepp = require('wepp');
var Url = Wepp.Url;
var City = Wepp.Module.City;

//首页推荐
module.exports = Backbone.Model.extend({
    initialize:function(attrs){
        /*
         * cityid,
         * lat,
         * lng,
         * meters,
         * number,
         * */

        var p = _.extend({
            from:"weixin",
            category:10,
            distance:2000,
            number:20,
            type:1
        },attrs);

        // this.url = "/ajax/tuan/searchdealgn.json?" + Url.stringify(p);
        this.url = "getwxhomepagedatagn.json?" + Url.stringify(p);
    },
    parse:function(res){
        if(res && res.code===200){
            //set city
            var recommend = res.data.recommendDeals;
            if(recommend.city){
                City.set({
                    id:recommend.city.id,
                    name:recommend.city.name,
                    enName:recommend.city.enName
                });
            }

            var list = (recommend.list||[]).map(function(item){
                item.shopNum = item.shopIdsStr?item.shopIdsStr.split(',').length:0;
                return item;
            });


            return {
                categoryList:res.data.categoryList && res.data.categoryList.list ||[],
                recommendList:list || [],
                hotModules:res.data.hotModules||[],
                request_id:res.request_id
            };
        }else {
            return {
                categoryList:[],
                recommendList: [],
                hotModules:[],
                request_id:res.request_id
            };
        }
    }
});


}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/util/geolocation", ["backbone@~1.1.0","zepto-wepp@~1.1.0","underscore@~1.5.0","cookie@~0.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/modules/chosen/template.html", [], function(require, exports, module) {
module.exports = '<%if(categoryList && categoryList.length){var width=parseInt(window.innerWidth/(categoryList.length));%><div class="category Fix"><%categoryList.forEach(function(cat){var c,url;if(cat.id==0){c=\'bonus\';url=cat.enName}else if(cat.id==10){c=\'food\';url=\'#list~c_10\'}else if(cat.id==30){c=\'fun\';url=\'#list~c_30\'}%><a class="item <%=c%>" style="width:<%=width%>px" href="<%=url%>"><div class="icon"><%if(cat.id==0){%><div class="count <%=cat.count?\'\':\'none\'%>"><%=cat.count?(cat.count>99?\'+99\':cat.count):\'\'%></div><%}%></div><%=cat.name%></a><%});%></div><%}%><div class="c-box-tit" style="color:#969696">猜你喜欢</div><div class="nearby-deallist"><%recommendList.forEach(function(deal,i){%><a href="#detail~<%=deal.id%>"><div class="img"><img lazy-src="<%=deal.bigImageUrl%>" width="100%" height="auto"></div><div class="tit"><%=deal.contentTitle%><%if(deal.shopNum && deal.shopNum>1){%><span class="shop-total">【<%=deal.shopNum%>店通用】</span><%}%></div><div class="tip"><%=deal.titleDesc%></div><div class="price"><span class="new-price">￥<%=deal.price%></span><span class="old-price">￥<%=deal.originalPrice%></span><span class="buy-num"><%=deal.buyerCounter%>人</span></div></a><%});%></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/common/footmenu/controller", ["marionette@~1.4.0","wepp@~2.7.0","./template.html","zepto-wepp@~1.1.0","../overlay","underscore@~1.5.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/util/lazyload", ["zepto-wepp@~1.1.0"], function(require, exports, module) {
/*
 * Image lazyLoad
 */
var $ = require('zepto-wepp');
var lazyAttr = 'lazy-src';

var LazyLoad = function (images) {
    var els = images.slice(0); //==> array
    var len = els.length;
    var action = function () {
        var currentTop = $(window).scrollTop() + window.innerHeight;
        for (var i = 0, l = els.length; i < l; i++) {
            var el = $(els[i]);
            if (!el.attr('src') && el.attr(lazyAttr)) {
                if (currentTop > $(el).offset().top) {
                    el.attr('src', el.attr(lazyAttr));
                    len--;
                }
            }
        }
        if (len <=0 ) {
            window.removeEventListener('scroll', action, false);
        }
    };
    window.addEventListener('load', action, false);
    window.addEventListener('scroll', action, false);
    action();
};

module.exports = LazyLoad;
}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/base/share", ["wepp@~2.7.0","underscore@~1.5.0","zepto-wepp@~1.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/modules/common/search/template.html", [], function(require, exports, module) {
module.exports = '<form action="" method="post"><%if(showCity){%><div class="city"><a href="#citylist" onclick="ThisApp.mv({module:\'index_city\'})" ><%=cityname%></a><i class="drop"></i></div><%}%><div class="search_inner <%=showCity?\'\':\'first\'%>"><input type="text" placeholder="商户名，地址等..." class="J_search_box search_box"/><a class="cancel J_cancel" href="javascript:;">取消</a><%if(showBack){%><a class="cancel J_back" href="javascript:history.go(-1);">返回</a><%}%><input type="submit" class="hide"></div></form><div class="J_history history"><div><ul><%history.forEach(function(item){%><li><%=item%></li><%});%></ul><a href="javascript:;" class="clear">清除搜索记录</a></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/pages/chosen", ["zepto-wepp@~1.1.0","underscore@~1.5.0","wepp@~2.7.0","../modules/chosen/controller","../modules/common/first","../modules/common/search/controller","../modules/common/appdownload/controller","../modules/common/alert/controller","../modules/chosen/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Wepp = require('wepp');
var ChosenController = require('../modules/chosen/controller');
var City = Wepp.Module.City;
var UI = Wepp.UI;
var First = require('../modules/common/first');
var Search = require('../modules/common/search/controller');
var Download = require('../modules/common/appdownload/controller');
var Confirm = require('../modules/common/alert/controller');

exports.Controller = Wepp.PageController.extend({
    show:function(){
        // if(First.checkFirst()){
        //     return;
        // }

        //show menu
        ThisApp.Menu.show().switchTo(0);

        this.firstSelect = First.firstSelect();
        var self = this;
        ThisApp.openPage(true).then(function(page){
            self.page = page;
            self.region();
            self.fetchList(page);
        },function(page){
            self.page = page;
            if(page._cached_city != City.getId()){
                //删除附近团购上url的经纬度

                ThisApp.Menu.setUrl(1,"#list~c_10~f_2");

                //重新加载列表
                self.fetchList(self.page);
            }
        });
    },
    fetchList:function(page){
        var self = this;
        //show search
        self.initSearch(page.layout.search);

        if(self.cookieGeo()){
            return;
        }
        ThisApp.Geo.get(true).then(function(crd){
            //定位成功
            self.geo(crd);
        },function(){
            //定位失败，提示是否要选城市，直接加载所选城市的推荐
            if(!self.firstSelect && ThisApp.pageRegion.isCurrentPage(self.page)){
                var cfm = new Confirm({
                    content:"无法获取到您的定位",
                    buttons:[{
                        text:"切换城市",
                        url:"#citylist",
                        click:function(){
                            cfm.hide();
                        }

                    },{
                        text:"取消",
                        click:function(){
                            cfm.hide();
                            self.showCurrentCity();
                        }
                    }]
                });
                UI.loading.hide();
                cfm.show();
            }else {
                self.showCurrentCity();
            }
        });
    },
    showChosen:function(data){
        var self = this;
        var cc = this.chosen = new ChosenController(data);
        cc.render(this.page.layout.chosen);
        var apiStartTime = + new Date();
        if(data.lat){
            this.setNearByUrl(data.lat,data.lng);
        }
        cc.model.on('change',function(model){
            self.performance.set({
                r_api:+new Date() - apiStartTime
            });

            var list = model.get('list');
            ThisApp.Share.config({
                img_url:list && list[0] && list[0].bigImageUrl,
                link:location.href
            });
        });

        self.page._cached_city = data.cityid;

        //在展示完单子后展示下载
        cc.on('render',function(){
            self.download();
            self.performance.set({
                r_ready:+new Date() - self.performance.startTime,
                r_load:+new Date() - self.performance.startTime
            });
        });
    },
    region:function(){
        this.page.initRegion({
            template:_.template(require('../modules/chosen/layout.html')),
            regions:{
                search:".search_holder",
                chosen:".J_cnt",
                download:".download"
            }
        });
    },
    cookieGeo:function(){
        //获取经纬度
        //如果从cookie中能直接拿到,直接用经纬度
        var crd = ThisApp.Geo.cookieGeo();
        if(crd && crd.cityid === City.getId()){
            //定位的城市和用户选择的城市一致,传经纬度拿精确的单子
            this.showGeoCity(crd);
            return true;
        }
        return false;
    },
    geo:function(crd){
        var self = this;
        if(City.getId() == crd.cityid){
            //城市没有改变
            this.showGeoCity(crd);
        }else {
            //城市改变了
            if(!this.firstSelect && ThisApp.pageRegion.isCurrentPage(this.page)){
                //如果用户不是选完城市后的第一次访问,
                //问用户是否需要切换城市
                var cfm = new Confirm({
                    content:"系统定位到您在"+crd.cityname+",是否切换?",
                    buttons:[{
                        text:"取消",
                        click:function(){
                            self.showCurrentCity();
                            cfm.hide();
                        }
                    },{
                        text:"切换",
                        click:function(){
                            cfm.hide();
                            self.showGeoCity(crd);
                        }
                    }]
                });
                UI.loading.hide();
                cfm.show();
            }else {
                self.showCurrentCity();
            }
        }
    },
    showGeoCity:function(crd){
        this.showChosen({
            cityid:crd.cityid,
            lat:crd.lat,
            lng:crd.lng
        });
    },
    showCurrentCity:function(){
        this.showChosen({
            cityid: City.getId()
        });
    },
    setNearByUrl:function(lat,lng){
        //设置附近团购的url，把经纬度带到url上
        ThisApp.Menu.setUrl(1,"#list~c_10~f_2~lat_"+lat+"~lng_"+lng);
    },
    initSearch:function(region){
        var self = this;
        var search = new Search();
        search.show(region);



        search.on('touch',function(){
            ThisApp.Menu.hide();
        });

        search.on('focus',function(){
            ThisApp.Menu.hide();
            self.chosen && self.chosen.hide();

            ThisApp.mv({'module':"index_search"});
        });

        search.on('blur',function(){
            ThisApp.Menu.show();
            self.chosen && self.chosen.show();
        });

        search.on('search',function(value){
            //跳转到搜索页面
            ThisApp.redirect("#list~k_"+encodeURIComponent(value));
        });
    },
    download:function(){
        new Download({
            url:'http://m.api.dianping.com/downloadlink?redirect=3123',
            region:this.page.layout.download,
            tipText:'喜欢精选美食频道吗?',
            popText:'发现更多优惠，还能获得现金返利',
            mv:{'module':'index_download'}
        });
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/common/appdownload/template.html", [], function(require, exports, module) {
module.exports = '<div class="tip-cnt"><p><%=tipText%></p><p>点击右上角<strong><span class="J_share">【收藏】</span></strong>或<strong><span class="J_share">【分享】</span></strong>给小伙伴们！</p></div><div class="appload"><a href="<%=url%>" class="tip"><i class="arr"></i><%=popText%></a><a href="<%=url%>" class="link J_d"><i class="logo"></i>马上去大众点评享优惠</a></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/app", ["wepp@~2.7.0","./base/share","./modules/common/footmenu/controller","./util/geolocation","./util/cache","zepto-wepp@~1.1.0","./modules/common/first","./config/deviceconfig","./config/routeconfig","./config/envconfig","./modules/common/overlay","hippo@~1.2.0","./filters/login"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/filters/login", ["zepto-wepp@~1.1.0","wepp@~2.7.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/index", ["./js/app","./js/pages/chosen"], function(require, exports, module) {
var app = require('./js/app');
//直接打包进来的js
require('./js/pages/chosen');

module.exports = app;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ],
    "main": true
});