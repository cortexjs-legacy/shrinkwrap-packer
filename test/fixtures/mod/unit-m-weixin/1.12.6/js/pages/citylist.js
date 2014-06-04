define("unit-m-weixin@1.12.6/js/modules/citylist/controller", ["zepto-wepp@~1.1.0","wepp@~2.7.0","../../entities/citylist","./template.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var Wepp = require('wepp');
var CityList = require('../../entities/citylist');
var City = Wepp.Module.City;
var BaseController = Wepp.Module.BaseController;

/*
*  城市选择
*
*  用户选择了城市后，会写一个localstorage  cityselect first
*  标记用户第一次选择了城市
*
* */

var Controller = BaseController.extend({
    initModel:function(){
        var model = new CityList();
        model.set('current',require('wepp').Module.City.getId());
        return model;
    },
    initTpl:function(){
        return require('./template.html');
    },
    onRender:function(){
        this.events();
        this.geo();
    },
    events:function(){
        var model = this.model;
        this.view.$el.find('.J_city').on('click',function(e){
            //写下localstorage，标记用户选择了城市
            var cityId = $(this).data('id');
            var cityName = $(this).data('name');
            if(cityId){
                localStorage.setItem('cityselect','first');
                City.set({
                    id:cityId,
                    name:cityName
                });
                model.set('current',cityId);
            }else {
                e.preventDefault();
            }
        });

        this.view.$el.find('.J_list dt').on('click',function(){
            $(this).toggleClass('close').parent().find('dd').toggleClass('hide');
        });
    },
    geo:function(){
        //定位城市
        var geoCity = this.view.$el.find('.J_geo_city');
        var model = this.model;

        ThisApp.Geo.get(true).then(function(crd){
            geoCity.text(crd.cityname);
            geoCity.data('id',crd.cityid);
            geoCity.data('name',crd.cityname);
            geoCity.attr('href',model.get('refer'));
        },function(){
            geoCity.text("无法获取您的位置");
        });
    }
});

module.exports = Controller;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/citylist/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_list"><div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/entities/citylist", ["backbone@~1.1.0","underscore@~1.5.0","wepp@~2.7.0"], function(require, exports, module) {
var Backbone = require('backbone');
var _ = require('underscore');
var Url = require('wepp').Url;

var CityList = Backbone.Model.extend({
    url:"/ajax/tuan/citygn.json",
    parse:function(res){
        var cityList = [];
        var self = this;
        var refer = localStorage.getItem('cityrefer') || "#chosen";
        localStorage.setItem('cityrefer','');

        var hotList = [];
        res.data.forEach(function(city){
            //跳到refer页面
            city.url = refer;

            var firstChar = String.fromCharCode(city.firstChar);

            self._getListIndex(cityList,firstChar).list.push(city);

            if(city.isTop){
                //热门城市
                // var hot = self._getListIndex(cityList,'热门城市');
                // hot.navName = "热门";
                hotList.push(_.clone(city));
            }
        });
        cityList.sort(function(a,b){
            return a.name<b.name ? -1 : 1;
        });
        return {
            indexList:cityList,
            hotList:hotList,
            refer:refer
        };
    },
    _getListIndex:function(list,index){
        //按字母索引获取列表,没有就创建一个
        var charItem = list.filter(function(item){
            return item.name===index;
        });
        if(charItem.length){
            return charItem[0];
        }else {
            charItem = {name:index,navName:index,list:[]};
            list.push(charItem);
            return charItem;
        }
    }
});



module.exports= CityList;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/citylist/template.html", [], function(require, exports, module) {
module.exports = '<div class="city_list"><dl><dt>定位城市</dt><dd><a class="J_city J_geo_city" href="javascript:;">正在获取定位..</a></dd></dl><dl><dt>热门城市</dt><%hotList.forEach(function(city,i){%><dd <%=city.id==current?\'class="on"\':\'\'%>><a class="J_city" data-id="<%=city.id%>" data-name="<%=city.name%>" href="<%=city.url%>"><%=city.name%></a></dd><%});%></dl><%indexList.forEach(function(item,i){%><dl class="J_list"><dt class="close"><%=item.name%><i class="arr"></i></dt><%item.list.forEach(function(city){%><dd class="hide <%=city.id==current?\'on\':\'\'%>"><a class="J_city" data-id="<%=city.id%>" data-name="<%=city.name%>" href="<%=city.url%>"><%=city.name%></a></dd><%});%></dl><%});%></div><div class="height-box"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/pages/citylist", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/citylist/controller","../modules/citylist/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');
var ListController = require('../modules/citylist/controller');

var CityListController = Marionette.Controller.extend({
    show:function(){
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/citylist/layout.html")),
                regions:{
                    'content':".J_list"
                }
            });

            (new ListController()).render(page.layout.content);
        });
    }
});

exports.Controller = CityListController;


}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});