define("unit-m-weixin@1.12.6/js/modules/receiptlist/list/controller", ["backbone@~1.1.0","./template.html","underscore@~1.5.0","zepto-wepp@~1.1.0","marionette@~1.4.0","../../../entities/receiptlist"], function(require, exports, module) {
var View = require("backbone").View.extend({
    template:require('./template.html'),
    tagName:'ul'
});
var _ = require('underscore');
var $ = require('zepto-wepp');
var Marionette = require('marionette');
var Receipt = require("../../../entities/receiptlist");

var WIN = $(window);

module.exports = Marionette.Controller.extend({
    initialize: function(param) {
        var page = param.page;
        delete param.page;

        param.start = param.start || 0;

        var self = this;

        self.paramModel = new Receipt.ParamModel(param);
        var collection = self.collection = new Receipt.ReceiptCollection(self.paramModel);

        collection.clearCache();
        var view = self.view = new View({
            collection: collection
        });

        collection.on("reset",this.renderList,this);

        this.listenToNext();

        this.listHeight = 0;
        this.resetHtml = true;

        this._isEnd = true;

        WIN.on('scroll',function(){
            if(ThisApp.pageRegion.isCurrentPage(page)){
                if(WIN.scrollTop() + WIN.height() > self.listHeight -60){
                    self.more();
                }
            }
        });
    },
    setHeight:function(){
        this.listHeight = this.region.$el.get(0).offsetHeight;
    },

    show: function(region) {
        this.region = region;
    },
    isEnd:function(){
        return this._isEnd;
    },
    next:function(){
        return this._next;
    },
    listenToNext:function(){
        this.collection.on("sync",function(collection,res){
            this._isEnd = res.data.isEnd;
            this._next = res.data.nextStartIndex;
            if(this._isEnd){
                this.hideLoad();
            }
        },this);
    },
    restart:function(){
        var self = this;
        this.collection.paramModel.set({
            start:0,
            force:Math.random()
        });
        this.resetHtml = true;
    },
    more:function(){
        if(this.isEnd()){
            return;
        }
        this.showLoad();
        this.collection.paramModel.set({
            "start":this.next()
        });
        this.resetHtml = false;
    },
    showLoad:function(){
        this.view.$el.parent().next().css('visibility','visible');
    },
    hideLoad:function(){
        this.view.$el.parent().next().css('visibility','hidden');
    },
    renderList:function(data){
        var collection = this.collection;
        var view = this.view;
        var region = this.region;

        region.ensureEl();
        if(!collection.models.length && this.resetHtml) {
            region.$el.html('<p class="msg">您没有未使用的团购券</p>');
            return;
        }
        var html = '';
        collection.toJSON().forEach(function(d){
            html+= _.template(view.template,d);
        });
        view.$el[this.resetHtml?'html':'append'](html);
        region.$el.empty().append(view.$el);
        this.setHeight();
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/receiptlist/layout.html", [], function(require, exports, module) {
module.exports = '<div class="receipt-list"><div class="loading" style="height:200px;"></div></div><div class="more-loading" style="visibility:hidden">正在加载...</div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/receiptlist/list/template.html", [], function(require, exports, module) {
module.exports = '<li><a href="#receiptdetail~<%= id %>" class="item<% if(type == 1) { %> unused<% } %>"><% if(type == 1) { %><div class="remain">剩余<span class="day"><strong><%= day %></strong>天</span></div><% } %><div class="info"><h3 class="title"><%= title %></h3><% if(type == 1) { %><p>序列号 <span class="num"><%= num %></span></p><% } %><p class="expire"><%= date %></p></div></a></li>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/entities/receiptlist", ["backbone@~1.1.0","underscore@~1.5.0"], function(require, exports, module) {
var Backbone = require('backbone');
var localStorage = window.localStorage;
var ReceiptModel = Backbone.Model.extend({});
var _ = require('underscore');

var ReceiptList = Backbone.Collection.extend({
    initialize: function(paramModel) {
        this.paramModel = paramModel;
        this.paramModel.on("change", this.showList, this);
        this.paramModel.trigger('change');
    },
    model: ReceiptModel,
    baseUrl: '/ajax/tuan/couponlistgn.json?',
    setUrl: function(filter) {
        this.url = this.baseUrl + 'start='+(this.paramModel.get('start')||0)+'&filter=' + this.paramModel.get("type")+'&r='+ Math.random();
    },
    parse: function(res) {
        if(res.code == 200) {
            this.type = this.paramModel.get("type");
            var self = this;
            var list = res.data.list || [];
            var data = list.map(function(item) {
                var model = {
                    type: self.type,
                    id: item.id,
                    day: self.getDay(item.clientDate),
                    title: item.title,
                    num: item.serialNumberPair?self.getSerialNum(item.serialNumberPair.name):"",
                    date: self.getDate(item.clientDate),
                    relativeId: item.relativeDeal.id,
                    imageUrl: item.relativeDeal.imageUrl,
                    orderId : item.orderId,
                    refund : item.relativeDeal ? item.relativeDeal.refund : false
                };
                self.collectionArr.push(model);
                return model;
            });
            //合并原有的cache
            var cache ;
            try{
                cache = JSON.parse( localStorage.getItem('receiptCollection')) || [];
            }catch(e){
                cache = [];
            }
            localStorage.setItem("receiptCollection", JSON.stringify(cache.concat(this.collectionArr)));
            return data;
        } else if(res.code == 401) {
        }
    },
    getSerialNum: function(oriNum) {
        var len = oriNum.length,
        parts = parseInt(len / 4),
        num = "";
        for(var i = 0; i < parts; i++) {
            num += oriNum.substring(i * 4, (i + 1) * 4);
            num += " ";
        }
        num += oriNum.substring(i * 4, len);
        return num;
    },
    getDate: function(time) {
        var date = new Date(time);
        date = date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日";
        if(this.type == 1 || this.type == 3) {
            date += "过期";
        } else if(this.type == 2) {
            date += "已使用";
        }
        return date;
    },
    getDay: function(time) {
        return parseInt((time - (new Date()).getTime()) / 86400000);
    },
    showList: function() {
        this.collectionArr = [];
        this.setUrl();
        this.fetch({
            reset:true
        });
    },
    clearCache:function(){
        localStorage.removeItem('receiptCollection');
    }
});

var ParamModel = Backbone.Model.extend();

exports.ReceiptCollection = ReceiptList;
exports.ParamModel = ParamModel;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/pages/receiptlist", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/receiptlist/list/controller","../modules/receiptlist/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');
var ListController = require("../modules/receiptlist/list/controller");

var lc;

var ReceiptListController = Marionette.Controller.extend({
    show: function() {
        var self = this;

        ThisApp.openPage().then(function(page) {
            page.initRegion({
                template: _.template(require('../modules/receiptlist/layout.html')),
                regions:{
                    'header': 'header',
                    'list': '.receipt-list'
                }
            });
            self.renderList(page);
        },function(){
            lc && lc.restart();
        });
    },
    renderList:function(page){
        lc = new ListController({type: 1,page:page});
        lc.show(page.layout.list);
    }
});

exports.Controller = ReceiptListController;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});