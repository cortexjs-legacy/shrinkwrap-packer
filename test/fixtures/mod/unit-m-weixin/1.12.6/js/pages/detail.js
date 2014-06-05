define("unit-m-weixin@1.12.6/js/util/distance", [], function(require, exports, module) {
var PI = Math.PI;
var RAD = 6371000; //地球半径,米

module.exports = function(from,to){
    /*
     * 根据经纬度计算距离 
     * @param from{Object}
     * @param to{Object}
     *
     * {
     *      lat:{Number},
     *      lng:{Number}
     * }
     * */

    var lat1 = from.lat / 180.0 * PI;
    var lon1 = from.lng / 180.0 * PI;
    var lat2 = to.lat / 180.0 * PI;
    var lon2 = to.lng / 180.0 * PI;
    var dlat = lat2 - lat1;
    var dlon = lon2 - lon1;

    var a = Math.sin(dlat / 2.0) * Math.sin(dlat / 2.0) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2.0) * Math.sin(dlon / 2.0);
    var c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

    var distance = RAD * c;
    var distanceText;

    /*
    *  小于100米的显示 <100m
    *  小于1000m的显示 xxx m 取整
    *  大于1000m的显示 x.x km 精确到1位
    *  大于100km的显示 >100km
    * */

   //test code
    // var test = [0,50,100,782,825,1000,1200,100000,1002000];
    // var distance = test[Math.floor(Math.random()*test.length)];

   if(distance<100){
       distanceText = '<100m';
   }else if(distance>=100 && distance<1000){
       distanceText = Math.round(distance/10)*10+"m";
   }else if(distance>=1000 && distance < 100000){
       var km =  (distance/1000).toFixed(1);
       distanceText = (km.charAt(km.length-1) ==="0" ? parseInt(km):km) +"km";
   }else {
       distanceText = ">100km";
   }

    return {
        distance : distance,
        distanceText:distanceText
    };
};

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/entities/detail", ["backbone@~1.1.0","../base/weixin","wepp@~2.7.0","./dealstatus"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.6/js/modules/detail/layout.html", [], function(require, exports, module) {
module.exports = '<div class="detail-page"><div class="dealbox cut"></div><div class="shop-list cut"><div class="loading" style="height:100px;"></div></div><div class="detail-extra cut"></div><div class="download"></div><div class="J_buy Fix"></div><div class="height-box"></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/detail/detailmain/template.html", [], function(require, exports, module) {
module.exports = '<div class="img"><img src="<%=bigImageUrl%>" width="100%" height="auto"></div><h3><%= contentTitle %></h3><div class="detail-cnt"><%=titleDesc%></div><ul class="tag-mark Fix"><li><i class="<%=refund?\'icon-s\':\'icon-e\'%>"></i><span class="extra"><%=refund?\'支持\':\'不支持\'%>随时退</span></li><li><i class="<%=refund?\'icon-s\':\'icon-e\'%>"></i><span class="extra"><%=refund?\'支持\':\'不支持\'%>过期退</span></li></ul><div class="more-info"><div class="f-l-msg">已售 <%=buyerCounter%></div><div class="f-r-msg"><%= time%></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/common/appdownload/controller", ["marionette@~1.4.0","wepp@~2.7.0","./template.html","backbone@~1.1.0","zepto-wepp@~1.1.0","../overlay"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.6/js/modules/detail/detailshop/template.html", [], function(require, exports, module) {
module.exports = '<%if(shopNum && list){%><%if(shopNum===1){ var item = list[0];%><div class="shop-list"><div class="cnt Fix"><p class="tit"><%= item.name %><%= item.branchName ? "(" + item.branchName +")" : "" %></p><p class="star star-<%= item.shopPower %>"></p><p class="intro"><%= item.address %></p><% if(item.phoneNo){%><a href="tel:<%= item.phoneNo %>" class="phone-link"><span class="icon-call"></span></a><%}%></div></div><%}else{%><div class="c-box"><%if(list[0].distance){ var item = list[0];%><div class="shop-list" style="margin-left:-10px;"><div class="cnt Fix"><p class="nearest">离你最近</p><p class="tit"><%= item.name %><%= item.branchName ? "(" + item.branchName +")" : "" %></p><p class="star star-<%= item.shopPower %>"></p><p class="intro"><%= item.address %></p><% if(item.phoneNo){%><a href="tel:<%= item.phoneNo %>" class="phone-link"><span class="icon-call"></span></a><%}%><%if(item.distance){%><span class="distance"><%=item.distance%></span><%}%></div></div><%}%><a class="item" href="#shoplist~<%=id%>" onclick="ThisApp.mv({module:\'deal_shop\'})">查看全部<%=shopNum%>家适用商户<i class="arrow-ent"></i></a></div><%}}%>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/common/detailextra/template.html", [], function(require, exports, module) {
module.exports = '<%extra.forEach(function(item){%><dl class="detail-list"><dt class="title"><%= item.title %></dt><dd class="con <%= item.red ? \'red\' : \'\' %>"><%= item.cont %></dd></dl><%})%>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/detail/buy/template.html", [], function(require, exports, module) {
module.exports = '<div class="buy-box"><span class="new-price">&#165;<%= price %></span><span class="old-price">&#165;<%= originalPrice %></span><a onclick="ThisApp.mv({module:\'deal_buy\'})" class="J_buy <%= status == 0 ? \'y-btn\' : \'n-btn\' %> f-r"<% if(status == 0) {%>href="<%=nextUrl%>"<% }else{ %>href="javascript:;"<% }%>><% if (status == 1) { %>已卖光<% } else if (status == 2) { %>已结束<% } else if (status == 4) { %>即将开始<% } else { %>立即抢购<% } %></a></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/common/appdownload/template.html", [], function(require, exports, module) {
module.exports = '<div class="tip-cnt"><p><%=tipText%></p><p>点击右上角<strong><span class="J_share">【收藏】</span></strong>或<strong><span class="J_share">【分享】</span></strong>给小伙伴们！</p></div><div class="appload"><a href="<%=url%>" class="tip"><i class="arr"></i><%=popText%></a><a href="<%=url%>" class="link J_d"><i class="logo"></i>马上去大众点评享优惠</a></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/common/overlay", ["zepto-wepp@~1.1.0","underscore@~1.5.0","backbone@~1.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.6/js/modules/detail/buy/controller", ["wepp@~2.7.0","zepto-wepp@~1.1.0","./template.html"], function(require, exports, module) {
var Wepp = require('wepp');
var UI = Wepp.UI;
var $ = require('zepto-wepp');

module.exports = Wepp.Module.BaseController.extend({
    initModel:function(model){
        return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    onRender:function(){
        var self = this;
        self.el = (self.page && self.page.el.find('.buy-box') || self.view.$el);
        if(self.page && self.page.isShown ){
            self.trans();
        }
        self.waiting(self.model);

        self.el.find('.J_buy').on('click',function(){
            self.cacheModel();
        });
    },
    waiting:function(model){
        //如果服务器返回waitSubmitOrderSeconds
        //当用户点击立即抢购，倒计时，同时再请求下接口，判断是否可以继续购买
        var second = model.get('waitSubmitOrderSeconds');
        if(!second){
            return;
        }
        this.available = false;
        this.waitSecond = second;
        var self = this;
        (this.page && this.page.el || this.view.$el).find('.J_buy.y-btn').on('click',function(e){
            if(self.available){
                return;
            }
            e.preventDefault();
            self.count(second);
            self.tryAgain();
        });
        this.page && this.page.on('remove',function(){
            UI.alertClose();
        });
    },
    count:function(){
        var s = this.waitSecond;
        var ol = UI.alert('服务器繁忙,请稍后再试哦～</br><span class="J_count">'+s+"</span>",this.waitSecond*1000);
        var interval = setInterval(function(){
            if(s){
                ol.find('.J_count').text(--s);
            }else {
                clearInterval(s);
            }
        },1000);
    },
    tryAgain:function(){
        var self = this;
        $.ajax({
            url:this.model.url,
            dataType:"json",
            success:function(res){
                if(!res.data.waitSubmitOrderSeconds){
                    self.available = true;
                }else {
                    self.waitSecond =  res.data.waitSubmitOrderSeconds;
                }
            }
        });
    },
    setPage:function(page){
        var self = this;
        this.page = page;
        page.on('reshow',self.trans,self);
        page.on('show',function(){
            //这里有可能页面还没加载出来
            if(self.el && self.el.length){
                self.trans();
            }
        });
        page.on('before:animate:back',function(){
            //page 的scrollTop 改变 会把按钮拉上去
            self.el && self.el.css({
                bottom:-page.scrollTop
            });

        });
        return this;
    },
    trans:function(){
        if(!this.el){
            return
        }
        var self = this;
        //remove transform
        self.page && self.page.el.css('-webkit-transform','none');

        //fix position fixed bug
        //don't ask me why
        //i don't know
        //but it works
        self.el.css('position','absolute');
        setTimeout(function(){
            self.el.css({
                'position':'fixed',
                'bottom':0
            });
        },0);
    },
    cacheModel:function(){
        //点击抢购的时候 缓存下model
        //TODO

    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/base/weixin", [], function(require, exports, module) {
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
define("unit-m-weixin@1.12.6/js/modules/common/detailextra/controller", ["wepp@~2.7.0","./template.html"], function(require, exports, module) {
module.exports = require('wepp').Module.BaseController.extend({
    initModel:function(model){
        return model;
    },
    initTpl:function(){
        return require("./template.html")
    }
});


}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/entities/dealstatus", [], function(require, exports, module) {
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
define("unit-m-weixin@1.12.6/js/modules/detail/detailshop/controller", ["backbone@~1.1.0","../../../entities/shoplist","wepp@~2.7.0","./template.html"], function(require, exports, module) {
var Backbone = require('backbone');
var ShopList = require("../../../entities/shoplist");

module.exports = require('wepp').Module.BaseController.extend({
    initModel:function(options){

        var model = new ShopList({
            lat:options.lat,
            lng:options.lng,
            id:options.id
        });
        model.set({
            shopNum:options.dealModel.get('shopNum'),
            list:null
        });

        options.dealModel.on('change',function(m){
            model.set('shopNum',m.get('shopNum'));
        });

        return model;
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
define("unit-m-weixin@1.12.6/js/entities/areacode", [], function(require, exports, module) {
﻿    module.exports = [{"id":1,"areaCode":"021"},{"id":2,"areaCode":"010"},{"id":4,"areaCode":"020"},{"id":7,"areaCode":"0755"},{"id":8,"areaCode":"028"},{"id":9,"areaCode":"023"},{"id":10,"areaCode":"022"},{"id":3,"areaCode":"0571"},{"id":5,"areaCode":"025"},{"id":6,"areaCode":"0512"},{"id":11,"areaCode":"0574"},{"id":12,"areaCode":"0514"},{"id":13,"areaCode":"0510"},{"id":14,"areaCode":"0591"},{"id":15,"areaCode":"0592"},{"id":16,"areaCode":"027"},{"id":17,"areaCode":"029"},{"id":18,"areaCode":"024"},{"id":19,"areaCode":"0411"},{"id":344,"areaCode":"0731"},{"id":70,"areaCode":"0431"},{"id":134,"areaCode":"0791"},{"id":21,"areaCode":"0532"},{"id":79,"areaCode":"0451"},{"id":22,"areaCode":"0531"},{"id":160,"areaCode":"0371"},{"id":345,"areaCode":"0898"},{"id":206,"areaCode":"0756"},{"id":110,"areaCode":"0551"},{"id":208,"areaCode":"0757"},{"id":267,"areaCode":"0871"},{"id":219,"areaCode":"0769"},{"id":35,"areaCode":"0351"},{"id":299,"areaCode":"0931"},{"id":24,"areaCode":"0311"},{"id":258,"areaCode":"0851"},{"id":224,"areaCode":"0771"},{"id":313,"areaCode":"0971"},{"id":325,"areaCode":"0991"},{"id":23,"areaCode":"0898"},{"id":46,"areaCode":"0471"},{"id":341,"areaCode":"00852"},{"id":342,"areaCode":"00853"},{"id":340,"areaCode":"00886"},{"id":207,"areaCode":"0754"},{"id":93,"areaCode":"0519"},{"id":102,"areaCode":"0573"},{"id":92,"areaCode":"0516"},{"id":101,"areaCode":"0577"},{"id":226,"areaCode":"0773"},{"id":29,"areaCode":"0312"},{"id":108,"areaCode":"0576"},{"id":148,"areaCode":"0535"},{"id":105,"areaCode":"0579"},{"id":104,"areaCode":"0575"},{"id":209,"areaCode":"0750"},{"id":129,"areaCode":"0595"},{"id":279,"areaCode":"0888"},{"id":94,"areaCode":"0513"},{"id":220,"areaCode":"0760"},{"id":26,"areaCode":"0335"},{"id":71,"areaCode":"0432"},{"id":36,"areaCode":"0352"},{"id":152,"areaCode":"0631"},{"id":27,"areaCode":"0310"},{"id":103,"areaCode":"0572"},{"id":179,"areaCode":"0717"},{"id":321,"areaCode":"0951"},{"id":33,"areaCode":"0316"},{"id":166,"areaCode":"0373"},{"id":211,"areaCode":"0668"},{"id":107,"areaCode":"0580"},{"id":217,"areaCode":"0662"},{"id":98,"areaCode":"0511"},{"id":25,"areaCode":"0315"},{"id":149,"areaCode":"0536"},{"id":162,"areaCode":"0379"},{"id":58,"areaCode":"0412"},{"id":84,"areaCode":"0459"},{"id":118,"areaCode":"0559"},{"id":212,"areaCode":"0758"},{"id":213,"areaCode":"0752"},{"id":28,"areaCode":"0319"},{"id":151,"areaCode":"0538"},{"id":238,"areaCode":"0813"},{"id":96,"areaCode":"0517"},{"id":145,"areaCode":"0533"},{"id":210,"areaCode":"0759"},{"id":205,"areaCode":"0751"},{"id":291,"areaCode":"0917"},{"id":140,"areaCode":"0797"},{"id":246,"areaCode":"0833"},{"id":137,"areaCode":"0792"},{"id":95,"areaCode":"0518"},{"id":161,"areaCode":"0371"},{"id":225,"areaCode":"0772"},{"id":62,"areaCode":"0416"},{"id":47,"areaCode":"0472"},{"id":155,"areaCode":"0539"},{"id":283,"areaCode":"0891"},{"id":242,"areaCode":"0816"},{"id":99,"areaCode":"0523"},{"id":150,"areaCode":"0537"},{"id":292,"areaCode":"029"},{"id":112,"areaCode":"0552"},{"id":59,"areaCode":"024"},{"id":97,"areaCode":"0515"},{"id":218,"areaCode":"0763"},{"id":63,"areaCode":"0417"},{"id":147,"areaCode":"0546"},{"id":61,"areaCode":"0415"},{"id":184,"areaCode":"0716"},{"id":69,"areaCode":"0429"},{"id":204,"areaCode":"0743"},{"id":153,"areaCode":"0633"},{"id":31,"areaCode":"0314"},{"id":144,"areaCode":"0793"},{"id":277,"areaCode":"0872"},{"id":111,"areaCode":"0553"},{"id":32,"areaCode":"0317"},{"id":30,"areaCode":"0313"},{"id":185,"areaCode":"0713"},{"id":106,"areaCode":"0570"},{"id":169,"areaCode":"0374"},{"id":214,"areaCode":"0753"},{"id":178,"areaCode":"0719"},{"id":177,"areaCode":"0714"},{"id":121,"areaCode":"0557"},{"id":89,"areaCode":"0456"},{"id":164,"areaCode":"0372"},{"id":227,"areaCode":"0774"},{"id":198,"areaCode":"0744"},{"id":65,"areaCode":"0419"},{"id":194,"areaCode":"0734"},{"id":216,"areaCode":"0762"},{"id":66,"areaCode":"0427"},{"id":180,"areaCode":"0710"},{"id":192,"areaCode":"0731"},{"id":113,"areaCode":"0554"},{"id":146,"areaCode":"0632"},{"id":119,"areaCode":"0550"},{"id":117,"areaCode":"0556"},{"id":193,"areaCode":"0731"},{"id":114,"areaCode":"0555"},{"id":228,"areaCode":"0779"},{"id":195,"areaCode":"0739"},{"id":60,"areaCode":"0414"},{"id":156,"areaCode":"0534"},{"id":168,"areaCode":"0393"},{"id":88,"areaCode":"0453"},{"id":130,"areaCode":"0596"},{"id":158,"areaCode":"0543"},{"id":80,"areaCode":"0452"},{"id":135,"areaCode":"0798"},{"id":196,"areaCode":"0730"},{"id":132,"areaCode":"0597"},{"id":131,"areaCode":"0599"},{"id":157,"areaCode":"0635"},{"id":172,"areaCode":"0377"},{"id":133,"areaCode":"0593"},{"id":128,"areaCode":"0598"},{"id":260,"areaCode":"0852"},{"id":234,"areaCode":"0774"},{"id":294,"areaCode":"0911"},{"id":64,"areaCode":"0418"},{"id":115,"areaCode":"0561"},{"id":222,"areaCode":"0663"},{"id":86,"areaCode":"0454"},{"id":247,"areaCode":"0817"},{"id":81,"areaCode":"0467"},{"id":281,"areaCode":"0887"},{"id":293,"areaCode":"0913"},{"id":127,"areaCode":"0594"},{"id":41,"areaCode":"0354"},{"id":182,"areaCode":"0724"},{"id":44,"areaCode":"0357"},{"id":78,"areaCode":"0433"},{"id":197,"areaCode":"0736"},{"id":167,"areaCode":"0391"},{"id":221,"areaCode":"0768"},{"id":163,"areaCode":"0375"},{"id":175,"areaCode":"0394"},{"id":67,"areaCode":"024"},{"id":120,"areaCode":"0558"},{"id":76,"areaCode":"0438"},{"id":255,"areaCode":"0837"},{"id":296,"areaCode":"0912"},{"id":265,"areaCode":"0855"},{"id":249,"areaCode":"0831"},{"id":141,"areaCode":"0796"},{"id":109,"areaCode":"0578"},{"id":295,"areaCode":"0916"},{"id":72,"areaCode":"0434"},{"id":100,"areaCode":"0527"},{"id":52,"areaCode":"0470"},{"id":331,"areaCode":"0996"},{"id":159,"areaCode":"0530"},{"id":138,"areaCode":"0790"},{"id":126,"areaCode":"0563"},{"id":307,"areaCode":"0937"},{"id":215,"areaCode":"0660"},{"id":173,"areaCode":"0370"},{"id":49,"areaCode":"0476"},{"id":186,"areaCode":"0715"},{"id":261,"areaCode":"0853"},{"id":223,"areaCode":"0766"},{"id":241,"areaCode":"0838"},{"id":124,"areaCode":"0558"},{"id":336,"areaCode":"0999"},{"id":190,"areaCode":"0728"},{"id":51,"areaCode":"0477"},{"id":231,"areaCode":"0775"},{"id":174,"areaCode":"0376"},{"id":252,"areaCode":"0835"},{"id":230,"areaCode":"0777"},{"id":339,"areaCode":"0993"},{"id":199,"areaCode":"0737"},{"id":257,"areaCode":"0834"},{"id":244,"areaCode":"0825"},{"id":245,"areaCode":"0832"},{"id":187,"areaCode":"0722"},{"id":276,"areaCode":"0691"},{"id":269,"areaCode":"0877"},{"id":154,"areaCode":"0634"},{"id":338,"areaCode":"0906"},{"id":202,"areaCode":"0745"},{"id":240,"areaCode":"0830"},{"id":171,"areaCode":"0398"},{"id":74,"areaCode":"0435"},{"id":38,"areaCode":"0355"},{"id":183,"areaCode":"0712"},{"id":251,"areaCode":"0818"},{"id":34,"areaCode":"0318"},{"id":142,"areaCode":"0795"},{"id":327,"areaCode":"0995"},{"id":116,"areaCode":"0562"},{"id":289,"areaCode":"0894"},{"id":136,"areaCode":"0799"},{"id":125,"areaCode":"0566"},{"id":334,"areaCode":"0998"},{"id":328,"areaCode":"0902"},{"id":139,"areaCode":"0701"},{"id":50,"areaCode":"0475"},{"id":75,"areaCode":"0439"},{"id":123,"areaCode":"0564"},{"id":91,"areaCode":"0457"},{"id":188,"areaCode":"0718"},{"id":232,"areaCode":"0775"},{"id":170,"areaCode":"0395"},{"id":143,"areaCode":"0794"},{"id":200,"areaCode":"0735"},{"id":43,"areaCode":"0350"},{"id":303,"areaCode":"0938"},{"id":326,"areaCode":"0990"},{"id":320,"areaCode":"0977"},{"id":329,"areaCode":"0994"},{"id":286,"areaCode":"0892"},{"id":270,"areaCode":"0875"},{"id":256,"areaCode":"0836"},{"id":73,"areaCode":"0437"},{"id":337,"areaCode":"0901"},{"id":332,"areaCode":"0997"},{"id":42,"areaCode":"0359"},{"id":297,"areaCode":"0915"},{"id":243,"areaCode":"0839"},{"id":250,"areaCode":"0826"},{"id":322,"areaCode":"0952"},{"id":39,"areaCode":"0356"},{"id":233,"areaCode":"0776"},{"id":268,"areaCode":"0874"},{"id":308,"areaCode":"0934"},{"id":248,"areaCode":"028"},{"id":77,"areaCode":"0436"},{"id":87,"areaCode":"0464"},{"id":48,"areaCode":"0473"},{"id":181,"areaCode":"0711"},{"id":235,"areaCode":"0778"},{"id":68,"areaCode":"0421"},{"id":239,"areaCode":"0812"},{"id":40,"areaCode":"0349"},{"id":351,"areaCode":"0955"},{"id":37,"areaCode":"0353"},{"id":290,"areaCode":"0919"},{"id":176,"areaCode":"0396"},{"id":305,"areaCode":"0936"},{"id":254,"areaCode":"028"},{"id":300,"areaCode":"0937"},{"id":259,"areaCode":"0858"},{"id":312,"areaCode":"0941"},{"id":288,"areaCode":"0897"},{"id":203,"areaCode":"0738"},{"id":278,"areaCode":"0692"},{"id":314,"areaCode":"0972"},{"id":201,"areaCode":"0746"},{"id":229,"areaCode":"0770"},{"id":273,"areaCode":"0873"},{"id":262,"areaCode":"0856"},{"id":165,"areaCode":"0392"},{"id":82,"areaCode":"0468"},{"id":323,"areaCode":"0953"},{"id":85,"areaCode":"0458"},{"id":335,"areaCode":"0903"},{"id":266,"areaCode":"0854"},{"id":304,"areaCode":"0935"},{"id":397,"areaCode":"0391"},{"id":298,"areaCode":"0914"},{"id":83,"areaCode":"0469"},{"id":264,"areaCode":"0857"},{"id":306,"areaCode":"0933"},{"id":394,"areaCode":"0771"},{"id":253,"areaCode":"0827"},{"id":53,"areaCode":"0482"},{"id":90,"areaCode":"0455"},{"id":310,"areaCode":"0939"},{"id":56,"areaCode":"0478"},{"id":398,"areaCode":"0772"},{"id":315,"areaCode":"0970"},{"id":302,"areaCode":"0943"},{"id":272,"areaCode":"0878"},{"id":275,"areaCode":"0879"},{"id":280,"areaCode":"0886"},{"id":263,"areaCode":"0859"},{"id":54,"areaCode":"0479"},{"id":311,"areaCode":"0930"},{"id":330,"areaCode":"0909"},{"id":324,"areaCode":"0954"},{"id":316,"areaCode":"0973"},{"id":319,"areaCode":"0976"},{"id":271,"areaCode":"0870"},{"id":274,"areaCode":"0876"},{"id":282,"areaCode":"0883"},{"id":285,"areaCode":"0893"},{"id":318,"areaCode":"0975"},{"id":333,"areaCode":"0908"},{"id":284,"areaCode":"0895"},{"id":301,"areaCode":"0935"},{"id":287,"areaCode":"0896"},{"id":191,"areaCode":"0728"},{"id":309,"areaCode":"0932"},{"id":389,"areaCode":"0997"},{"id":189,"areaCode":"0728"},{"id":346,"areaCode":"0908"},{"id":45,"areaCode":"0358"},{"id":57,"areaCode":"0483"},{"id":55,"areaCode":"0474"},{"id":411,"areaCode":"0974"},{"id":410,"areaCode":"0898"},{"id":416,"areaCode":"0000"},{"id":417,"areaCode":"0000"},{"id":418,"areaCode":"0000"},{"id":419,"areaCode":"0000"},{"id":408,"areaCode":"0898"},{"id":409,"areaCode":"0994"},{"id":420,"areaCode":"0000"},{"id":421,"areaCode":"0000"},{"id":423,"areaCode":"0000"},{"id":427,"areaCode":"0000"},{"id":428,"areaCode":"0000"},{"id":867,"areaCode":"0000"},{"id":2310,"areaCode":"0898"},{"id":2321,"areaCode":"0000"},{"id":2323,"areaCode":"0000"},{"id":407,"areaCode":"0898"},{"id":385,"areaCode":"0579"},{"id":390,"areaCode":"0898"},{"id":391,"areaCode":"0898"},{"id":392,"areaCode":"0898"},{"id":393,"areaCode":"0898"},{"id":395,"areaCode":"0898"},{"id":396,"areaCode":"0898"},{"id":399,"areaCode":"0898"},{"id":400,"areaCode":"0898"},{"id":401,"areaCode":"0898"},{"id":402,"areaCode":"0898"},{"id":403,"areaCode":"0898"},{"id":404,"areaCode":"0719"},{"id":405,"areaCode":"0998"},{"id":406,"areaCode":"0898"},{"id":358,"areaCode":"0898"}];

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/detail/detailmain/controller", ["wepp@~2.7.0","./template.html"], function(require, exports, module) {
module.exports = require('wepp').Module.BaseController.extend({
    initModel:function(model){
        return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    onRender:function(){
        //img height
        var img  = this.view.$el.find('.img').eq(0);
        var width = img.width();
        img.height(width* 200/320);
    }
});


}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/entities/shoplist", ["backbone@~1.1.0","underscore@~1.5.0","wepp@~2.7.0","./areacode","../util/distance"], function(require, exports, module) {
var Backbone = require('backbone');
var _ = require('underscore');
var cityId = require("wepp").Module.City.getId(),
    AreaCode = require("./areacode");

var Distance = require('../util/distance');

module.exports = Backbone.Model.extend({
    initialize: function(param) {
        this.param = param;
    },
    url: function() {
        var param = this.param;
        var url = '/ajax/tuan/shoplistgn.json?'+ 'dealid=' + param.id + '&cityid=' + cityId;
        if(param.lat){
            //有经纬度
            url+=('&lat='+ param.lat+"&lng="+param.lng);
        }
        if(this.get('nextStartIndex')){
            url+=('&start='+this.get('nextStartIndex'));
        }
        return url;
    },
    parse: function(res){
        var self = this;
        var list = res.data.list;
        var parsedList = (list || []).map(function(item) {
            var cityID = item.cityID || cityId;
            var areaCode = _.find(AreaCode, function(city) {
                return city.id == cityID;
            }).areaCode;

            item.phoneNo = item.phoneNo? (areaCode + "-" + item.phoneNo):"";
            if(self.param.lat && item.latitude){
                //计算距离
                item.distance = Distance({
                    lat:self.param.lat,
                    lng:self.param.lng
                },{
                    lat:item.latitude,
                    lng:item.longitude
                }).distanceText;
            }
            return item;
        });
        res.data.list = parsedList;

        return res.data;
    },
    more:function(){
        this.fetch();
    }
});



}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/pages/detail", ["zepto-wepp@~1.1.0","underscore@~1.5.0","wepp@~2.7.0","../modules/detail/detailmain/controller","../modules/detail/detailshop/controller","../modules/common/detailextra/controller","../modules/detail/buy/controller","../modules/common/appdownload/controller","../entities/detail","../modules/detail/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Wepp = require('wepp');
var Url = Wepp.Url;

//sub app Detail 详情页
var DetailMainController = require("../modules/detail/detailmain/controller");
var ShopController = require("../modules/detail/detailshop/controller");
var DetailExtraController = require("../modules/common/detailextra/controller");
var BuyBoxController = require("../modules/detail/buy/controller");
var City = Wepp.Module.City;
var Download = require('../modules/common/appdownload/controller');
var DetailModel = require('../entities/detail');


var DetailController = Wepp.PageController.extend({
    initialize:function(){
        //listen to before send pv
        var send = false;
        this.on('before_pv',function(pv){
            if(send || !window.HIPPO_DATA || !window.HIPPO_DATA.request_id){
                return;
            }
            send = true;
            pv.data = pv.data||{};
            pv.data.referrequestid = window.HIPPO_DATA.refer_request_id;
            pv.data.reqid = window.HIPPO_DATA.request_id;
        });

        //是否是预加载了
        if(ThisApp.preload){
            //判断router是否匹配
            var match = ThisApp.preload.router.match(/detail~(\d+)/);
            if(match){
                this.preload();
                this.preloadIds = {}; //做个缓存，避免重复处理
            }
        }
    },
    show: function(id) {
        var self = this;
        var param = {
            id: id,
            cityid: City.getId()
        };
        var model = new DetailModel(param);

        ThisApp.openPage().then(_.bind(function(page) {

            self.page = page;
            page.initRegion({
                template:_.template(require('../modules/detail/layout.html')),
                regions:{
                    'dealbox': '.dealbox',
                    'shop': '.shop-list',
                    'extra': '.detail-extra',
                    'buy': '.J_buy',
                    'download':'.download'
                }
            });

            (new DetailMainController(model)).render(page.layout.dealbox);

            (new BuyBoxController(model)).render(page.layout.buy).setPage(page);

            (new DetailExtraController(model)).render(page.layout.extra);


            ThisApp.Geo.get(true).then(function(crd){
                //定位成功
                new ShopController({
                    dealModel:model,
                    lat:crd.lat,
                    lng:crd.lng,
                    id:id
                }).render(page.layout.shop);
            },function(){
                //定位失败
                new ShopController({
                    dealModel:model,
                    id:id
                }).render(page.layout.shop);
            });

            model.on('change',function(data){
                self.download(model);

                //设置分享
                ThisApp.Share.config({
                    img_url:data.get('bigImageUrl'),
                    link:location.href,
                    desc:"现价￥"+ data.get('price')+"\n"+(data.get('discount')*10).toFixed(1)+"折",
                    title:data.get('contentTitle'),
                    timelineTitle:data.get('price')+"元["+ (data.get('discount')*10).toFixed(1)+"折]"+data.get('contentTitle')
                });
            });

            model.fetch();

        },this),_.bind(function(page){
            if(ThisApp.preload && ThisApp.preload.router.match(/detail~(\d+)/) && this.preloadIds && !this.preloadIds[id]){

                //设置分享
                var el = page.el;
                var price = el.find('.J_buy .new-price').html().substr(1);
                var oPrice = el.find('.J_buy .old-price').html().substr(1);
                var discount;
                var title =el.find('.dealbox h3').html()
                if(price && oPrice){
                    discount = (price/oPrice*10).toFixed(1);
                }

                ThisApp.Share.config({
                    img_url:el.find('.dealbox img').attr('src'),
                    link:location.href,
                    desc:"现价￥"+price+"\n"+(discount?(discount+"折"):""),
                    title:title,
                    timelineTitle:price+"元"+(discount?("["+discount+"折]"):"") + title
                });
                //购买按钮
                var buy = new BuyBoxController(model);
                buy.setPage(page);
                model.on('change',function(){
                    buy.onRender();
                });
                model.fetch();
                this.preloadIds[id] = true;
            }
        },this));
    },
    download:function(model){
        new Download({
            url:'http://m.api.dianping.com/downloadlink?redirect=3124',
            region:this.page.layout.download,
            tipText:'喜欢'+model.get('shortTitle')+'吗?',
            popText:'浏览该团购更多精美图片',
            mv:{module:"deal_download"}
        });
    },
    preload:function(){
        //预加载了团购页面
        // console.log('dealing preload page');
        //替换history
        // var query = Url.parse(location.search.substr(1));
        // delete query.dealid;
        // var replaceUrl = location.href.replace(/\?[^#]*/,"?"+Url.stringify(query));
        // window.history.replaceState({},document.title,replaceUrl);
        // window.history.replaceState({},document.title,location.href.replace(/dealid=\d+/,''));
    }
});


exports.Controller = DetailController;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});