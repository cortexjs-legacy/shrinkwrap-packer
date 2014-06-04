define("unit-m-weixin@1.12.5/js/entities/orderlist", ["backbone@~1.1.0", "underscore@~1.5.0"], function(require, exports, module) {
var Backbone = require('backbone');
var localStorage = window.localStorage;
var OrderModel = Backbone.Model.extend({});
var _ = require('underscore');

var OrderList = Backbone.Collection.extend({
    initialize: function(paramModel) {
        this.paramModel = paramModel;
        this.paramModel.on("change", _.bind(this.showList, this));
        this.paramModel.trigger('change');
    },
    model: OrderModel,
    baseUrl: '/ajax/tuan/orderlistgn.json?',
    setUrl: function(filter) {
        this.url = this.baseUrl + 'start='+(this.paramModel.get('start')||0)+'&filter=' + this.paramModel.get("type")+'&r='+ Math.random();
    },
    parse: function(res) {
        if(res.code == 200) {
            this.type = this.paramModel.get("type");
            var self = this,
            list = res.data.list,
            data = (list ? list : []).map(function(item) {

                var model = {
                    count: item.count,
                    id: item.id,
                    photo:item.photo,
                    status:item.status,
                    priceStr:item.priceStr,
                    title:item.title,
                    statusMemo:item.statusMemo
                };
                self.collectionArr.push(model);
                return model;
            });
            //合并原有的cache
            var cache ;
            try{
                cache = JSON.parse( localStorage.getItem('orderCollection')) || [];
            }catch(e){
                cache = [];
            }
            localStorage.setItem("orderCollection", JSON.stringify(cache.concat(this.collectionArr)));
            return data;
        } else if(res.code == 401) {
        }
    },
    showList: function() {
        this.collectionArr = [];
        this.setUrl();
        this.fetch({
            reset:true
        });

    },
    clearCache:function(){
        localStorage.removeItem('orderCollection');
    }
});

var OrderModel = Backbone.Model.extend();

exports.OrderCollection = OrderList;
exports.OrderModel = OrderModel;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/orderlist/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_order_list order-list-hack itemlist"></div><div class="more-loading J_orderlist_more_loading" style="visibility: visible;">正在加载...</div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/orderlist/list/controller", ["backbone@~1.1.0", "./template.html", "underscore@~1.5.0", "zepto-wepp@~1.1.0", "marionette@~1.4.0", "../../../entities/orderlist"], function(require, exports, module) {
var View = require("backbone").View.extend({
    template:require('./template.html'),
    tagName:'ul'
});
var _ = require('underscore');
var $ = require('zepto-wepp');
var Marionette = require('marionette');
var Orderlist = require("../../../entities/orderlist");

module.exports = Marionette.Controller.extend({
    initialize: function(param) {
        var page = param.page;
        param.start = param.start || 0;
        delete param.page;

        this.paramModel = new Orderlist.OrderModel(param);
        this.collection = new Orderlist.OrderCollection(this.paramModel);

        var collection = this.collection;
        collection.clearCache();
        var view = this.view = new View({
            collection: this.collection
        });
        var self = this;


        collection.on("reset",_.bind(function(data){
            this.region.ensureEl();
            if(!collection.models.length) {
                if(this.paramModel.get('start') ==0){
                    this.region.$el.html('<p style="background-color:#f8f8f8;padding:12px 0px;text-align:center;text-indent: -12px;">您没有已付款的订单</p>');
                }
                this.hideLoading();
                return;
            }
            
            var html = '';
            collection.toJSON().forEach(function(d){
                html+= _.template(view.template,d);
            });
            view.$el.append(html);

            this.region.$el.empty().append(view.$el);
            setHeight();
        },this));

        this.listenToNext();

        var listHeight = 0;

        function setHeight(){
            // console.log()
            listHeight = self.region.$el.get(0).offsetHeight;
        }

        var WIN = $(window);
        WIN.on('scroll',function(){
            if(ThisApp.pageRegion.isCurrentPage(page)){
                if(WIN.scrollTop() + WIN.height() > listHeight -60){
                    console.log('more');
                    self.more();
                }
            }
        });
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
        var self = this;
        this.collection.on("sync",_.bind(function(collection,res){
            // console.log(res.data.isEnd)
            self._isEnd = res.data.isEnd;
            self._next = res.data.nextStartIndex;
            
            if(self.isEnd()){
                this.hideLoading();
            }

        },this));
    },
    more:function(){
        if(this._isEnd){
            return;
        }
        this.showLoading();
        var pm = this.collection.paramModel;
        pm.set({
            "start":this.next()
        });
    },
    showLoading:function(){
        $('.J_orderlist_more_loading').removeClass('hide');
    },
    hideLoading:function(){
        $('.J_orderlist_more_loading').addClass('hide');
    },
    toggleLoading:function(){
        //加载更多的loading
        if(this.isEnd()){
            this.hideLoading();
            return true;
        }else {
            this.showLoading();
            return false;
        }
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/modules/orderlist/list/template.html", [], function(require, exports, module) {
module.exports = '<a href="#orderdetail~<%=id%>" class="item"><img src="<%=photo%>"/><div class="content"><h3><%=title%></h3><div class="count"><span class="price">¥<%=priceStr%></span><span class="status"><%=statusMemo%></span></div></div></a>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.5/js/pages/orderlist", ["zepto-wepp@~1.1.0", "underscore@~1.5.0", "marionette@~1.4.0", "../modules/orderlist/list/controller", "../modules/orderlist/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

//sub app Receiptlist 团购券列表
var ListController = require("../modules/orderlist/list/controller");

var ReceiptListController = Marionette.Controller.extend({
    show: function() {
        ThisApp.openPage().then(function(page) {
            page.initRegion({
                template: _.template(require('../modules/orderlist/layout.html')),
                regions:{
                    'header': 'header',
                    'list': '.J_order_list'
                }
            });
            var listController = new ListController({type:2,page:page});

            listController.show(page.layout.list);

        });
    }

});

exports.Controller = ReceiptListController;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});