define("unit-m-weixin@~1.12.0/js/modules/common/alert/template.html", [], function(require, exports, module) {
module.exports = '<div class="overlay"></div><div class="confirm_alert"><div class="alert_content"><%=content%></div><div class="alert_buttons"><%buttons.forEach(function(btn){%><a href="<%=(btn.url||\'javascript:;\')%>"><%=btn.text%></a><%});%></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/common/search/controller", ["marionette@~1.4.0","wepp@~2.7.0","./template.html","zepto-wepp@~1.1.0","underscore@~1.5.0","backbone@~1.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@~1.12.0/js/modules/common/appdownload/controller", ["marionette@~1.4.0","wepp@~2.7.0","./template.html","backbone@~1.1.0","zepto-wepp@~1.1.0","../overlay"], function(require, exports, module) {
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
define("unit-m-weixin@~1.12.0/js/modules/chosen/layout.html", [], function(require, exports, module) {
module.exports = '<div class="nearby"><div class="search_holder Fix"></div><div class="J_cnt"><div class="loading" style="height:400px;"></div></div><div class="download"></div></div><div class="height-box"></div>'

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
define("unit-m-weixin@~1.12.0/js/modules/chosen/template.html", [], function(require, exports, module) {
module.exports = '<%if(categoryList && categoryList.length){var width=parseInt(window.innerWidth/(categoryList.length));%><div class="category Fix"><%categoryList.forEach(function(cat){var c,url;if(cat.id==0){c=\'bonus\';url=cat.enName}else if(cat.id==10){c=\'food\';url=\'#list~c_10\'}else if(cat.id==30){c=\'fun\';url=\'#list~c_30\'}%><a class="item <%=c%>" style="width:<%=width%>px" href="<%=url%>"><div class="icon"><%if(cat.id==0){%><div class="count <%=cat.count?\'\':\'none\'%>"><%=cat.count?(cat.count>99?\'+99\':cat.count):\'\'%></div><%}%></div><%=cat.name%></a><%});%></div><%}%><div class="c-box-tit" style="color:#969696">猜你喜欢</div><div class="nearby-deallist"><%recommendList.forEach(function(deal,i){%><a href="#detail~<%=deal.id%>"><div class="img"><img lazy-src="<%=deal.bigImageUrl%>" width="100%" height="auto"></div><div class="tit"><%=deal.contentTitle%><%if(deal.shopNum && deal.shopNum>1){%><span class="shop-total">【<%=deal.shopNum%>店通用】</span><%}%></div><div class="tip"><%=deal.titleDesc%></div><div class="price"><span class="new-price">￥<%=deal.price%></span><span class="old-price">￥<%=deal.originalPrice%></span><span class="buy-num"><%=deal.buyerCounter%>人</span></div></a><%});%></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/util/lazyload", ["zepto-wepp@~1.1.0"], function(require, exports, module) {
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
define("unit-m-weixin@~1.12.0/js/modules/common/search/template.html", [], function(require, exports, module) {
module.exports = '<form action="" method="post"><%if(showCity){%><div class="city"><a href="#citylist" onclick="ThisApp.mv({module:\'index_city\'})" ><%=cityname%></a><i class="drop"></i></div><%}%><div class="search_inner <%=showCity?\'\':\'first\'%>"><input type="text" placeholder="商户名，地址等..." class="J_search_box search_box"/><a class="cancel J_cancel" href="javascript:;">取消</a><%if(showBack){%><a class="cancel J_back" href="javascript:history.go(-1);">返回</a><%}%><input type="submit" class="hide"></div></form><div class="J_history history"><div><ul><%history.forEach(function(item){%><li><%=item%></li><%});%></ul><a href="javascript:;" class="clear">清除搜索记录</a></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@~1.12.0/js/modules/common/appdownload/template.html", [], function(require, exports, module) {
module.exports = '<div class="tip-cnt"><p><%=tipText%></p><p>点击右上角<strong><span class="J_share">【收藏】</span></strong>或<strong><span class="J_share">【分享】</span></strong>给小伙伴们！</p></div><div class="appload"><a href="<%=url%>" class="tip"><i class="arr"></i><%=popText%></a><a href="<%=url%>" class="link J_d"><i class="logo"></i>马上去大众点评享优惠</a></div>'

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
define("unit-m-weixin@~1.12.0/js/modules/chosen/controller", ["zepto-wepp@~1.1.0","../../entities/chosen","wepp@~2.7.0","./template.html","../../util/lazyload","hippo@~1.2.0"], function(require, exports, module) {
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
define("unit-m-weixin@~1.12.0/js/entities/chosen", ["backbone@~1.1.0","underscore@~1.5.0","wepp@~2.7.0"], function(require, exports, module) {
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
define("unit-m-weixin@~1.12.0/js/pages/chosen", ["zepto-wepp@~1.1.0","underscore@~1.5.0","wepp@~2.7.0","../modules/chosen/controller","../modules/common/first","../modules/common/search/controller","../modules/common/appdownload/controller","../modules/common/alert/controller","../modules/chosen/layout.html"], function(require, exports, module) {
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