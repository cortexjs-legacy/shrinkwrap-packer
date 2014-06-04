define("unit-m-weixin@1.12.7/js/util/distance", [], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/modules/index/layout.html", [], function(require, exports, module) {
module.exports = '<div class="nav"><div class="search_holder Fix"></div><div class="J_nav"><div class="cat"><div class="item">全部分类<i class="drop"></i></div><div class="item">全部商区<i class="drop"></i></div><div class="item last">默认排序<i class="drop"></i></div></div></div></div><div class="indexlist"><div class="J_list"></div><div class="more-loading" style=\'visibility:hidden;\'>正在加载...</div></div><div class="height-box"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/common/deallist/controller", ["marionette@~1.4.0","backbone@~1.1.0","./template.html","underscore@~1.5.0","../../../entities/deallist"], function(require, exports, module) {
var Marionette = require('marionette');
var View = (require('backbone')).View.extend({
    template:require('./template.html'),
    className:'deallist'
});
var _ = require('underscore');

var ListCollection = require("../../../entities/deallist").ListCollection;
var ParamModel = require("../../../entities/deallist").ParamModel;

module.exports = Marionette.Controller.extend({
    initialize:function(paramAttributes){
        this.paramModel = new ParamModel(paramAttributes);
        this.collection = new ListCollection(this.paramModel);
        //是否需要重置html
        this.resetHtml = true;
    },
    getView:function(){
        //close the current view and create a new one

        if(!this.view){
            this.view = new View({ collection:this.collection });
            this.trigger('getview',this.view);
        }
        return this.view;
    },
    show:function(region,options){
        //this function will render the list
        this.region = region;
        this.paramModel.set(options||{});
    },
    listenReset:function(){
        this.collection.on("reset",_.bind(function(data){
            // this.region.show(this.getView());
            this.render();
            this.region.ensureEl();
            this.region.$el.empty().append(this.getView().$el);
            this.trigger('rendered',this.resetHtml);
        },this));
    },
    render:function(){
        var view = this.getView();
        var html = '';
        this.collection.toJSON().forEach(function(data){
            html+=_.template(view.template,data);
        });
        if(this.resetHtml && html===''){
            //没有数据
            var keyword;
            if(keyword = this.paramModel.get('keyword')){
                html = '<p style="line-height:40px;text-align:center;">没有找到<span style="color:#ff8800;">'+keyword+'</span>相关团购,换个关键字试试吧!</p>'
            }else {
                html='<p style="line-height:40px;text-align:center;">没有相关团购</p>';
            }
        }
        view.$el[this.resetHtml?'html':'append'](html);
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
define("unit-m-weixin@1.12.7/js/entities/navlist", ["backbone@~1.1.0","underscore@~1.5.0"], function(require, exports, module) {
/*
 *
* 新的Nav 用id来建立层级关系
* 如果有enName，搜索的时候就传过去，没有就是开关关了，没有enName
*
*
* */
var Backbone = require('backbone');
var _ = require('underscore');
module.exports = Backbone.Model.extend({
    _filter:function(list){
        return list;
    },
    parse:function(res,param){
        //分类列表
        var data = {
            categoryList:[],
            regionList:[],
            filterList:[],
            currentCategory: "全部分类" ,
            currentFilter:  "默认排序",
            currentRegion: "全部商区"
        };
        _.extend(data,param);
        var self = this;
        if(! ('categoryenname' in data)){
            data.categoryenname = "";
        }
        if(! ('parentcategoryenname' in data)){
            data.parentcategoryenname = "";
        }
        if(! ('regionenname' in data)){
            data.regionenname = "";
        }
        if(! ('parentregionenname' in data)){
            data.parentregionenname = "";
        }

        /*
         *从扁平的数据中分层次出来
        * */

       /*
        * 分类
       * */
        var oCategoryList = res.data.categoryNavs || [];//this._filter(res.data.categoryNavs)||[],

        data.categoryList = oCategoryList.filter(function(item){
            /*
            *  一级分类 parentId = 0
            *  只显示有单子的
            *  id>30000 的可能是一些活动分类，先不显示
            *
            *  全部分类的enName 是0 ，count也是0
            *
            * */
            return item.parentID == 0 && item.id<30000 && (item.count>0 || /*全部分类*/item.enName==="0");
        });

        data.categoryList.forEach(function(category){
            if(category.id==data.categoryid) {
                //当前选中的分类
                data.categoryenname = category.enName || "";
                data.parentcategoryenname = category.parentEnName || "";
                data.currentCategory = category.name;
                category.isSelected = true;
            }
            if(category.enName==="0"){
                //全部分类，不需要显示子分类
                return;
            }
            category.subList = oCategoryList.filter(function(subItem){
                /*
                 * 遍历找到此一级分类的所有子分类
                * 只显示有单子的子分类
                * */
                var inThisCategory = subItem.count>0 && subItem.parentID === category.id ;

               /*
                * 判断是不是选中的子分类
               * */
               if(inThisCategory && data.categoryid == subItem.id){
                   data.categoryenname = subItem.enName || "" ;
                   data.parentcategoryenname = subItem.parentEnName || "" ;
                   data.currentCategory = subItem.name;
                   subItem.isSelected = true;
                   category.isSelected = true;
               }

               return inThisCategory;
            });
        });

        /*
         * 地区
        * */
        var oRegionList = res.data.regionNavs||[]; //this._filter(res.data.regionNavs)||[];

        data.regionList = oRegionList.filter(function(item){
            /*
            * 一级地区 parentId = 0
            *
            * parentEnName 是 0 或者 district 或者是nearby
            *
            * neaby里面的count永远是0
            * 只显示有单子的
            *
            * 全部商区enName ＝0，count ＝0
            *
            * */
            return (item.parentId == 0 ) && (item.count>0 || item.enName==="0"/*全部商区*/ || item.enName==="nearby"/*附近*/);
        });
        data.regionList.forEach(function(region){
            if(data.regionid == region.id ) {
                /*
                 * 当前选中的一级地区
                * */
                data.currentRegion = region.name;
                data.regionenname = region.enName || "";
                data.parentregionenname = region.parentEnName || "";
                region.isSelected = true;
            }
            if(region.enName==="0"){
                //全部商区，不需要子商区
                return;
            }

            region.subList = oRegionList.filter(function(subItem){
                /*
                 * 遍历找到此地区的所有子地区
                * */
               var inThisRegion = subItem.parentId == region.id && (subItem.count>0 || /*附近*/region.enName==="nearby")  ;

               if(inThisRegion && data.regionid == subItem.id ) {
                    /*
                     *
                    * 选中了此2级分类
                    * */
                    data.currentRegion = subItem.name;
                    data.regionenname = subItem.enName || "";
                    data.parentregionenname = subItem.parentEnName || "";
                    subItem.isSelected = true;
                    region.isSelected = true;
                }

               return inThisRegion;
            });
        });

        /*
         * 筛选
         * */
        data.filterList = res.data.filterNav || []; //this._filter(res.data.filterNav)|| [];
        data.filterList.forEach(function(filter){
            if(data.filter == filter.id ) {
                data.currentFilter = filter.name;
                filter.isSelected = true;
            }
        });
        return data;
    }
});

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
define("unit-m-weixin@1.12.7/js/modules/common/alert/template.html", [], function(require, exports, module) {
module.exports = '<div class="overlay"></div><div class="confirm_alert"><div class="alert_content"><%=content%></div><div class="alert_buttons"><%buttons.forEach(function(btn){%><a href="<%=(btn.url||\'javascript:;\')%>"><%=btn.text%></a><%});%></div></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/common/deallist/template.html", [], function(require, exports, module) {
module.exports = '<a href="#detail~<%=id %>"><img src="<%= imageUrl %>" class="img"><h3><%= contentTitle %></h3><div class="price"><span class="price-c">&#165;<%= price %></span><span class="price-o">&#165;<%= originalPrice %></span><span class="distance"><%=distance%></span></div><div class="count"><span class="num"><%= buyerCounter %>人</span><span class="place"><%=regionPrefix %></span></div><div class="<%=jb%>"></div></a>'

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
define("unit-m-weixin@1.12.7/js/entities/deallist", ["./dealstatus","backbone@~1.1.0","underscore@~1.5.0","wepp@~2.7.0","../util/distance"], function(require, exports, module) {
var DealStatus = require('./dealstatus');
var Backbone = require('backbone');
var _ = require('underscore');
var City = require('wepp').Module.City;
var Distance = require('../util/distance');

//DealList Collection
var DealList = Backbone.Collection.extend({
    model:Backbone.Model.extend({}),
    fetchingMore:false,
    fetching:false,
    hasResult:true,
    initialize:function(paramModel){
        this.paramModel = paramModel;
        this.url = this.paramModel.getUrl();

        //如果用控制fetch的属性，通过设置这个model来改变
        this.behaviorModel = new BehaviorModel();

        //paramModel 如果change ， 就重新获取数据
        this.paramModel.on("change",_.bind(this.research,this));

        this.on("sync",_.bind(function(){
            this.fetching = false;
            this.fetchingMore = false;
        },this));
    },
    parse:function(res){
        var pm = this.paramModel;
        if(res.data.city){
            City.set({
                id:res.data.city.id,
                enname:res.data.city.enName,
                name:res.data.city.name
            });
        }
        return (res.data.list || []).map(function(item){
            //处理角标逻辑， status 》 tag
            //目前tag只有 免预约
            var status = item.status;
            var tag = item.tag;

            if(DealStatus.isNew(status)){
                item.jb ='xindan';
            }else if(DealStatus.isSellOut(status)){
                item.jb='maiguang';
            }else if(DealStatus.isEnd(status)) {
                item.jb = 'jieshu';
            }else if(DealStatus.isToBegin(status)){
                item.jb = 'jijiangkaishi';
            }else if(DealStatus.isNormal(status) && tag==1){
                //正常单,免预约
                item.jb = 'yuyue';
            }else {
                item.jb="";
            }

            if(item.lat && item.lng && pm.get('lat') && pm.get('lng')){
                item.distance = Distance({
                    lat:item.lat,
                    lng:item.lng
                },{
                    lat:pm.get('lat'),
                    lng:pm.get('lng')
                }).distanceText;
            }else {
                item.distance = null;
            }

            return item;
        });
    },
    research:function(){
        this.url = this.paramModel.getUrl();
        if(this.fetching){
            return;
        }
        this.fetching = true;
        this.fetchXhr = this.fetch(this.behaviorModel.attributes);
    },
    cancel:function(){
        if(this.fetchXhr){
            this.fetchXhr.abort();
        }
        this.fetching = false;
        this.fetchingMore = false;
    }
});

//ParamModel 
//用来设置Collection获取数据的一些参数
var ParamModel = Backbone.Model.extend({
    defaults:{
        baseUrl:""
    },
    parseParam:function(){
        //parse attributes to url
        //if got diffrent logic , override this function
        var param = [];
        _.each(this.attributes,function(value,key){
            if(key!== 'baseUrl' && value !== undefined ){
                param.push( key+"=" + (value === null? '' : encodeURIComponent(value)));
            }
        });
        //增加from 微信
        param.push('from=weixin');
        return param.join("&");
    },
    getUrl:function(){
        return this.get("baseUrl")+"?"+this.parseParam();
    }
});

//Behavior Model ，用来控制collection reset的行为
var BehaviorModel = Backbone.Model.extend({
    defaults:{
        reset:true,
        remove:false
    }
});


exports.ListCollection = DealList;
exports.ParamModel = ParamModel;

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/index/filter/controller", ["marionette@~1.4.0","underscore@~1.5.0","zepto-wepp@~1.1.0","wepp@~2.7.0","./template.html","../../../entities/navlist","../../../base/share"], function(require, exports, module) {
var Marionette = require('marionette');
var _ = require('underscore');
var $ = require('zepto-wepp');
var Wepp = require('wepp');

var View = Wepp.Module.BaseView(require('./template.html'));
var City = Wepp.Module.City;
var NavModel = require("../../../entities/navlist");
var Share = require('../../../base/share');

/*
 * Nav 和 List公用一个server接口，所以这里监听List的collection的sync就行了
 *
 * */

var Controller = module.exports = Marionette.Controller.extend({
    initialize:function(options){
        this.listCollection = options.collection;
        this.paramModel = options.paramModel;
        this.region = options.region;
        this.page = options.page;

        this.model = new NavModel();

        var self = this;

        //监听collection的sync事件，拿到filter的数据
        this.listCollection.on("sync",_.bind(function(collection,res){
            var start = this.paramModel.get('start');
            if(start !='0' || start != ""){
                //获取更多的时候 就不加载了
                return;
            }
            //set 只在这里统一set
            if(collection.length==0 && this.paramModel.get('keyword')){
                //搜索结果页面没有数据就隐藏
                this.region.ensureEl();
                this.region.$el.hide();
            }else {
                var newData = this.model.parse(res,this.paramModel.attributes);
                this.model.set(newData);
                this.render(this.region);
                this.region.$el.show();
            }


            //设置分享
            Share.config({
                img_url:collection.models.length?collection.models[0].get('imageUrl'):"",
                link:location.href,
            });

        },this));

        this.overlay = new ThisApp.Overlay(this.page.el);
        this.overlay.on('hide',function(){
            self.view && self.view.$el.find('.selector').addClass('hide');
            self.view && self.view.$el.find('.J_nt').removeClass('on');

        });
        this.unlock();

        this.page.on('reshow',function(){
            options.page.el.css('-webkit-transform','none');
        });
        this.page.on('show',function(){
            options.page.el.css('-webkit-transform','none');
        });
    },
    render: function(region) {
        var view = this.view = new View({
            model:this.model
        });
        region.show(view);

        this.show = function(){
            view.$el.show();
        };
        this.hide = function(){
            view.$el.hide();
        };

        /*
        * Fixed 在transform的容器里面有问题
        * 把Page的transform属性先去掉
        * */
        this.page.el.css('-webkit-transform','none');

        var el = view.$el;
        var selectors = el.find('.selector');
        var self = this;

        require.async('iscroll',function(IScroll){
            //按屏幕设置高度
            // selectors.height(Math.min((window.innerHeight-40)*0.9, selectors.height()));

            selectors.each(function(i,item){
                var s = $(item);
                var lists = $(s.find('.J_ml').concat(s.find('.J_sl').get()));
                s.removeClass('hide');
                lists.each(function(index,l){
                    var item = $(l);
                    var isHide = item.hasClass('hide');
                    item.removeClass('hide');
                    l._scroll_ = new IScroll(item.get(0),{
                        mouseWheel:true,
                        click:true,
                        scrollbars:true
                    });
                    if(isHide ){
                        item.addClass('hide');
                    }
                });
                s.addClass('hide');

            });
            el.parents('.nav').css('position','fixed');
        });

        //绑定事件
        function stop(e){
            e.preventDefault();
            e.stopPropagation();
        }
        el.find('.J_nt').on('touchstart',function(e){
            stop(e);
            if(self._lock){
                return;
            }
            self.lock();
            var $this = $(this);
            el.find('.J_nt').removeClass('on');

            var listClass = $this.addClass("on").data("listclass");
            var thisOne = el.find("." + listClass);
            var action =  thisOne.hasClass('hide')?'removeClass':'addClass';
            var overlayAction = thisOne.hasClass('hide')?'show':'hide';
            if(action === "addClass"){
                // 关闭， 解决sb小米的穿透bug，延迟隐藏
                setTimeout(function(){
                    selectors.addClass('hide');
                    thisOne[action]('hide');
                    self.overlay[overlayAction]();
                },400);
            }else {
                //展示
                selectors.addClass('hide');
                thisOne[action]('hide');
                //refresh iscroll
                self.refresh();

                self.overlay[overlayAction]();
            }

            setTimeout(function(){
                self.unlock();
            },500);
        });
        el.find(".J_mainlistitem").on('click',function(e){
            stop(e);
            if(self._lock){
                return;
            }
            self.lock();
            var targetEl = $(this);
            var selector = targetEl.closest('.selector');
            //移除高亮
            selector.find(".J_ml .on").removeClass("on");
            $(this.parentNode).addClass("on");

            var id = targetEl.data('id'), pid= targetEl.data('pid'),name = targetEl.data('name');
            var enName = targetEl.data('en'), pEnName = targetEl.data('pen');

            selector.find(".J_sl").addClass('hide').forEach(function(s){
                var sublist = $(s);
                if(sublist.data('pid')==id){
                    sublist.removeClass('hide');
                    s._scroll_ && s._scroll_.refresh();
                }
            });

            var currentListType = selector.attr('ref');
            var trigger = $("#"+currentListType).html(name+'<i class="drop"></i>')
            trigger.data('id',id);
            trigger.data('pid',pid)
            trigger.data('en',enName)
            trigger.data('pen',pEnName);
            setTimeout(function(){
                self.unlock();
            },500);
        });
        el.find('.J_list_link').on('click',function(e){
            stop(e);
            if(self._lock){
                return;
            }
            self.lock();
            var targetEl = $(this);
            el.find(".J_nt").removeClass("on");
            var id = targetEl.data('id'), pid = targetEl.data('pid') ,name = targetEl.data('name');
            var enName = targetEl.data('en'), pEnName = targetEl.data('pen');

            var currentListType = targetEl.closest('section').attr('ref');
            var trigger = $("#"+currentListType).html(name+'<i class="drop"></i>')
            trigger.data('id',id)
            trigger.data('pid',id)
            trigger.data('en',enName)
            trigger.data('pen',pEnName);
            self._updateList();
            setTimeout(function(){
                selectors.addClass("hide");
                self.overlay.hide();
                self.unlock();
            },350);
        });
    },
    _updateList: function(){
        var cc = $("#J_c_c")
        var cr = $("#J_c_r")
        var cf = $("#J_c_f")
        var options = {
            categoryid: cc.data('id'),
            parentcategoryid: cc.data('pid'),
            categoryenname: cc.data('en'),
            parentcategoryenname: cc.data('pen'),
            regionid: cr.data('id'),
            parentregionid: cr.data('pid'),
            regionenname: cr.data('en'),
            parentregionenname: cr.data('pen'),
            filter: cf.data('id'),
            start:0
        };
        ThisApp.vent.trigger('select:channel',options);
    },
    lock:function(){
        this._lock = true;
    },
    unlock:function(){
        this._lock = false;
    },
    refresh:function(){
        //刷新iscroll 
        var selectors = this.view.$el.find('.selector');
        selectors.each(function(i,s){
            if($(s).hasClass('hide')){
                return;
            }
            var lists = $($(s).find('.J_ml').concat($(s).find('.J_sl').get()));
            lists.each(function(i,l){
                var list = $(l);
                if(!list.hasClass('hide') && l._scroll_ ){
                    l._scroll_.refresh();
                }
            });
        });
    },
    hide:function(){
        //override when  show
    },
    show:function(){
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/entities/dealstatus", [], function(require, exports, module) {
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
define("unit-m-weixin@1.12.7/js/modules/index/list/controller", ["../../common/deallist/controller","wepp@~2.7.0","underscore@~1.5.0"], function(require, exports, module) {
var CommonListController = require('../../common/deallist/controller');
var UI = require('wepp').UI;
var _ = require('underscore');

module.exports = CommonListController.extend({
    showLoad:function(){
        this.view.$el.parent().next().css('visibility','visible');
    },
    hideLoad:function(){
        this.view.$el.parent().next().css('visibility','hidden');
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
            if(res.data.isEnd){
                this.hideLoad();
            }
        },this));
    },
    more:function(){
        if(this.isEnd()){
            this.hideLoad();
            return;
        }
        this.showLoad();
        var pm = this.collection.paramModel;
        // this.getView().removeChildWhenReset = false;
        this.resetHtml = false;
        pm.set({
            "start":this.next()
        });
    },
    hidden:function(){
        this.view && this.view.$el.hide();
    },
    removeHidden:function(){
        this.view && this.view.$el.show();
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/modules/index/filter/template.html", [], function(require, exports, module) {
module.exports = '<div class="cat"><div onclick="ThisApp.mv({module:\'list_categroy\'})" class="item J_nt" data-en="<%=categoryenname%>" data-pen="<%=parentcategoryenname%>" data-id="<%=categoryid%>" data-listclass="J_c_l" id="J_c_c"><%=currentCategory%><i class="drop"></i></div><div onclick="ThisApp.mv({module:\'list_distict\'})" class="item J_nt" data-en="<%=regionenname%>" data-pen="<%=parentregionenname%>" data-id="<%=regionid%>"  data-listclass="J_r_l" id="J_c_r"><%=currentRegion%><i class="drop"></i></div><div onclick="ThisApp.mv({module:\'list_sort\'})" class="item last J_nt" data-id="<%=filter%>" data-listclass="J_f_l" id="J_c_f"><%=currentFilter%><i class="drop"></i></div></div><section class="selector hide Fix J_c_l" ref="J_c_c"><div class="main J_ml"><ul><%_.each(categoryList,function(item){%><li <%if(item.isSelected){%>class="on"<%}%>><%if(item.subList && item.subList.length){%><p class="J_mainlistitem" data-id="<%=item.id%>" data-pid="<%=item.parentID%>" data-pen="<%=item.parentEnName%>" data-en="<%=item.enName%>" data-name="<%=(item.realName||item.name)%>"><%=item.name%><span class="num"><%= (item.count?item.count:"") %></span></p><%}else{%><a class="J_list_link Fix" data-en="<%=item.enName%>" data-pen="<%=item.parentEnName%>" data-cat="Category" data-id="<%=item.id%>" data-pid="<%=item.parentID%>" data-name="<%=item.realName||item.name%>" href="javascript:;"><%=item.name%><span class="num"><%=item.count?item.count:""%></span></a><%}%></li><%});%></ul></div><%_.each(categoryList,function(item){%><%if(item.subList && item.subList.length){%><div class="sub <%if(!item.isSelected){%>hide<%}%> J_sl" data-pid="<%=item.id%>"><ul><% _.each(item.subList,function(sub){%><li <%if(sub.isSelected){%>class="on"<%}%>><a class="J_list_link Fix" data-cat="Category" data-en="<%=sub.enName%>" data-pen="<%=sub.parentEnName%>" data-id="<%=sub.id%>" data-pid="<%=sub.parentID%>" data-name="<%=(sub.realName||sub.name)%>" href="#"><%=sub.name%><span class="num"><%=sub.count?sub.count:""%></span></a></li><%});%></ul></div><%}%><%});%></section><section class="selector hide Fix J_r_l" ref="J_c_r"><div class="main J_ml"><ul><%_.each(regionList,function(item){%><li <%if(item.isSelected){%>class="on"<%}%>><%if(item.subList && item.subList.length){%><p class="J_mainlistitem" data-id="<%=item.id%>" data-pid="<%=item.parentId%>" data-pen="<%=item.parentEnName%>" data-en="<%=item.enName%>" data-name="<%=item.realName||item.name%>"><%=item.name%><span class="num"><%=item.count?item.count:""%></span></p><%}else{%><a class="J_list_link Fix" data-cat="Region" data-en="<%=item.enName%>" data-pen="<%=item.parentEnName%>"  data-id="<%=item.id%>" data-pid="<%=item.parentId%>" data-name="<%=item.realName||item.name%>" href="#"><%=item.name%><span class="num"><%=item.count?item.count:""%></span></a><%}%></li><%});%></ul></div><%_.each(regionList,function(item){%><%if(item.subList && item.subList.length){%><div class="sub <%if(!item.isSelected){%>hide<%}%> J_sl" data-pid="<%=item.id%>"><ul><% _.each(item.subList,function(sub){%><li <%if(sub.isSelected){%>class="on"<%}%>><a class="J_list_link Fix" data-cat="Category" data-en="<%=sub.enName%>" data-pen="<%=sub.parentEnName%>" data-id="<%=sub.id%>" data-name="<%=sub.realName||sub.name%>" href="#"><%=sub.name%><span class="num"><%=sub.count?sub.count:""%></span></a></li><%});%></ul></div><%}%><%});%></section><section class="selector hide J_f_l" ref="J_c_f"><div class="main full J_ml"><ul><%_.each(filterList,function(item){%><li <%if(item.isSelected){%>class="on"<%}%>><a class="J_list_link Fix" data-cat="Filter" data-id="<%=item.id%>" data-name="<%=item.name%>" href="#"><%=item.name%><span class="num"><%=item.count%></span></a></li><%});%></ul></div></section>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.7/js/pages/index", ["zepto-wepp@~1.1.0","underscore@~1.5.0","wepp@~2.7.0","backbone@~1.1.0","cookie@~0.1.0","../modules/index/list/controller","../modules/index/filter/controller","../modules/common/search/controller","../modules/common/alert/controller","../modules/common/first","../modules/index/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Wepp = require('wepp');
var Backbone = require('backbone');
var cookie = require('cookie');

var ListController = require("../modules/index/list/controller");
var NavController = require("../modules/index/filter/controller");
var SearchController = require('../modules/common/search/controller');

var City = Wepp.Module.City;
var Url = Wepp.Url;
var UI = Wepp.UI;

var WIN = $(window);
var geoLocationOnlyOnce = false; //只去取一次geolocation
var Confirm = require('../modules/common/alert/controller');
var First = require('../modules/common/first');

exports.Controller = Wepp.PageController.extend({
    initialize:function(){
        this.page = null;
        this.inited = false;
    },
    show:function(keywords,category,region,filter,lng,lat){
        // if(First.checkFirst()){
        //     return;
        // }


        this.firstSelect = First.firstSelect();
        /*
         *
        * category 第一次还是走id,
        * region 现在是enName的值了，而不是id的值了
        *
        * */
        var self = this;
        var isSearchPage = false;


        /*
        * 处理URL参数
        *
        * */

        var p = Url.parse(location.hash,'~');
        _.each(p,function(value,key){
            var realP = key.split('_');
            switch(realP[0]){
                case 'c':
                    category = realP[1];
                break;
                case 'k':
                    keywords = realP[1];
                break;
                case 'r':
                    region = realP[1];
                break;
                case 'f':
                    filter = realP[1];
                break;
                case 'lng':
                    lng = realP[1];
                break;
                case 'lat':
                    lat = realP[1];
                break;
            }
        });

        //如果只有keyword 一个参数，并且keyword是空 ， 启动搜索
        if(keywords==="search" && category===null && region===null && filter===null && lng===null && lat===null){
            isSearchPage = true;
        }

        if(filter=='2'){
            //附近的，才显示menu
            this.needMenu = true;
            this.showMenu();
        }

        //微信iphone某些版本会把hash里面的经纬度搞没了，公众号通过querystring传值过来
        //如果有querystring 就从中拿值
        if(Url.get('lng')){
            lng = Url.get('lng');
            lat = Url.get('lat');
            filter = '2';
        }

        //选了附近，但是又没有传经纬度，那就从geolocation里面取
        if(filter=='2' && !lng){
            //先用默认排序去抓数据，如果有能拿到经纬度，再切换成附近优先，
            filter = '1';

            //获取经纬度
            //如果从cookie中能直接拿到,直接用经纬度
            var crd = ThisApp.Geo.cookieGeo();
            if(crd && crd.cityid === City.getId()){
                //定位的城市和用户选择的城市一致,传经纬度拿精确的单子
                lat = crd.lat;
                lng = crd.lng;
                filter = '1';
            }else {
                this.geolocation(keywords,category,region,1,lng,lat);
            }
        }
        //强制用默认排序
        if(filter=='2'){
            filter ='1';
        }

        var param = {
            keyword:keywords?decodeURIComponent(keywords): "",
            categoryid:category||0,
            regionenname:region || "0",
            parentregionenname:"0",
            regionid:"",
            filter:filter|| "1",
            lng:lng||"",
            lat:lat||"",
            r:+new Date()
        };
        if(lat && lng){
            param.cityid = null;
            //设置默认2000米
            param.regionenname="32758";
            param.parentregionenname="32755";
            param.regionid="32758";
        }

        //附近团购的话，不需要动画打开
        ThisApp.openPage(true).then(function(page){
            UI.loading.show();
            self.page = page;
            self.start();
            self.navController.region = page.layout.nav;
            self.lc.listenReset();
            if(!isSearchPage){
                self.lc.show(page.layout.list,param);
            }else {
                //是搜索页
                UI.loading.hide();
                self.lc.region = page.layout.list;
            }
            if(param.keyword){
                if(isSearchPage){
                    param.keyword = "";
                }
                self.sc.show(page.layout.search,param.keyword);
                page.layout.$el.find('.indexlist').addClass('hassearch');
                if(isSearchPage){
                    // self.sc.searchBox.get(0).focus();
                    self.sc.onFocus();
                }
                // self.sc.showBack();
            }
            self.trigger('index:start');
            self.started = true;
            page.on('reshow',function(){
                self.showMenu();
            });
        },function(){
        });
    },
    region:function(){
        this.page.initRegion({
            template:_.template(require("../modules/index/layout.html")),
            regions:{
                'search':'.search_holder',
                'nav': '.J_nav',
                'list':'.J_list'
            }
        });
    },
    start:function(){
        // if(!this.inited){
        var self = this;
        this.region();
        // IndexApp.start();
        this.lc = new ListController({
            baseUrl:"/ajax/tuan/searchdealgn.json",
            cityid:City.getId(),
            categoryid:"",
            regionenname:"0",
            parentregionenname:"0",
            regionid:"",
            keyword: '',
            filter: '',
            start:0
        });

        var listHeight = 0;
        var listEl = this.page.layout.$el.find('.J_list').get(0);
        var bindScroll = false;

        function resetHeight(){
            listHeight = listEl.offsetHeight;
        }

        this.navController = new NavController({
            collection:this.lc.collection,
            paramModel:this.lc.paramModel,
            region:this.page.layout.nav,
            page:this.page
        });

        this.lc.listenToNext();

        this.lc.on('rendered',function(rerender){
            UI.loading.hide();
            resetHeight();

            //监听滚动事件
            if(bindScroll){
                return;
            }
            bindScroll = true;
            WIN.on('scroll',function(){
                if(ThisApp.pageRegion.isCurrentPage(self.page) && WIN.scrollTop() + WIN.height() > listHeight -30 ){
                    self.lc.more();
                }
            });
        });

        //搜索框
        this.initSearch();

        if(!this.inited){
            ThisApp.vent.on("select:channel",function(param){
                self.rerender(param);
            });
        }
        this.inited = true;
    },
    rerender:function(param){
        var self = this;
        //stop  the fetching
        self.lc.collection.cancel();
        // self.lc.showListLoading();
        self.lc.resetHtml = true;
        param.r = +new Date();
        self.lc.paramModel.set(param);
        UI.loading.show();
    },
    geolocation:function(keywords,category,region,filter,lng,lat){
        if(geoLocationOnlyOnce){
            return;
        }
        geoLocationOnlyOnce = true;
        var self = this;
        ThisApp.Geo.get(true).then(function(data){
            var lng = data.lng;
            var lat = data.lat;
            var sameCity = data.cityid == City.getId();
            function rerender(){
                //设置默认2000米
                self.rerender({
                    categoryid:category || 0,
                    regionenname:"32758",
                    parentregionenname:"32755",
                    regionid:"32758",
                    keyword:keywords?decodeURIComponent(keywords): "",
                    filter:filter,
                    cityid:null, //don't parse cityid
                    lng:lng,
                    lat:lat,
                    r:+new Date()
                });
            }
            if(sameCity){
                //城市一致，拿高精度的数据
                if(self.started){
                    rerender();
                }else {
                    self.on('index:start',rerender);
                }
            }else {
                if(!self.firstSelect && self.page && ThisApp.pageRegion.isCurrentPage(self.page)){
                    //问用户是否需要切换城市
                    var cfm = new Confirm({
                        content:"系统定位到您在"+data.cityname+",是否切换?",
                        buttons:[{
                            text:"取消",
                            click:function(){
                                cfm.hide();
                            }
                        },{
                            text:"切换",
                            click:function(){
                                cfm.hide();
                                rerender();
                            }
                        }]
                    });
                    UI.loading.hide();
                    cfm.show();
                }
            }
        },function(){
            if(!self.firstSelect && self.page && ThisApp.pageRegion.isCurrentPage(self.page)){
                UI.alert('获取定位信息失败,您可以手动设置您所在的城市',3000);
            }
        });
    },
    initSearch:function(){
        var self = this;
        var sc = self.sc = new SearchController({
            showCity:false
            // showBack:true
        });
        sc.on('touch',function(){
            self.hideMenu();
            self.navController.hide();
            self.lc.hidden();
        });
        sc.on('focus',function(){
            self.hideMenu();
            self.navController.hide();
            self.lc.hidden();
        });
        sc.on('blur',function(){
            self.navController.show();
            self.lc.removeHidden();
            self.showMenu();
        });
        sc.on('search',function(keyword){
            var currentParam = self.lc.paramModel.toJSON();
            currentParam.keyword = keyword;
            self.rerender(currentParam);
        });

        //indexlist
    },
    showMenu:function(){
        if(this.needMenu){
            ThisApp.Menu.show();
            ThisApp.Menu.show().switchTo(1);
        }
    },
    hideMenu:function(){
        ThisApp.Menu.hide();
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});