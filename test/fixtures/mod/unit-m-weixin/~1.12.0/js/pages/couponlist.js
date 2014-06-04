define("unit-m-weixin@~1.12.0/js/modules/couponlist/list/controller", ["marionette@~1.4.0","backbone@~1.1.0","./template.html","zepto-wepp@~1.1.0","underscore@~1.5.0","../../../entities/couponlist"], function(require, exports, module) {
var Marionette = require('marionette');
var View = require("backbone").View.extend({
    template:require('./template.html'),
    tagName:"ul"
});
var $ = require('zepto-wepp'),
    _ = require('underscore'),
    Coupon = require("../../../entities/couponlist");

module.exports = Marionette.Controller.extend({
    initialize: function(param) {
        var page = this.page = param.page;
        delete param.page;

        this.paramModel = new Coupon.ParamModel(param);
        var collection = this.collection = new Coupon.CouponCollection(this.paramModel);
        var view = this.view = new View({
            collection: collection
        });
        var self = this;

        var listHeight = 0;

        function setHeight(){
            listHeight = self.region.$el.get(0).offsetHeight;
        }

        collection.on("reset",function(data){
            var $el = self.region.$el;
            if(!collection.models.length) {
                $el.html('<p class="msg" style="text-align:center;padding-top:20px;">您没有未使用的抵用券</p>');
                return;
            }
            var html = '';
            collection.toJSON().forEach(function(data){
                html+=_.template(view.template,data);
            });
            view.$el.append(html);
            $el.empty().append(view.$el);
            setHeight();
        });

        var WIN = $(window);
        WIN.on('scroll',function(){
            if(ThisApp.pageRegion.isCurrentPage(page)){
                if(WIN.scrollTop() + WIN.height() > listHeight -60){
                    console.log('more');
                    self.more();
                }
            }
        });

        this.listenToNext();
    },
    show: function(region, initIscroll) {
        this.region = region;
        region.ensureEl();
    },
    isEnd:function(){
        return this._isEnd;
    },
    next:function(){
        return this._next;
    },
    listenToNext:function(){
        this.collection.on("sync",_.bind(function(collection,res){
            this._isEnd = res.data.isEnd;
            this._next = res.data.nextStartIndex;
        },this));
    },
    more:function(){
        if(this.isEnd()){
            return;
        }
        this.showLoadingText();
        var pm = this.collection.paramModel;
        pm.set({
            "start":this.next()
        });
    },
    showLoading:function(){
        this.view.$el.find('.more-loading').removeClass('hide');
    },
    hideLoading:function(){
        this.view.$el.find('.more-loading').addClass('hide');
    },
    hideLoadingText:function(){
        this.view.$el.find('.more-loading').html('');
    },
    showLoadingText:function(){
        this.view.$el.find('.more-loading').html('正在加载...');
    },
    toggleLoading:function(){
        //加载更多的loading
        if(this.isEnd()){
            this.hideLoading();
        }else {
            this.showLoading();
        }
    },
    initLoading:function(){
        var el = this.view.$el;
        if(!el.find('.more-loading').length){
            el.append('<div class="more-loading hide"><div>正在加载...</div></div>');
        }
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/couponlist/layout.html", [], function(require, exports, module) {
module.exports = '<div class="coupon-list"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/couponlist/list/template.html", [], function(require, exports, module) {
module.exports = '<li><div class="coupon_bg">折抵<%=priceStr%> </div><div class="coupon_link" ><h3 class="title"><%= title %></h3><p class="coupon_time"><%=beginDate%>至<%=expiredDate%>有效</p></div></li>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/entities/couponlist", ["backbone@~1.1.0","underscore@~1.5.0"], function(require, exports, module) {
var Backbone = require('backbone');
var _ = require('underscore');

var CouponModel = Backbone.Model.extend({}),
    CouponList = Backbone.Collection.extend({
    initialize: function(paramModel) {
        this.paramModel = paramModel;
        this.paramModel.on("change", _.bind(this.showList, this));
        this.paramModel.trigger('change');
    },
    model: CouponModel,
    baseUrl: '/ajax/tuan/discountgn.json?',
    setUrl: function(filter) {
        this.url = this.baseUrl + 'start='+(this.paramModel.get('start')||0)+'&r='+ Math.random();
    },
    parse: function(res) {
        var self = this;
        if(res.code == 200) {
            var list =  res.data.discountList|| [];
            return list.map(function(item){
                item.expiredDate = self.parseDate(item.expiredDate);
                item.beginDate =  self.parseDate(item.beginDate);
                return item;
            });
        } else if(res.code == 401) {
            window.location = "";
        }
    },
    showList: function() {
        this.setUrl();
        this.fetch({
            reset:true
        });
    },
    parseDate:function(timestamp){
        var d = new Date(timestamp);
        var fix = function(num){
            var s = '0'+num;
            return s.substr(s.length-2);
        };
        return d.getFullYear()+"-"+ fix(d.getMonth()+1)+"-"+fix(d.getDate());

    }
});

var ParamModel = Backbone.Model.extend();

exports.CouponCollection = CouponList;
exports.ParamModel = ParamModel;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/pages/couponlist", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/couponlist/list/controller","../modules/couponlist/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var ListController = require("../modules/couponlist/list/controller");

var Controller = Marionette.Controller.extend({
    show: function() {
        ThisApp.openPage().then(function(page) {
            page.initRegion({
                template: _.template(require('../modules/couponlist/layout.html')),
                regions:{
                    'list': '.coupon-list'
                }
            });
            var listController = new ListController({
                type: 1,
                page:page
            });
            listController.show(page.layout.list);
        });
    }
});

exports.Controller = Controller;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});