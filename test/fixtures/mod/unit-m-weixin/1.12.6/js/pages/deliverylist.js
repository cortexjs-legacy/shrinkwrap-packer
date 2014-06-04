define("unit-m-weixin@1.12.6/js/modules/deliverylist/content/controller", ["marionette@~1.4.0","underscore@~1.5.0","wepp@~2.7.0","../../../entities/delivery","zepto-wepp@~1.1.0","./template.html"], function(require, exports, module) {
var Marionette = require('marionette');
var _ = require('underscore');
var Wepp = require('wepp');
var Model = require('../../../entities/delivery');
var $ = require('zepto-wepp');

module.exports = Wepp.Module.BaseController.extend({
    initModel:function(){
        var self = this;
        ThisApp.commands.setHandler("deliverylist::newdeliver::add",function(delivery){
            self.model && self.model.set('list',delivery);
        });
        ThisApp.commands.setHandler("temp::delivery::add",function(delivery){
            //超过5个的临时地址
            var list = self.model.get('list').slice(0);
            list.unshift(delivery);
            self.model.set('list',list);
        });
        var model = new Model();
        model.set('index',0);
        return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    onRender: function(model,view) {
        var items = view.$el.find('div.item');
        items.on('click',function(){
            var radio = $(this).find('input');
            model.set('index',radio.val());
        });

        view.$el.find('.J_submit').on('click',function(){ ThisApp.execute('delivery::update',model.get('list')[+model.get('index')]);
            history.go(-1);
        });
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/deliverylist/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_content"><div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/entities/delivery", ["backbone@~1.1.0","underscore@~1.5.0"], function(require, exports, module) {
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
define("unit-m-weixin@1.12.6/js/modules/deliverylist/content/template.html", [], function(require, exports, module) {
module.exports = '<p class="c-box-tit">请选择要使用的收货人地址</p><div class="c-box promo-list"><%list.forEach(function(item,i){%><div class="item"><p><%= item.receiver %>&nbsp;&nbsp;<%= item.phoneNo ||item.phone %></p><p><%= item.showAddress %><br><%= item.postCode  || item.postcode%></p><input type="radio" <%if(index==i){%>checked<%}%> value="<%=i%>"/></div><% }); %><%if(list.length<5){%><a class="item" href="#deliveryadd~0">添加收货地址<i class="arrow-ent"></i></a><%}else{%><a class="item" href="#deliveryadd~temp">添加收货地址<i class="arrow-ent"></i></a><%}%></div><a href="javascript:void(0)" class="y-btn J_submit" style="width:90%">确认地址</a><div class="height-box"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/pages/deliverylist", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/deliverylist/content/controller","../modules/deliverylist/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var content = require('../modules/deliverylist/content/controller');

var DeliveryListController = Marionette.Controller.extend({
    show:function(){
        var self =  this;
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/deliverylist/layout.html")),
                regions:{
                    'header': '.J_header',
                    'content': '.J_content'
                }
            });
            (new content()).render(page.layout.content);
        });
    }
});

exports.Controller = DeliveryListController;



}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});