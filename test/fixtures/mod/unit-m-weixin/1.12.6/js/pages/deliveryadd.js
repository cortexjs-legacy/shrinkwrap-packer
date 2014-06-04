define("unit-m-weixin@1.12.6/js/modules/deliveryadd/content/controller", ["marionette@~1.4.0","./view","backbone@~1.1.0","../../../entities/addrdata"], function(require, exports, module) {
var Marionette = require('marionette');
var View = require("./view");
var Backbone = require('backbone');

module.exports = Marionette.Controller.extend({
    initialize:function(options){
        this.index = options.index;
        this.temp = !!options.temp; //临时增加地址，不需要ajax校验
    },
    show: function(region) {
        var addressListData = require("../../../entities/addrdata");

        this.AddressListModel =  Backbone.Model.extend({
            initialize:function(options){
                this.set(options);
            }
        });

        this.view  = new View({
            model:new this.AddressListModel({
                list:addressListData,
                index:this.index
            }),
            temp:this.temp
        });

        region.show(this.view);
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/deliveryadd/layout.html", [], function(require, exports, module) {
module.exports = '<div class="J_content"><div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/deliveryadd/content/view", ["backbone@~1.1.0","wepp@~2.7.0","marionette@~1.4.0","underscore@~1.5.0","zepto-wepp@~1.1.0","../../../util/ajax","./template.html"], function(require, exports, module) {
var Backbone  = require('backbone');
var UI = require('wepp').UI;
var Router = new Backbone.Router();
var Marionette = require('marionette');
var _ = require('underscore');
var $ = require('zepto-wepp');
var Ajax = require('../../../util/ajax');

module.exports = Marionette.ItemView.extend({
    template: _.template(require('./template.html')),
    tagName: "div",
    events:{
        "change .J_province": "provinceListener",
        "change .J_city": "cityListener",
        "change .J_district": "districtListener",
        "click .J_deliveradd_submit": "btnSubmit"
    },
    initialize: function(options){
        this.city = -1;
        this.province = -1;
        this.district = -1;
        this.temp = options.temp;
    },
    provinceListener:function(){
        var self =this;
        var data = self.model.get("list") || [];
        var _index = $(".J_province").val();
        var html = '<option value="-1">--请选择--</option>';


        var citylist = (data[_index]&&data[_index].subcity) || [];

        _.each(citylist,function(item,index){
            html += '<option value="'+index+'">'+item.name+'</option>'
        });

        $(".J_city").html(html);
        $(".J_district").html('<option value="-1">--请选择--</option>');

        self.province = _index;
        self.city = -1;
        self.district = -1;
    },
    cityListener:function(){
        var self = this;
        var data = self.model.get("list") || [];
        var _provinceIndex = self.province;
        var cityList =  (data[_provinceIndex] && data[_provinceIndex].subcity) || [];
        var _cityIndex = $(".J_city").val();
        var districtList = (cityList[_cityIndex] && cityList[_cityIndex].sub) || [];
        var html = '<option value="-1">--请选择--</option>';

        _.each(districtList,function(item,index){
            html += '<option value="'+index+'">'+item.name+'</option>'
        });

        $(".J_district").html(html);

        self.city = _cityIndex;
        self.district = -1;
    },
    districtListener:function(){
        this.district = $(".J_district").val();
    },

    btnSubmit:function(){
        var data;
        var model = this.model;
        if(data = this.checkForm()){
            $(".J_deliveradd_submit").addClass("hide");
            $(".J_un_deliveradd_submit").removeClass("hide");

            if(this.temp){
                //临时地址，不需要添加到地址列表

                ThisApp.execute('temp::delivery::add',data);
                history.go(-1);
                return ;
            }

            Ajax("/ajax/tuan/adddeliverygn.json?"+(+new Date()),data,{
                200:function(res){
                    ThisApp.execute("delivery::add",data);
                    Ajax("/ajax/tuan/deliverylistgn.json",{},{
                        200:function(res){
                            ThisApp.execute("deliverylist::newdeliver::add",res.list||[]);
                            history.go(-1);

                        }
                    });
                },
                finish:function(){
                    $(".J_deliveradd_submit").removeClass("hide");
                    $(".J_un_deliveradd_submit").addClass("hide");
                }
            });
        }
    },

    checkForm:function(){
        var self = this;
        var data= self.model.get("list") || [];
        var _province,
        _city,
        _cityList,
        _districtList,
        _district,
        _detailAddress,
        _postCode,
        _receive,
        _tel,
        _showAddress;

        if(self.province == -1){

            UI.alert("省份未选");
            return false;
        }
        _province = data[self.province].id;
        _showAddress = data[self.province].name ;
        _cityList = data[self.province].subcity;

        if(self.city == -1){
            UI.alert("城市未选");
            return false;
        }

        _city = _cityList[self.city].id;
        _showAddress += _cityList[self.city].name +" ";
        _districtList = _cityList[self.city].sub;

        if(self.district == -1){
            UI.alert("区县未选");
            return false;
        }

        _district = _districtList[self.district].id;
        _showAddress += " "+_districtList[self.district].name

        _detailAddress = $(".J_detailAddr").val().trim();
        _showAddress+=_detailAddress;
        if(!_detailAddress){
            UI.alert("详细地址不能为空")
            return false;
        }



        _postCode = $(".J_postcode").val().trim();


        if(!/^\d{6}$/.test(_postCode)){
            UI.alert("无效邮编");
            return false;
        }


        _receive = $(".J_consignee").val().trim();

        if(!_receive){
            UI.alert("收货人不能为空");
            return false;
        }


        _tel = $(".J_telphone").val().trim();

        if(!/^[\d-]+$/.test(_tel)){
            //可能是座机号
            UI.alert("无效手机号");
            return false;
        }


        return{
            province:_province,
            city:_city,
            county:_district,
            postcode:_postCode,
            address:_detailAddress,
            receiver:_receive,
            phone:_tel,
            showAddress:_showAddress,
            callid:parseInt((Math.random()+"").substr(2,15))
        }
    }
});

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/entities/addrdata", [], function(require, exports, module) {
﻿    module.exports = [
        { "id":9, "name":'上海', "subcity":[
            { "id":1, "name":'上海', "sub":[
                { "id":1, "name":'卢湾区' },
                { "id":2, "name":'徐汇区' },
                { "id":3, "name":'静安区' },
                { "id":4, "name":'长宁区' },
                { "id":12, "name":'闵行区' },
                { "id":5, "name":'浦东新区' },
                { "id":6, "name":'黄浦区' },
                { "id":7, "name":'普陀区' },
                { "id":8, "name":'闸北区' },
                { "id":9, "name":'虹口区' },
                { "id":10, "name":'杨浦区' },
                { "id":13, "name":'宝山区' },
                { "id":5937, "name":'松江区' },
                { "id":5938, "name":'嘉定区' },
                { "id":5939, "name":'青浦区' },
                { "id":11, "name":'近郊'}
            ]}
        ] },
        { "id":1, "name":'北京', "subcity":[
            { "id":2, "name":'北京', "sub":[
                { "id":14, "name":'朝阳区' },
                { "id":15, "name":'东城区' },
                { "id":16, "name":'西城区' },
                { "id":17, "name":'海淀区' },
                { "id":18, "name":'宣武区' },
                { "id":19, "name":'崇文区' },
                { "id":20, "name":'丰台区' },
                { "id":328, "name":'石景山区' },
                { "id":5952, "name":'大兴区' },
                { "id":5951, "name":'通州区' },
                { "id":5950, "name":'昌平区' },
                { "id":21, "name":'近郊'}
            ]}
        ] },
        { "id":22, "name":'重庆', "subcity":[
            { "id":9, "name":'重庆', "sub":[
                { "id":42, "name":'渝中区' },
                { "id":43, "name":'沙坪坝区' },
                { "id":44, "name":'江北区' },
                { "id":45, "name":'渝北区' },
                { "id":46, "name":'南岸区' },
                { "id":47, "name":'九龙坡区' },
                { "id":48, "name":'大渡口区' },
                { "id":5742, "name":'巴南区' },
                { "id":5741, "name":'北碚区' },
                { "id":50, "name":'近郊'}
            ]}
        ] },
        { "id":2, "name":'天津', "subcity":[
            { "id":10, "name":'天津', "sub":[
                { "id":51, "name":'和平区' },
                { "id":52, "name":'南开区' },
                { "id":53, "name":'河西区' },
                { "id":54, "name":'河东区' },
                { "id":55, "name":'河北区' },
                { "id":56, "name":'红桥区' },
                { "id":2803, "name":'塘沽区' },
                { "id":57, "name":'近郊'}
            ]}
        ] },
        { "id":30, "name":'宁夏', "subcity":[
            { "id":321, "name":'银川', "sub":[
                { "id":5628, "name":'兴庆区' },
                { "id":5629, "name":'金凤区' },
                { "id":5630, "name":'西夏区' },
                { "id":5631, "name":'灵武市' },
                { "id":5632, "name":'永宁县' },
                { "id":5633, "name":'贺兰县'}
            ] },
            { "id":322, "name":'石嘴山', "sub":[
                { "id":5634, "name":'大武口区' },
                { "id":5635, "name":'惠农区' },
                { "id":5636, "name":'平罗县'}
            ] },
            { "id":351, "name":'中卫', "sub":[
                { "id":5646, "name":'沙坡头区' },
                { "id":5647, "name":'中宁县（宁安镇）' },
                { "id":5648, "name":'海原县（海城镇）'}
            ] },
            { "id":323, "name":'吴忠', "sub":[
                { "id":5637, "name":'利通区' },
                { "id":5638, "name":'青铜峡市' },
                { "id":5639, "name":'盐池县' },
                { "id":5640, "name":'同心县'}
            ] },
            { "id":324, "name":'固原', "sub":[
                { "id":5641, "name":'原州区' },
                { "id":5642, "name":'西吉县' },
                { "id":5643, "name":'隆德县' },
                { "id":5644, "name":'泾源县' },
                { "id":5645, "name":'彭阳县'}
            ]}
        ] },
        { "id":19, "name":'广东', "subcity":[
            { "id":4, "name":'广州', "sub":[
                { "id":22, "name":'天河区' },
                { "id":24, "name":'越秀区' },
                { "id":25, "name":'海珠区' },
                { "id":26, "name":'荔湾区' },
                { "id":27, "name":'白云区' },
                { "id":621, "name":'番禺区' },
                { "id":28, "name":'近郊'}
            ] },
            { "id":7, "name":'深圳', "sub":[
                { "id":29, "name":'福田区' },
                { "id":30, "name":'罗湖区' },
                { "id":31, "name":'南山区' },
                { "id":32, "name":'盐田区' },
                { "id":33, "name":'宝安区' },
                { "id":34, "name":'龙岗区'}
            ] },
            { "id":206, "name":'珠海', "sub":[
                { "id":316, "name":'香洲区' },
                { "id":317, "name":'斗门区' },
                { "id":318, "name":'金湾区'}
            ] },
            { "id":208, "name":'佛山', "sub":[
                { "id":340, "name":'禅城区' },
                { "id":341, "name":'顺德区' },
                { "id":342, "name":'南海区' },
                { "id":343, "name":'高明区' },
                { "id":344, "name":'三水区'}
            ] },
            { "id":219, "name":'东莞', "sub":[
                { "id":433, "name":'莞城区' },
                { "id":448, "name":'中堂镇' },
                { "id":447, "name":'石龙镇' },
                { "id":446, "name":'石碣镇' },
                { "id":445, "name":'塘厦镇' },
                { "id":444, "name":'清溪镇' },
                { "id":443, "name":'樟木头镇' },
                { "id":442, "name":'大朗镇' },
                { "id":441, "name":'常平镇' },
                { "id":440, "name":'大岭山镇' },
                { "id":439, "name":'长安镇' },
                { "id":438, "name":'厚街镇' },
                { "id":437, "name":'虎门镇' },
                { "id":436, "name":'万江区' },
                { "id":435, "name":'南城区' },
                { "id":434, "name":'东城区' },
                { "id":449, "name":'其他'}
            ] },
            { "id":207, "name":'汕头', "sub":[
                { "id":4791, "name":'金平区' },
                { "id":4792, "name":'濠江区' },
                { "id":4793, "name":'龙湖区' },
                { "id":4794, "name":'潮阳区' },
                { "id":4795, "name":'潮南区' },
                { "id":4796, "name":'澄海区' },
                { "id":4797, "name":'南澳县'}
            ] },
            { "id":209, "name":'江门', "sub":[
                { "id":4812, "name":'江海区' },
                { "id":4813, "name":'蓬江区' },
                { "id":4814, "name":'新会区' },
                { "id":4815, "name":'恩平市' },
                { "id":4816, "name":'台山市' },
                { "id":4817, "name":'开平市' },
                { "id":4818, "name":'鹤山市'}
            ] },
            { "id":220, "name":'中山' },
            { "id":211, "name":'茂名', "sub":[
                { "id":4836, "name":'茂南区' },
                { "id":4837, "name":'茂港区' },
                { "id":4838, "name":'化州市' },
                { "id":4839, "name":'信宜市' },
                { "id":4840, "name":'高州市' },
                { "id":4841, "name":'电白县'}
            ] },
            { "id":217, "name":'阳江', "sub":[
                { "id":4832, "name":'江城区' },
                { "id":4833, "name":'阳春市' },
                { "id":4834, "name":'阳西县' },
                { "id":4835, "name":'阳东县'}
            ] },
            { "id":212, "name":'肇庆', "sub":[
                { "id":4819, "name":'端州区' },
                { "id":4820, "name":'鼎湖区' },
                { "id":4821, "name":'高要市' },
                { "id":4822, "name":'四会市' },
                { "id":4823, "name":'广宁县' },
                { "id":4824, "name":'怀集县' },
                { "id":4825, "name":'封开县' },
                { "id":4826, "name":'德庆县'}
            ] },
            { "id":213, "name":'惠州', "sub":[
                { "id":4807, "name":'惠城区' },
                { "id":4808, "name":'惠阳区' },
                { "id":4809, "name":'博罗县' },
                { "id":4810, "name":'惠东县' },
                { "id":4811, "name":'龙门县'}
            ] },
            { "id":210, "name":'湛江', "sub":[
                { "id":4842, "name":'赤坎区' },
                { "id":4843, "name":'霞山区' },
                { "id":4844, "name":'坡头区' },
                { "id":4845, "name":'麻章区' },
                { "id":4846, "name":'吴川市' },
                { "id":4847, "name":'廉江市' },
                { "id":4848, "name":'雷州市' },
                { "id":4849, "name":'遂溪县' },
                { "id":4850, "name":'徐闻县'}
            ] },
            { "id":205, "name":'韶关', "sub":[
                { "id":4764, "name":'浈江区' },
                { "id":4772, "name":'新丰县' },
                { "id":4771, "name":'翁源县' },
                { "id":4770, "name":'仁化县' },
                { "id":4769, "name":'始兴县' },
                { "id":4768, "name":'南雄市' },
                { "id":4767, "name":'乐昌市' },
                { "id":4766, "name":'曲江区' },
                { "id":4765, "name":'武江区' },
                { "id":4773, "name":'乳源瑶族自治县'}
            ] },
            { "id":218, "name":'清远', "sub":[
                { "id":4756, "name":'清城区' },
                { "id":4757, "name":'英德市' },
                { "id":4758, "name":'连州市' },
                { "id":4759, "name":'佛冈县' },
                { "id":4760, "name":'阳山县' },
                { "id":4761, "name":'清新县' },
                { "id":4762, "name":'连山壮族瑶族自治县' },
                { "id":4763, "name":'连南瑶族自治县'}
            ] },
            { "id":214, "name":'梅州', "sub":[
                { "id":4780, "name":'梅江区' },
                { "id":4781, "name":'兴宁市' },
                { "id":4782, "name":'梅县' },
                { "id":4783, "name":'大埔县' },
                { "id":4784, "name":'丰顺县' },
                { "id":4785, "name":'五华县' },
                { "id":4786, "name":'平远县' },
                { "id":4787, "name":'蕉岭县'}
            ] },
            { "id":216, "name":'河源', "sub":[
                { "id":4774, "name":'源城区' },
                { "id":4775, "name":'紫金县' },
                { "id":4776, "name":'龙川县' },
                { "id":4777, "name":'连平县' },
                { "id":4778, "name":'和平县' },
                { "id":4779, "name":'东源县'}
            ] },
            { "id":222, "name":'揭阳', "sub":[
                { "id":4798, "name":'榕城区' },
                { "id":4799, "name":'普宁市' },
                { "id":4800, "name":'揭东县' },
                { "id":4801, "name":'揭西县' },
                { "id":4802, "name":'惠来县'}
            ] },
            { "id":221, "name":'潮州', "sub":[
                { "id":4788, "name":'湘桥区' },
                { "id":4789, "name":'潮安县' },
                { "id":4790, "name":'饶平县'}
            ] },
            { "id":215, "name":'汕尾', "sub":[
                { "id":4803, "name":'城区' },
                { "id":4804, "name":'陆丰市' },
                { "id":4805, "name":'海丰县' },
                { "id":4806, "name":'陆河县'}
            ] },
            { "id":223, "name":'云浮', "sub":[
                { "id":4827, "name":'云城区' },
                { "id":4828, "name":'罗定市' },
                { "id":4829, "name":'云安县' },
                { "id":4830, "name":'新兴县' },
                { "id":4831, "name":'郁南县'}
            ]}
        ] },
        { "id":20, "name":'广西', "subcity":[
            { "id":224, "name":'南宁', "sub":[
                { "id":490, "name":'兴宁区' },
                { "id":491, "name":'青秀区' },
                { "id":492, "name":'江南区' },
                { "id":493, "name":'西乡塘区' },
                { "id":496, "name":'近郊'}
            ] },
            { "id":226, "name":'桂林', "sub":[
                { "id":4859, "name":'象山区' },
                { "id":4874, "name":'龙胜各族自治县' },
                { "id":4873, "name":'荔浦县' },
                { "id":4872, "name":'平乐县' },
                { "id":4871, "name":'资源县' },
                { "id":4870, "name":'灌阳县' },
                { "id":4869, "name":'永福县' },
                { "id":4868, "name":'兴安县' },
                { "id":4867, "name":'全州县' },
                { "id":4866, "name":'灵川县' },
                { "id":4865, "name":'临桂县' },
                { "id":4864, "name":'阳朔县' },
                { "id":4863, "name":'雁山区' },
                { "id":4862, "name":'七星区' },
                { "id":4861, "name":'秀峰区' },
                { "id":4860, "name":'叠彩区' },
                { "id":4875, "name":'恭城瑶族自治县'}
            ] },
            { "id":225, "name":'柳州', "sub":[
                { "id":4876, "name":'城中区' },
                { "id":4884, "name":'三江侗族自治县' },
                { "id":4883, "name":'融安县' },
                { "id":4882, "name":'鹿寨县' },
                { "id":4881, "name":'柳城县' },
                { "id":4880, "name":'柳江县' },
                { "id":4879, "name":'柳北区' },
                { "id":4878, "name":'柳南区' },
                { "id":4877, "name":'鱼峰区' },
                { "id":4885, "name":'融水苗族自治县'}
            ] },
            { "id":227, "name":'梧州', "sub":[
                { "id":4886, "name":'万秀区' },
                { "id":4887, "name":'蝶山区' },
                { "id":4888, "name":'长洲区' },
                { "id":4889, "name":'岑溪市' },
                { "id":4890, "name":'苍梧县' },
                { "id":4891, "name":'藤县' },
                { "id":4892, "name":'蒙山县'}
            ] },
            { "id":228, "name":'北海', "sub":[
                { "id":4908, "name":'海城区' },
                { "id":4909, "name":'银海区' },
                { "id":4910, "name":'铁山港区' },
                { "id":4911, "name":'合浦县'}
            ] },
            { "id":234, "name":'贺州', "sub":[
                { "id":4952, "name":'八步区' },
                { "id":4953, "name":'昭平县' },
                { "id":4954, "name":'钟山县' },
                { "id":4955, "name":'富川瑶族自治县'}
            ] },
            { "id":231, "name":'贵港', "sub":[
                { "id":4893, "name":'港北区' },
                { "id":4894, "name":'港南区' },
                { "id":4895, "name":'覃塘区' },
                { "id":4896, "name":'桂平市' },
                { "id":4897, "name":'平南县'}
            ] },
            { "id":230, "name":'钦州', "sub":[
                { "id":4904, "name":'钦南区' },
                { "id":4905, "name":'钦北区' },
                { "id":4906, "name":'灵山县' },
                { "id":4907, "name":'浦北县'}
            ] },
            { "id":232, "name":'玉林', "sub":[
                { "id":4898, "name":'玉州区' },
                { "id":4899, "name":'北流市' },
                { "id":4900, "name":'兴业县' },
                { "id":4901, "name":'容县' },
                { "id":4902, "name":'陆川县' },
                { "id":4903, "name":'博白县'}
            ] },
            { "id":233, "name":'百色', "sub":[
                { "id":4923, "name":'右江区' },
                { "id":4933, "name":'田林县' },
                { "id":4932, "name":'西林县' },
                { "id":4931, "name":'乐业县' },
                { "id":4930, "name":'凌云县' },
                { "id":4929, "name":'那坡县' },
                { "id":4928, "name":'靖西县' },
                { "id":4927, "name":'德保县' },
                { "id":4926, "name":'平果县' },
                { "id":4925, "name":'田东县' },
                { "id":4924, "name":'田阳县' },
                { "id":4934, "name":'隆林各族自治县'}
            ] },
            { "id":235, "name":'河池', "sub":[
                { "id":4935, "name":'金城江区' },
                { "id":4944, "name":'罗城仫佬族自治县' },
                { "id":4943, "name":'大化瑶族自治县' },
                { "id":4942, "name":'都安瑶族自治县' },
                { "id":4941, "name":'巴马瑶族自治县' },
                { "id":4940, "name":'东兰县' },
                { "id":4939, "name":'凤山县' },
                { "id":4938, "name":'天峨县' },
                { "id":4937, "name":'南丹县' },
                { "id":4936, "name":'宜州市' },
                { "id":4945, "name":'环江毛南族自治县'}
            ] },
            { "id":229, "name":'防城港', "sub":[
                { "id":4912, "name":'港口区' },
                { "id":4913, "name":'防城区' },
                { "id":4914, "name":'东兴市' },
                { "id":4915, "name":'上思县'}
            ] },
            { "id":394, "name":'崇左', "sub":[
                { "id":4916, "name":'江州区' },
                { "id":4917, "name":'凭祥市' },
                { "id":4918, "name":'扶绥县' },
                { "id":4919, "name":'大新县' },
                { "id":4920, "name":'天等县' },
                { "id":4921, "name":'宁明县' },
                { "id":4922, "name":'龙州县'}
            ] },
            { "id":398, "name":'来宾', "sub":[
                { "id":4946, "name":'兴宾区' },
                { "id":4947, "name":'合山市' },
                { "id":4948, "name":'象州县' },
                { "id":4949, "name":'武宣县' },
                { "id":4950, "name":'忻城县' },
                { "id":4951, "name":'金秀瑶族自治县'}
            ]}
        ] },
        { "id":21, "name":'海南', "subcity":[
            { "id":345, "name":'三亚' },
            { "id":408, "name":'文昌' },
            { "id":407, "name":'万宁' },
            { "id":406, "name":'屯昌县' },
            { "id":403, "name":'琼中' },
            { "id":402, "name":'琼海' },
            { "id":401, "name":'陵水' },
            { "id":400, "name":'临高县' },
            { "id":399, "name":'乐东' },
            { "id":396, "name":'东方' },
            { "id":395, "name":'定安县' },
            { "id":393, "name":'澄迈县' },
            { "id":392, "name":'昌江' },
            { "id":391, "name":'保亭' },
            { "id":390, "name":'白沙' },
            { "id":384, "name":'海口' },
            { "id":358, "name":'儋州' },
            { "id":410, "name":'五指山'}
        ] },
        { "id":23, "name":'四川', "subcity":[
            { "id":8, "name":'成都', "sub":[
                { "id":39, "name":'武侯区' },
                { "id":35, "name":'锦江区' },
                { "id":36, "name":'金牛区' },
                { "id":37, "name":'青羊区' },
                { "id":38, "name":'成华区' },
                { "id":41, "name":'近郊'}
            ] },
            { "id":238, "name":'自贡', "sub":[
                { "id":5027, "name":'自流井区' },
                { "id":5028, "name":'大安区' },
                { "id":5029, "name":'贡井区' },
                { "id":5030, "name":'沿滩区' },
                { "id":5031, "name":'荣县' },
                { "id":5032, "name":'富顺县'}
            ] },
            { "id":246, "name":'乐山', "sub":[
                { "id":5016, "name":'市中区' },
                { "id":5025, "name":'峨边彝族自治县' },
                { "id":5024, "name":'沐川县' },
                { "id":5023, "name":'夹江县' },
                { "id":5022, "name":'井研县' },
                { "id":5021, "name":'犍为县' },
                { "id":5020, "name":'峨眉山市' },
                { "id":5019, "name":'金口河区' },
                { "id":5018, "name":'五通桥区' },
                { "id":5017, "name":'沙湾区' },
                { "id":5026, "name":'马边彝族自治县'}
            ] },
            { "id":242, "name":'绵阳', "sub":[
                { "id":4977, "name":'涪城区' },
                { "id":4978, "name":'游仙区' },
                { "id":4979, "name":'江油市' },
                { "id":4980, "name":'三台县' },
                { "id":4981, "name":'盐亭县' },
                { "id":4982, "name":'安县' },
                { "id":4983, "name":'梓潼县' },
                { "id":4984, "name":'北川羌族自治县' },
                { "id":4985, "name":'平武县'}
            ] },
            { "id":247, "name":'南充', "sub":[
                { "id":4992, "name":'顺庆区' },
                { "id":4993, "name":'高坪区' },
                { "id":4994, "name":'嘉陵区' },
                { "id":4995, "name":'阆中市' },
                { "id":4996, "name":'南部县' },
                { "id":4997, "name":'营山县' },
                { "id":4998, "name":'蓬安县' },
                { "id":4999, "name":'仪陇县' },
                { "id":5000, "name":'西充县'}
            ] },
            { "id":255, "name":'阿坝', "sub":[
                { "id":5084, "name":'马尔康县' },
                { "id":5095, "name":'若尔盖县' },
                { "id":5094, "name":'阿坝县' },
                { "id":5093, "name":'壤塘县' },
                { "id":5092, "name":'黑水县' },
                { "id":5091, "name":'小金县' },
                { "id":5090, "name":'金川县' },
                { "id":5089, "name":'九寨沟县' },
                { "id":5088, "name":'松潘县' },
                { "id":5087, "name":'茂县' },
                { "id":5086, "name":'理县' },
                { "id":5085, "name":'汶川县' },
                { "id":5096, "name":'红原县'}
            ] },
            { "id":249, "name":'宜宾', "sub":[
                { "id":5040, "name":'翠屏区' },
                { "id":5048, "name":'兴文县' },
                { "id":5047, "name":'珙县' },
                { "id":5046, "name":'筠连县' },
                { "id":5045, "name":'高县' },
                { "id":5044, "name":'长宁县' },
                { "id":5043, "name":'江安县' },
                { "id":5042, "name":'南溪县' },
                { "id":5041, "name":'宜宾县' },
                { "id":5049, "name":'屏山县'}
            ] },
            { "id":241, "name":'德阳', "sub":[
                { "id":4986, "name":'旌阳区' },
                { "id":4987, "name":'什邡市' },
                { "id":4988, "name":'广汉市' },
                { "id":4989, "name":'绵竹市' },
                { "id":4990, "name":'罗江县' },
                { "id":4991, "name":'中江县'}
            ] },
            { "id":252, "name":'雅安', "sub":[
                { "id":5076, "name":'雨城区' },
                { "id":5077, "name":'名山县' },
                { "id":5078, "name":'荥经县' },
                { "id":5079, "name":'汉源县' },
                { "id":5080, "name":'石棉县' },
                { "id":5081, "name":'天全县' },
                { "id":5082, "name":'芦山县' },
                { "id":5083, "name":'宝兴县'}
            ] },
            { "id":257, "name":'凉山', "sub":[
                { "id":5115, "name":'西昌市' },
                { "id":5130, "name":'雷波县' },
                { "id":5129, "name":'美姑县' },
                { "id":5128, "name":'甘洛县' },
                { "id":5127, "name":'越西县' },
                { "id":5126, "name":'冕宁县' },
                { "id":5125, "name":'喜德县' },
                { "id":5124, "name":'昭觉县' },
                { "id":5123, "name":'金阳县' },
                { "id":5122, "name":'布拖县' },
                { "id":5121, "name":'普格县' },
                { "id":5120, "name":'宁南县' },
                { "id":5119, "name":'会东县' },
                { "id":5118, "name":'会理县' },
                { "id":5117, "name":'德昌县' },
                { "id":5116, "name":'盐源县' },
                { "id":5131, "name":'木里藏族自治县'}
            ] },
            { "id":244, "name":'遂宁', "sub":[
                { "id":5006, "name":'船山区' },
                { "id":5007, "name":'安居区' },
                { "id":5008, "name":'蓬溪县' },
                { "id":5009, "name":'射洪县' },
                { "id":5010, "name":'大英县'}
            ] },
            { "id":245, "name":'内江', "sub":[
                { "id":5011, "name":'市中区' },
                { "id":5012, "name":'东兴区' },
                { "id":5013, "name":'威远县' },
                { "id":5014, "name":'资中县' },
                { "id":5015, "name":'隆昌县'}
            ] },
            { "id":240, "name":'泸州', "sub":[
                { "id":5033, "name":'江阳区' },
                { "id":5034, "name":'纳溪区' },
                { "id":5035, "name":'龙马潭区' },
                { "id":5036, "name":'泸县' },
                { "id":5037, "name":'合江县' },
                { "id":5038, "name":'叙永县' },
                { "id":5039, "name":'古蔺县'}
            ] },
            { "id":251, "name":'达州', "sub":[
                { "id":5059, "name":'通川区' },
                { "id":5060, "name":'万源市' },
                { "id":5061, "name":'达县' },
                { "id":5062, "name":'宣汉县' },
                { "id":5063, "name":'开江县' },
                { "id":5064, "name":'大竹县' },
                { "id":5065, "name":'渠县'}
            ] },
            { "id":243, "name":'广元', "sub":[
                { "id":4970, "name":'市中区' },
                { "id":4971, "name":'元坝区' },
                { "id":4972, "name":'朝天区' },
                { "id":4973, "name":'旺苍县' },
                { "id":4974, "name":'青川县' },
                { "id":4975, "name":'剑阁县' },
                { "id":4976, "name":'苍溪县'}
            ] },
            { "id":250, "name":'广安', "sub":[
                { "id":5001, "name":'广安区' },
                { "id":5002, "name":'华蓥市' },
                { "id":5003, "name":'岳池县' },
                { "id":5004, "name":'武胜县' },
                { "id":5005, "name":'邻水县'}
            ] },
            { "id":248, "name":'眉山', "sub":[
                { "id":5070, "name":'东坡区' },
                { "id":5071, "name":'仁寿县' },
                { "id":5072, "name":'彭山县' },
                { "id":5073, "name":'洪雅县' },
                { "id":5074, "name":'丹棱县' },
                { "id":5075, "name":'青神县'}
            ] },
            { "id":239, "name":'攀枝花', "sub":[
                { "id":5050, "name":'东区' },
                { "id":5051, "name":'西区' },
                { "id":5052, "name":'仁和区' },
                { "id":5053, "name":'米易县' },
                { "id":5054, "name":'盐边县'}
            ] },
            { "id":254, "name":'资阳', "sub":[
                { "id":5066, "name":'雁江区' },
                { "id":5067, "name":'简阳市' },
                { "id":5068, "name":'乐至县' },
                { "id":5069, "name":'安岳县'}
            ] },
            { "id":253, "name":'巴中', "sub":[
                { "id":5055, "name":'巴州区' },
                { "id":5056, "name":'通江县' },
                { "id":5057, "name":'南江县' },
                { "id":5058, "name":'平昌县'}
            ]}
        ] },
        { "id":24, "name":'贵州', "subcity":[
            { "id":258, "name":'贵阳', "sub":[
                { "id":497, "name":'云岩区' },
                { "id":498, "name":'南明区' },
                { "id":499, "name":'小河区' },
                { "id":500, "name":'花溪区' },
                { "id":501, "name":'乌当区' },
                { "id":502, "name":'白云区' },
                { "id":503, "name":'近郊'}
            ] },
            { "id":260, "name":'遵义', "sub":[
                { "id":5140, "name":'红花岗区' },
                { "id":5152, "name":'道真仡佬族苗族自治县' },
                { "id":5151, "name":'习水县' },
                { "id":5150, "name":'余庆县' },
                { "id":5149, "name":'湄潭县' },
                { "id":5148, "name":'凤冈县' },
                { "id":5147, "name":'正安县' },
                { "id":5146, "name":'绥阳县' },
                { "id":5145, "name":'桐梓县' },
                { "id":5144, "name":'遵义县' },
                { "id":5143, "name":'仁怀市' },
                { "id":5142, "name":'赤水市' },
                { "id":5141, "name":'汇川区' },
                { "id":5153, "name":'务川仡佬族苗族自治县'}
            ] },
            { "id":265, "name":'黔东南', "sub":[
                { "id":5178, "name":'凯里市' },
                { "id":5192, "name":'麻江县' },
                { "id":5191, "name":'雷山县' },
                { "id":5190, "name":'从江县' },
                { "id":5189, "name":'榕江县' },
                { "id":5188, "name":'黎平县' },
                { "id":5187, "name":'台江县' },
                { "id":5186, "name":'剑河县' },
                { "id":5185, "name":'锦屏县' },
                { "id":5184, "name":'天柱县' },
                { "id":5183, "name":'岑巩县' },
                { "id":5182, "name":'镇远县' },
                { "id":5181, "name":'三穗县' },
                { "id":5180, "name":'施秉县' },
                { "id":5179, "name":'黄平县' },
                { "id":5193, "name":'丹寨县'}
            ] },
            { "id":261, "name":'安顺', "sub":[
                { "id":5154, "name":'西秀区' },
                { "id":5155, "name":'平坝县' },
                { "id":5156, "name":'普定县' },
                { "id":5157, "name":'关岭布依族苗族自治县' },
                { "id":5158, "name":'镇宁布依族苗族自治县' },
                { "id":5159, "name":'紫云苗族布依族自治县'}
            ] },
            { "id":259, "name":'六盘水', "sub":[
                { "id":5136, "name":'钟山区' },
                { "id":5137, "name":'盘县' },
                { "id":5138, "name":'六枝特区' },
                { "id":5139, "name":'水城县（滥坝镇）'}
            ] },
            { "id":262, "name":'铜仁地区', "sub":[
                { "id":5168, "name":'铜仁市' },
                { "id":5176, "name":'松桃苗族自治县' },
                { "id":5175, "name":'沿河土家族自治县' },
                { "id":5174, "name":'印江土家族苗族自治县' },
                { "id":5173, "name":'玉屏侗族自治县' },
                { "id":5172, "name":'德江县' },
                { "id":5171, "name":'思南县' },
                { "id":5170, "name":'石阡县' },
                { "id":5169, "name":'江口县' },
                { "id":5177, "name":'万山特区'}
            ] },
            { "id":266, "name":'黔南', "sub":[
                { "id":5194, "name":'都匀市' },
                { "id":5204, "name":'惠水县' },
                { "id":5203, "name":'龙里县' },
                { "id":5202, "name":'长顺县' },
                { "id":5201, "name":'罗甸县' },
                { "id":5200, "name":'平塘县' },
                { "id":5199, "name":'独山县' },
                { "id":5198, "name":'瓮安县' },
                { "id":5197, "name":'贵定县' },
                { "id":5196, "name":'荔波县' },
                { "id":5195, "name":'福泉市' },
                { "id":5205, "name":'三都水族自治县'}
            ] },
            { "id":264, "name":'毕节地区', "sub":[
                { "id":5160, "name":'毕节市' },
                { "id":5161, "name":'大方县' },
                { "id":5162, "name":'黔西县' },
                { "id":5163, "name":'金沙县' },
                { "id":5164, "name":'织金县' },
                { "id":5165, "name":'纳雍县' },
                { "id":5166, "name":'赫章县' },
                { "id":5167, "name":'威宁彝族回族苗族自治县'}
            ] },
            { "id":263, "name":'黔西南', "sub":[
                { "id":5206, "name":'兴义市' },
                { "id":5207, "name":'兴仁县' },
                { "id":5208, "name":'普安县' },
                { "id":5209, "name":'晴隆县' },
                { "id":5210, "name":'贞丰县' },
                { "id":5211, "name":'望谟县' },
                { "id":5212, "name":'册亨县' },
                { "id":5213, "name":'安龙县'}
            ]}
        ] },
        { "id":25, "name":'云南', "subcity":[
            { "id":267, "name":'昆明', "sub":[
                { "id":5214, "name":'东川区' },
                { "id":335, "name":'盘龙区' },
                { "id":336, "name":'五华区' },
                { "id":337, "name":'官渡区' },
                { "id":338, "name":'西山区' },
                { "id":339, "name":'近郊'}
            ] },
            { "id":279, "name":'丽江', "sub":[
                { "id":5258, "name":'古城区' },
                { "id":5259, "name":'永胜县' },
                { "id":5260, "name":'华坪县' },
                { "id":5261, "name":'玉龙纳西族自治县' },
                { "id":5262, "name":'宁蒗彝族自治县'}
            ] },
            { "id":281, "name":'迪庆', "sub":[
                { "id":5290, "name":'香格里拉县' },
                { "id":5291, "name":'德钦县' },
                { "id":5292, "name":'维西傈僳族自治县'}
            ] },
            { "id":276, "name":'西双版纳', "sub":[
                { "id":5315, "name":'景洪市' },
                { "id":5316, "name":'勐海县' },
                { "id":5317, "name":'勐腊县'}
            ] },
            { "id":269, "name":'玉溪', "sub":[
                { "id":5233, "name":'红塔区' },
                { "id":5234, "name":'江川县' },
                { "id":5235, "name":'澄江县' },
                { "id":5236, "name":'通海县' },
                { "id":5237, "name":'华宁县' },
                { "id":5238, "name":'易门县' },
                { "id":5239, "name":'峨山彝族自治县' },
                { "id":5240, "name":'新平彝族傣族自治县' },
                { "id":5241, "name":'元江哈尼族彝族傣族自治县'}
            ] },
            { "id":270, "name":'保山', "sub":[
                { "id":5242, "name":'隆阳区' },
                { "id":5243, "name":'施甸县' },
                { "id":5244, "name":'腾冲县' },
                { "id":5245, "name":'龙陵县' },
                { "id":5246, "name":'昌宁县'}
            ] },
            { "id":268, "name":'曲靖', "sub":[
                { "id":5224, "name":'麒麟区' },
                { "id":5225, "name":'宣威市' },
                { "id":5226, "name":'马龙县' },
                { "id":5227, "name":'沾益县' },
                { "id":5228, "name":'富源县' },
                { "id":5229, "name":'罗平县' },
                { "id":5230, "name":'师宗县' },
                { "id":5231, "name":'陆良县' },
                { "id":5232, "name":'会泽县'}
            ] },
            { "id":278, "name":'德宏', "sub":[
                { "id":5281, "name":'潞西市' },
                { "id":5282, "name":'瑞丽市' },
                { "id":5283, "name":'梁河县' },
                { "id":5284, "name":'盈江县' },
                { "id":5285, "name":'陇川县'}
            ] },
            { "id":273, "name":'红河', "sub":[
                { "id":5318, "name":'蒙自县' },
                { "id":5329, "name":'河口瑶族自治县' },
                { "id":5328, "name":'金平苗族瑶族傣族自治县' },
                { "id":5327, "name":'红河县' },
                { "id":5326, "name":'元阳县' },
                { "id":5325, "name":'泸西县' },
                { "id":5324, "name":'弥勒县' },
                { "id":5323, "name":'石屏县' },
                { "id":5322, "name":'建水县' },
                { "id":5321, "name":'绿春县' },
                { "id":5320, "name":'开远市' },
                { "id":5319, "name":'个旧市' },
                { "id":5330, "name":'屏边苗族自治县'}
            ] },
            { "id":280, "name":'怒江', "sub":[
                { "id":5286, "name":'泸水县' },
                { "id":5287, "name":'福贡县' },
                { "id":5288, "name":'贡山独龙族怒族自治县' },
                { "id":5289, "name":'兰坪白族普米族自治县'}
            ] },
            { "id":271, "name":'昭通', "sub":[
                { "id":5247, "name":'昭阳区' },
                { "id":5256, "name":'威信县' },
                { "id":5255, "name":'彝良县' },
                { "id":5254, "name":'镇雄县' },
                { "id":5253, "name":'绥江县' },
                { "id":5252, "name":'永善县' },
                { "id":5251, "name":'大关县' },
                { "id":5250, "name":'盐津县' },
                { "id":5249, "name":'巧家县' },
                { "id":5248, "name":'鲁甸县' },
                { "id":5257, "name":'水富县'}
            ] },
            { "id":282, "name":'临沧', "sub":[
                { "id":5273, "name":'临翔区' },
                { "id":5274, "name":'凤庆县' },
                { "id":5275, "name":'云县' },
                { "id":5276, "name":'永德县' },
                { "id":5277, "name":'镇康县' },
                { "id":5278, "name":'双江拉祜族佤族布朗族傣族自治县' },
                { "id":5279, "name":'耿马傣族佤族自治县' },
                { "id":5280, "name":'沧源佤族自治县'}
            ]}
        ] },
        { "id":26, "name":'西藏', "subcity":[
            { "id":283, "name":'拉萨', "sub":[
                { "id":5339, "name":'城关区' },
                { "id":5340, "name":'林周县' },
                { "id":5341, "name":'当雄县' },
                { "id":5342, "name":'尼木县' },
                { "id":5343, "name":'曲水县' },
                { "id":5344, "name":'堆龙德庆县' },
                { "id":5345, "name":'达孜县' },
                { "id":5346, "name":'墨竹工卡县'}
            ] },
            { "id":289, "name":'林芝地区', "sub":[
                { "id":5368, "name":'林芝县' },
                { "id":5369, "name":'工布江达县' },
                { "id":5370, "name":'米林县' },
                { "id":5371, "name":'墨脱县' },
                { "id":5372, "name":'波密县' },
                { "id":5373, "name":'察隅县' },
                { "id":5374, "name":'朗县'}
            ] },
            { "id":286, "name":'日喀则地区', "sub":[
                { "id":5387, "name":'日喀则市' },
                { "id":5403, "name":'萨嘎县' },
                { "id":5402, "name":'聂拉木县' },
                { "id":5401, "name":'吉隆县' },
                { "id":5400, "name":'亚东县' },
                { "id":5399, "name":'仲巴县' },
                { "id":5398, "name":'定结县' },
                { "id":5397, "name":'康马县' },
                { "id":5396, "name":'仁布县' },
                { "id":5395, "name":'白朗县' },
                { "id":5394, "name":'谢通门县' },
                { "id":5393, "name":'昂仁县' },
                { "id":5392, "name":'拉孜县' },
                { "id":5391, "name":'萨迦县' },
                { "id":5390, "name":'定日县' },
                { "id":5389, "name":'江孜县' },
                { "id":5388, "name":'南木林县' },
                { "id":5404, "name":'岗巴县'}
            ] },
            { "id":288, "name":'阿里', "sub":[
                { "id":5405, "name":'噶尔县' },
                { "id":5406, "name":'普兰县' },
                { "id":5407, "name":'札达县' },
                { "id":5408, "name":'日土县' },
                { "id":5409, "name":'革吉县' },
                { "id":5410, "name":'改则县' },
                { "id":5411, "name":'措勤县'}
            ] },
            { "id":285, "name":'山南', "sub":[
                { "id":5375, "name":'乃东县' },
                { "id":5385, "name":'错那县' },
                { "id":5384, "name":'隆子县' },
                { "id":5383, "name":'加查县' },
                { "id":5382, "name":'洛扎县' },
                { "id":5381, "name":'措美县' },
                { "id":5380, "name":'曲松县' },
                { "id":5379, "name":'琼结县' },
                { "id":5378, "name":'桑日县' },
                { "id":5377, "name":'贡嘎县' },
                { "id":5376, "name":'扎囊县' },
                { "id":5386, "name":'浪卡子县'}
            ] },
            { "id":284, "name":'昌都地区', "sub":[
                { "id":5357, "name":'昌都县' },
                { "id":5366, "name":'洛隆县' },
                { "id":5365, "name":'芒康县' },
                { "id":5364, "name":'左贡县' },
                { "id":5363, "name":'八宿县' },
                { "id":5362, "name":'察雅县' },
                { "id":5361, "name":'丁青县' },
                { "id":5360, "name":'类乌齐县' },
                { "id":5359, "name":'贡觉县' },
                { "id":5358, "name":'江达县' },
                { "id":5367, "name":'边坝县'}
            ] },
            { "id":287, "name":'那曲', "sub":[
                { "id":5347, "name":'那曲县' },
                { "id":5355, "name":'巴青县' },
                { "id":5354, "name":'班戈县' },
                { "id":5353, "name":'索县' },
                { "id":5352, "name":'申扎县' },
                { "id":5351, "name":'安多县' },
                { "id":5350, "name":'聂荣县' },
                { "id":5349, "name":'比如县' },
                { "id":5348, "name":'嘉黎县' },
                { "id":5356, "name":'尼玛县'}
            ]}
        ] },
        { "id":27, "name":'陕西', "subcity":[
            { "id":17, "name":'西安', "sub":[
                { "id":123, "name":'碑林区' },
                { "id":124, "name":'新城区' },
                { "id":125, "name":'莲湖区' },
                { "id":126, "name":'雁塔区' },
                { "id":127, "name":'未央区' },
                { "id":129, "name":'高新区' },
                { "id":467, "name":'长安区' },
                { "id":5412, "name":'灞桥区' },
                { "id":5413, "name":'阎良区' },
                { "id":5414, "name":'临潼区' },
                { "id":128, "name":'近郊'}
            ] },
            { "id":291, "name":'宝鸡', "sub":[
                { "id":5461, "name":'渭滨区' },
                { "id":5471, "name":'凤县' },
                { "id":5470, "name":'麟游县' },
                { "id":5469, "name":'千阳县' },
                { "id":5468, "name":'陇县' },
                { "id":5467, "name":'眉县' },
                { "id":5466, "name":'扶风县' },
                { "id":5465, "name":'岐山县' },
                { "id":5464, "name":'凤翔县' },
                { "id":5463, "name":'陈仓区' },
                { "id":5462, "name":'金台区' },
                { "id":5472, "name":'太白县'}
            ] },
            { "id":292, "name":'咸阳', "sub":[
                { "id":5447, "name":'秦都区' },
                { "id":5459, "name":'淳化县' },
                { "id":5458, "name":'旬邑县' },
                { "id":5457, "name":'长武县' },
                { "id":5456, "name":'彬县' },
                { "id":5455, "name":'永寿县' },
                { "id":5454, "name":'礼泉县' },
                { "id":5453, "name":'乾县' },
                { "id":5452, "name":'泾阳县' },
                { "id":5451, "name":'三原县' },
                { "id":5450, "name":'兴平市' },
                { "id":5449, "name":'渭城区' },
                { "id":5448, "name":'杨陵区' },
                { "id":5460, "name":'武功县'}
            ] },
            { "id":294, "name":'延安', "sub":[
                { "id":5419, "name":'宝塔区' },
                { "id":5430, "name":'黄龙县' },
                { "id":5429, "name":'宜川县' },
                { "id":5428, "name":'洛川县' },
                { "id":5427, "name":'富县' },
                { "id":5426, "name":'甘泉县' },
                { "id":5425, "name":'吴起县' },
                { "id":5424, "name":'志丹县' },
                { "id":5423, "name":'安塞县' },
                { "id":5422, "name":'子长县' },
                { "id":5421, "name":'延川县' },
                { "id":5420, "name":'延长县' },
                { "id":5431, "name":'黄陵县'}
            ] },
            { "id":293, "name":'渭南', "sub":[
                { "id":5436, "name":'临渭区' },
                { "id":5445, "name":'合阳县' },
                { "id":5444, "name":'白水县' },
                { "id":5443, "name":'澄城县' },
                { "id":5442, "name":'蒲城县' },
                { "id":5441, "name":'大荔县' },
                { "id":5440, "name":'潼关县' },
                { "id":5439, "name":'华县' },
                { "id":5438, "name":'韩城市' },
                { "id":5437, "name":'华阴市' },
                { "id":5446, "name":'富平县'}
            ] },
            { "id":296, "name":'榆林', "sub":[
                { "id":5484, "name":'榆阳区' },
                { "id":5494, "name":'清涧县' },
                { "id":5493, "name":'吴堡县' },
                { "id":5492, "name":'佳县' },
                { "id":5491, "name":'米脂县' },
                { "id":5490, "name":'绥德县' },
                { "id":5489, "name":'定边县' },
                { "id":5488, "name":'靖边县' },
                { "id":5487, "name":'横山县' },
                { "id":5486, "name":'府谷县' },
                { "id":5485, "name":'神木县' },
                { "id":5495, "name":'子洲县'}
            ] },
            { "id":295, "name":'汉中', "sub":[
                { "id":5473, "name":'汉台区' },
                { "id":5482, "name":'留坝县' },
                { "id":5481, "name":'镇巴县' },
                { "id":5480, "name":'略阳县' },
                { "id":5479, "name":'宁强县' },
                { "id":5478, "name":'勉县' },
                { "id":5477, "name":'西乡县' },
                { "id":5476, "name":'洋县' },
                { "id":5475, "name":'城固县' },
                { "id":5474, "name":'南郑县' },
                { "id":5483, "name":'佛坪县'}
            ] },
            { "id":297, "name":'安康', "sub":[
                { "id":5496, "name":'汉滨区' },
                { "id":5504, "name":'旬阳县' },
                { "id":5503, "name":'镇坪县' },
                { "id":5502, "name":'平利县' },
                { "id":5501, "name":'岚皋县' },
                { "id":5500, "name":'紫阳县' },
                { "id":5499, "name":'宁陕县' },
                { "id":5498, "name":'石泉县' },
                { "id":5497, "name":'汉阴县' },
                { "id":5505, "name":'白河县'}
            ] },
            { "id":290, "name":'铜川', "sub":[
                { "id":5432, "name":'耀州区' },
                { "id":5433, "name":'王益区' },
                { "id":5434, "name":'印台区' },
                { "id":5435, "name":'宜君县'}
            ] },
            { "id":298, "name":'商洛', "sub":[
                { "id":5506, "name":'商州区' },
                { "id":5507, "name":'洛南县' },
                { "id":5508, "name":'丹凤县' },
                { "id":5509, "name":'商南县' },
                { "id":5510, "name":'山阳县' },
                { "id":5511, "name":'镇安县' },
                { "id":5512, "name":'柞水县'}
            ]}
        ] },
        { "id":28, "name":'甘肃', "subcity":[
            { "id":299, "name":'兰州', "sub":[
                { "id":427, "name":'城关区' },
                { "id":428, "name":'安宁区' },
                { "id":429, "name":'西固区' },
                { "id":430, "name":'七里河区' },
                { "id":431, "name":'红古区' },
                { "id":432, "name":'近郊'}
            ] },
            { "id":307, "name":'酒泉', "sub":[
                { "id":5534, "name":'肃州区' },
                { "id":5535, "name":'玉门市' },
                { "id":5536, "name":'敦煌市' },
                { "id":5537, "name":'金塔县' },
                { "id":5538, "name":'安西县' },
                { "id":5539, "name":'肃北蒙古族自治县' },
                { "id":5540, "name":'阿克塞哈萨克族自治县'}
            ] },
            { "id":303, "name":'天水', "sub":[
                { "id":5523, "name":'秦州区' },
                { "id":5524, "name":'麦积区' },
                { "id":5525, "name":'清水县' },
                { "id":5526, "name":'秦安县' },
                { "id":5527, "name":'甘谷县' },
                { "id":5528, "name":'武山县' },
                { "id":5529, "name":'张家川回族自治县'}
            ] },
            { "id":308, "name":'庆阳', "sub":[
                { "id":5547, "name":'西峰区' },
                { "id":5548, "name":'庆城县' },
                { "id":5549, "name":'环县' },
                { "id":5550, "name":'华池县' },
                { "id":5551, "name":'合水县' },
                { "id":5552, "name":'正宁县' },
                { "id":5553, "name":'宁县' },
                { "id":5554, "name":'镇原县'}
            ] },
            { "id":305, "name":'张掖', "sub":[
                { "id":5541, "name":'甘州区' },
                { "id":5542, "name":'民乐县' },
                { "id":5543, "name":'临泽县' },
                { "id":5544, "name":'高台县' },
                { "id":5545, "name":'山丹县' },
                { "id":5546, "name":'肃南裕固族自治县'}
            ] },
            { "id":300, "name":'嘉峪关' },
            { "id":312, "name":'甘南', "sub":[
                { "id":5586, "name":'合作市' },
                { "id":5587, "name":'临潭县' },
                { "id":5588, "name":'卓尼县' },
                { "id":5589, "name":'舟曲县' },
                { "id":5590, "name":'迭部县' },
                { "id":5591, "name":'玛曲县' },
                { "id":5592, "name":'碌曲县' },
                { "id":5593, "name":'夏河县'}
            ] },
            { "id":304, "name":'武威', "sub":[
                { "id":5530, "name":'凉州区' },
                { "id":5531, "name":'民勤县' },
                { "id":5532, "name":'古浪县' },
                { "id":5533, "name":'天祝藏族自治县'}
            ] },
            { "id":306, "name":'平凉', "sub":[
                { "id":5555, "name":'崆峒区' },
                { "id":5556, "name":'泾川县' },
                { "id":5557, "name":'灵台县' },
                { "id":5558, "name":'崇信县' },
                { "id":5559, "name":'华亭县' },
                { "id":5560, "name":'庄浪县' },
                { "id":5561, "name":'静宁县'}
            ] },
            { "id":310, "name":'陇南', "sub":[
                { "id":5569, "name":'武都区' },
                { "id":5570, "name":'成县' },
                { "id":5571, "name":'宕昌县' },
                { "id":5572, "name":'康县' },
                { "id":5573, "name":'文县' },
                { "id":5574, "name":'西和县' },
                { "id":5575, "name":'礼县' },
                { "id":5576, "name":'两当县' },
                { "id":5577, "name":'徽县'}
            ] },
            { "id":302, "name":'白银', "sub":[
                { "id":5518, "name":'白银区' },
                { "id":5519, "name":'平川区' },
                { "id":5520, "name":'靖远县' },
                { "id":5521, "name":'会宁县' },
                { "id":5522, "name":'景泰县'}
            ] },
            { "id":301, "name":'金昌', "sub":[
                { "id":5516, "name":'金川区' },
                { "id":5517, "name":'永昌县'}
            ] },
            { "id":309, "name":'定西', "sub":[
                { "id":5562, "name":'安定区' },
                { "id":5563, "name":'通渭县' },
                { "id":5564, "name":'临洮县' },
                { "id":5565, "name":'漳县' },
                { "id":5566, "name":'岷县' },
                { "id":5567, "name":'渭源县' },
                { "id":5568, "name":'陇西县'}
            ]}
        ] },
        { "id":29, "name":'青海', "subcity":[
            { "id":313, "name":'西宁', "sub":[
                { "id":477, "name":'城东区' },
                { "id":478, "name":'城中区' },
                { "id":479, "name":'城西区' },
                { "id":480, "name":'城北区' },
                { "id":481, "name":'近郊'}
            ] },
            { "id":320, "name":'海西', "sub":[
                { "id":5623, "name":'德令哈市' },
                { "id":5624, "name":'格尔木市' },
                { "id":5625, "name":'乌兰县' },
                { "id":5626, "name":'都兰县' },
                { "id":5627, "name":'天峻县'}
            ] },
            { "id":314, "name":'海东', "sub":[
                { "id":5597, "name":'平安县' },
                { "id":5598, "name":'乐都县' },
                { "id":5599, "name":'民和回族土族自治县' },
                { "id":5600, "name":'互助土族自治县' },
                { "id":5601, "name":'化隆回族自治县' },
                { "id":5602, "name":'循化撒拉族自治县'}
            ] },
            { "id":315, "name":'海北', "sub":[
                { "id":5603, "name":'海晏县' },
                { "id":5604, "name":'祁连县' },
                { "id":5605, "name":'刚察县' },
                { "id":5606, "name":'门源回族自治县'}
            ] },
            { "id":316, "name":'黄南', "sub":[
                { "id":5607, "name":'同仁县' },
                { "id":5608, "name":'尖扎县' },
                { "id":5609, "name":'泽库县' },
                { "id":5610, "name":'河南蒙古族自治县'}
            ] },
            { "id":319, "name":'玉树', "sub":[
                { "id":5617, "name":'玉树县' },
                { "id":5618, "name":'杂多县' },
                { "id":5619, "name":'称多县' },
                { "id":5620, "name":'治多县' },
                { "id":5621, "name":'囊谦县' },
                { "id":5622, "name":'曲麻莱县'}
            ] },
            { "id":318, "name":'果洛', "sub":[
                { "id":5611, "name":'玛沁县' },
                { "id":5612, "name":'班玛县' },
                { "id":5613, "name":'甘德县' },
                { "id":5614, "name":'达日县' },
                { "id":5615, "name":'久治县' },
                { "id":5616, "name":'玛多县'}
            ]}
        ] },
        { "id":18, "name":'湖南', "subcity":[
            { "id":344, "name":'长沙', "sub":[
                { "id":299, "name":'芙蓉区' },
                { "id":301, "name":'天心区' },
                { "id":300, "name":'开福区' },
                { "id":302, "name":'雨花区' },
                { "id":303, "name":'岳麓区' },
                { "id":304, "name":'近郊'}
            ] },
            { "id":204, "name":'湘西', "sub":[
                { "id":4748, "name":'吉首市' },
                { "id":4749, "name":'泸溪县' },
                { "id":4750, "name":'凤凰县' },
                { "id":4751, "name":'花垣县' },
                { "id":4752, "name":'保靖县' },
                { "id":4753, "name":'古丈县' },
                { "id":4754, "name":'永顺县' },
                { "id":4755, "name":'龙山县'}
            ] },
            { "id":198, "name":'张家界', "sub":[
                { "id":4643, "name":'永定区' },
                { "id":4644, "name":'武陵源区' },
                { "id":4645, "name":'慈利县' },
                { "id":4646, "name":'桑植县'}
            ] },
            { "id":194, "name":'衡阳', "sub":[
                { "id":4685, "name":'雁峰区' },
                { "id":4695, "name":'衡东县' },
                { "id":4694, "name":'衡山县' },
                { "id":4693, "name":'衡南县' },
                { "id":4692, "name":'衡阳县' },
                { "id":4691, "name":'耒阳市' },
                { "id":4690, "name":'常宁市' },
                { "id":4689, "name":'南岳区' },
                { "id":4688, "name":'蒸湘区' },
                { "id":4687, "name":'石鼓区' },
                { "id":4686, "name":'珠晖区' },
                { "id":4696, "name":'祁东县'}
            ] },
            { "id":192, "name":'株洲', "sub":[
                { "id":4671, "name":'天元区' },
                { "id":4672, "name":'荷塘区' },
                { "id":4673, "name":'芦淞区' },
                { "id":4674, "name":'石峰区' },
                { "id":4675, "name":'醴陵市' },
                { "id":4676, "name":'株洲县' },
                { "id":4677, "name":'攸县' },
                { "id":4678, "name":'茶陵县' },
                { "id":4679, "name":'炎陵县'}
            ] },
            { "id":193, "name":'湘潭', "sub":[
                { "id":4680, "name":'岳塘区' },
                { "id":4681, "name":'雨湖区' },
                { "id":4682, "name":'湘乡市' },
                { "id":4683, "name":'韶山市' },
                { "id":4684, "name":'湘潭县'}
            ] },
            { "id":195, "name":'邵阳', "sub":[
                { "id":4719, "name":'双清区' },
                { "id":4729, "name":'新宁县' },
                { "id":4728, "name":'绥宁县' },
                { "id":4727, "name":'洞口县' },
                { "id":4726, "name":'隆回县' },
                { "id":4725, "name":'新邵县' },
                { "id":4724, "name":'邵阳县' },
                { "id":4723, "name":'邵东县' },
                { "id":4722, "name":'武冈市' },
                { "id":4721, "name":'北塔区' },
                { "id":4720, "name":'大祥区' },
                { "id":4730, "name":'城步苗族自治县'}
            ] },
            { "id":196, "name":'岳阳', "sub":[
                { "id":4662, "name":'岳阳楼区' },
                { "id":4663, "name":'君山区' },
                { "id":4664, "name":'云溪区' },
                { "id":4665, "name":'汨罗市' },
                { "id":4666, "name":'临湘市' },
                { "id":4667, "name":'岳阳县' },
                { "id":4668, "name":'华容县' },
                { "id":4669, "name":'湘阴县' },
                { "id":4670, "name":'平江县'}
            ] },
            { "id":197, "name":'常德', "sub":[
                { "id":4647, "name":'武陵区' },
                { "id":4648, "name":'鼎城区' },
                { "id":4649, "name":'津市市' },
                { "id":4650, "name":'安乡县' },
                { "id":4651, "name":'汉寿县' },
                { "id":4652, "name":'澧县' },
                { "id":4653, "name":'临澧县' },
                { "id":4654, "name":'桃源县' },
                { "id":4655, "name":'石门县'}
            ] },
            { "id":199, "name":'益阳', "sub":[
                { "id":4656, "name":'赫山区' },
                { "id":4657, "name":'资阳区' },
                { "id":4658, "name":'沅江市' },
                { "id":4659, "name":'南县' },
                { "id":4660, "name":'桃江县' },
                { "id":4661, "name":'安化县'}
            ] },
            { "id":202, "name":'怀化', "sub":[
                { "id":4731, "name":'鹤城区' },
                { "id":4741, "name":'靖州苗族侗族自治县' },
                { "id":4740, "name":'芷江侗族自治县' },
                { "id":4739, "name":'新晃侗族自治县' },
                { "id":4738, "name":'麻阳苗族自治县' },
                { "id":4737, "name":'会同县' },
                { "id":4736, "name":'中方县' },
                { "id":4735, "name":'溆浦县' },
                { "id":4734, "name":'辰溪县' },
                { "id":4733, "name":'沅陵县' },
                { "id":4732, "name":'洪江市' },
                { "id":4742, "name":'通道侗族自治县'}
            ] },
            { "id":200, "name":'郴州', "sub":[
                { "id":4697, "name":'北湖区' },
                { "id":4706, "name":'桂东县' },
                { "id":4705, "name":'汝城县' },
                { "id":4704, "name":'临武县' },
                { "id":4703, "name":'嘉禾县' },
                { "id":4702, "name":'宜章县' },
                { "id":4701, "name":'永兴县' },
                { "id":4700, "name":'桂阳县' },
                { "id":4699, "name":'资兴市' },
                { "id":4698, "name":'苏仙区' },
                { "id":4707, "name":'安仁县'}
            ] },
            { "id":203, "name":'娄底', "sub":[
                { "id":4743, "name":'娄星区' },
                { "id":4744, "name":'冷水江市' },
                { "id":4745, "name":'涟源市' },
                { "id":4746, "name":'双峰县' },
                { "id":4747, "name":'新化县'}
            ] },
            { "id":201, "name":'永州', "sub":[
                { "id":4708, "name":'冷水滩区' },
                { "id":4717, "name":'祁阳县' },
                { "id":4716, "name":'双牌县' },
                { "id":4715, "name":'新田县' },
                { "id":4714, "name":'蓝山县' },
                { "id":4713, "name":'江永县' },
                { "id":4712, "name":'宁远县' },
                { "id":4711, "name":'道县' },
                { "id":4710, "name":'东安县' },
                { "id":4709, "name":'零陵区' },
                { "id":4718, "name":'江华瑶族自治县'}
            ]}
        ] },
        { "id":17, "name":'湖北', "subcity":[
            { "id":16, "name":'武汉', "sub":[
                { "id":110, "name":'江岸区' },
                { "id":111, "name":'武昌区' },
                { "id":112, "name":'江汉区' },
                { "id":113, "name":'硚口区' },
                { "id":114, "name":'汉阳区' },
                { "id":115, "name":'青山区' },
                { "id":116, "name":'洪山区' },
                { "id":383, "name":'东西湖区' },
                { "id":365, "name":'近郊'}
            ] },
            { "id":179, "name":'宜昌', "sub":[
                { "id":4616, "name":'西陵区' },
                { "id":4627, "name":'长阳土家族自治县' },
                { "id":4626, "name":'秭归县' },
                { "id":4625, "name":'兴山县' },
                { "id":4624, "name":'远安县' },
                { "id":4623, "name":'当阳市' },
                { "id":4622, "name":'宜都市' },
                { "id":4621, "name":'枝江市' },
                { "id":4620, "name":'夷陵区' },
                { "id":4619, "name":'猇亭区' },
                { "id":4618, "name":'点军区' },
                { "id":4617, "name":'伍家岗区' },
                { "id":4628, "name":'五峰土家族自治县'}
            ] },
            { "id":184, "name":'荆州', "sub":[
                { "id":4608, "name":'沙市区' },
                { "id":4609, "name":'荆州区' },
                { "id":4610, "name":'石首市' },
                { "id":4611, "name":'洪湖市' },
                { "id":4612, "name":'松滋市' },
                { "id":4613, "name":'江陵县' },
                { "id":4614, "name":'公安县' },
                { "id":4615, "name":'监利县'}
            ] },
            { "id":185, "name":'黄冈', "sub":[
                { "id":4583, "name":'黄州区' },
                { "id":4591, "name":'黄梅县' },
                { "id":4590, "name":'蕲春县' },
                { "id":4589, "name":'浠水县' },
                { "id":4588, "name":'英山县' },
                { "id":4587, "name":'罗田县' },
                { "id":4586, "name":'红安县' },
                { "id":4585, "name":'武穴市' },
                { "id":4584, "name":'麻城市' },
                { "id":4592, "name":'团风县'}
            ] },
            { "id":178, "name":'十堰', "sub":[
                { "id":4554, "name":'张湾区' },
                { "id":4555, "name":'茅箭区' },
                { "id":4556, "name":'丹江口市' },
                { "id":4557, "name":'郧县' },
                { "id":4558, "name":'竹山县' },
                { "id":4559, "name":'房县' },
                { "id":4560, "name":'郧西县' },
                { "id":4561, "name":'竹溪县'}
            ] },
            { "id":177, "name":'黄石', "sub":[
                { "id":4596, "name":'黄石港区' },
                { "id":4597, "name":'西塞山区' },
                { "id":4598, "name":'下陆区' },
                { "id":4599, "name":'铁山区' },
                { "id":4600, "name":'大冶市' },
                { "id":4601, "name":'阳新县'}
            ] },
            { "id":180, "name":'襄阳', "sub":[
                { "id":4562, "name":'襄城区' },
                { "id":4563, "name":'樊城区' },
                { "id":4564, "name":'襄州区' },
                { "id":4565, "name":'老河口市' },
                { "id":4566, "name":'枣阳市' },
                { "id":4567, "name":'宜城市' },
                { "id":4568, "name":'南漳县' },
                { "id":4569, "name":'谷城县' },
                { "id":4570, "name":'保康县'}
            ] },
            { "id":182, "name":'荆门', "sub":[
                { "id":4571, "name":'东宝区' },
                { "id":4572, "name":'掇刀区' },
                { "id":4573, "name":'钟祥市' },
                { "id":4574, "name":'沙洋县' },
                { "id":4575, "name":'京山县'}
            ] },
            { "id":186, "name":'咸宁', "sub":[
                { "id":4602, "name":'咸安区' },
                { "id":4603, "name":'赤壁市' },
                { "id":4604, "name":'嘉鱼县' },
                { "id":4605, "name":'通城县' },
                { "id":4606, "name":'崇阳县' },
                { "id":4607, "name":'通山县'}
            ] },
            { "id":190, "name":'潜江' },
            { "id":187, "name":'随州', "sub":[
                { "id":4629, "name":'曾都区' },
                { "id":4630, "name":'广水市'}
            ] },
            { "id":183, "name":'孝感', "sub":[
                { "id":4576, "name":'孝南区' },
                { "id":4577, "name":'应城市' },
                { "id":4578, "name":'安陆市' },
                { "id":4579, "name":'汉川市' },
                { "id":4580, "name":'孝昌县' },
                { "id":4581, "name":'大悟县' },
                { "id":4582, "name":'云梦县'}
            ] },
            { "id":181, "name":'鄂州', "sub":[
                { "id":4593, "name":'鄂城区' },
                { "id":4594, "name":'梁子湖区' },
                { "id":4595, "name":'华容区'}
            ] },
            { "id":191, "name":'天门' },
            { "id":189, "name":'仙桃' },
            { "id":404, "name":'神农架林区'}
        ] },
        { "id":16, "name":'河南', "subcity":[
            { "id":160, "name":'郑州', "sub":[
                { "id":320, "name":'中原区' },
                { "id":321, "name":'金水区' },
                { "id":322, "name":'二七区' },
                { "id":323, "name":'管城区' },
                { "id":324, "name":'惠济区' },
                { "id":325, "name":'上街区' },
                { "id":326, "name":'近郊'}
            ] },
            { "id":166, "name":'新乡', "sub":[
                { "id":4434, "name":'卫滨区' },
                { "id":4444, "name":'封丘县' },
                { "id":4443, "name":'延津县' },
                { "id":4442, "name":'原阳县' },
                { "id":4441, "name":'获嘉县' },
                { "id":4440, "name":'新乡县' },
                { "id":4439, "name":'辉县市' },
                { "id":4438, "name":'卫辉市' },
                { "id":4437, "name":'牧野区' },
                { "id":4436, "name":'凤泉区' },
                { "id":4435, "name":'红旗区' },
                { "id":4445, "name":'长垣县'}
            ] },
            { "id":162, "name":'洛阳', "sub":[
                { "id":4409, "name":'西工区' },
                { "id":4422, "name":'洛宁县' },
                { "id":4421, "name":'宜阳县' },
                { "id":4420, "name":'汝阳县' },
                { "id":4419, "name":'嵩县' },
                { "id":4418, "name":'栾川县' },
                { "id":4417, "name":'新安县' },
                { "id":4416, "name":'孟津县' },
                { "id":4415, "name":'偃师市' },
                { "id":4414, "name":'洛龙区' },
                { "id":4413, "name":'吉利区' },
                { "id":4412, "name":'涧西区' },
                { "id":4411, "name":'瀍河回族区' },
                { "id":4410, "name":'老城区' },
                { "id":4423, "name":'伊川县'}
            ] },
            { "id":161, "name":'开封', "sub":[
                { "id":4466, "name":'鼓楼区' },
                { "id":4474, "name":'开封县' },
                { "id":4473, "name":'尉氏县' },
                { "id":4472, "name":'通许县' },
                { "id":4471, "name":'杞县' },
                { "id":4470, "name":'金明区' },
                { "id":4469, "name":'禹王台区' },
                { "id":4468, "name":'顺河回族区' },
                { "id":4467, "name":'龙亭区' },
                { "id":4475, "name":'兰考县'}
            ] },
            { "id":169, "name":'许昌', "sub":[
                { "id":4485, "name":'魏都区' },
                { "id":4486, "name":'禹州市' },
                { "id":4487, "name":'长葛市' },
                { "id":4488, "name":'许昌县' },
                { "id":4489, "name":'鄢陵县' },
                { "id":4490, "name":'襄城县'}
            ] },
            { "id":164, "name":'安阳', "sub":[
                { "id":4451, "name":'北关区' },
                { "id":4452, "name":'文峰区' },
                { "id":4453, "name":'殷都区' },
                { "id":4454, "name":'龙安区' },
                { "id":4455, "name":'林州市' },
                { "id":4456, "name":'安阳县' },
                { "id":4457, "name":'汤阴县' },
                { "id":4458, "name":'滑县' },
                { "id":4459, "name":'内黄县'}
            ] },
            { "id":168, "name":'濮阳', "sub":[
                { "id":4460, "name":'华龙区' },
                { "id":4461, "name":'清丰县' },
                { "id":4462, "name":'南乐县' },
                { "id":4463, "name":'范县' },
                { "id":4464, "name":'台前县' },
                { "id":4465, "name":'濮阳县'}
            ] },
            { "id":172, "name":'南阳', "sub":[
                { "id":4506, "name":'卧龙区' },
                { "id":4517, "name":'新野县' },
                { "id":4516, "name":'唐河县' },
                { "id":4515, "name":'社旗县' },
                { "id":4514, "name":'淅川县' },
                { "id":4513, "name":'内乡县' },
                { "id":4512, "name":'镇平县' },
                { "id":4511, "name":'西峡县' },
                { "id":4510, "name":'方城县' },
                { "id":4509, "name":'南召县' },
                { "id":4508, "name":'邓州市' },
                { "id":4507, "name":'宛城区' },
                { "id":4518, "name":'桐柏县'}
            ] },
            { "id":167, "name":'焦作', "sub":[
                { "id":4424, "name":'解放区' },
                { "id":4432, "name":'武陟县' },
                { "id":4431, "name":'博爱县' },
                { "id":4430, "name":'修武县' },
                { "id":4429, "name":'沁阳市' },
                { "id":4428, "name":'孟州市' },
                { "id":4427, "name":'马村区' },
                { "id":4426, "name":'中站区' },
                { "id":4425, "name":'山阳区' },
                { "id":4433, "name":'温县'}
            ] },
            { "id":163, "name":'平顶山', "sub":[
                { "id":4496, "name":'新华区' },
                { "id":4504, "name":'鲁山县' },
                { "id":4503, "name":'叶县' },
                { "id":4502, "name":'宝丰县' },
                { "id":4501, "name":'汝州市' },
                { "id":4500, "name":'舞钢市' },
                { "id":4499, "name":'石龙区' },
                { "id":4498, "name":'湛河区' },
                { "id":4497, "name":'卫东区' },
                { "id":4505, "name":'郏县'}
            ] },
            { "id":175, "name":'周口', "sub":[
                { "id":4529, "name":'川汇区' },
                { "id":4537, "name":'淮阳县' },
                { "id":4536, "name":'郸城县' },
                { "id":4535, "name":'鹿邑县' },
                { "id":4534, "name":'太康县' },
                { "id":4533, "name":'商水县' },
                { "id":4532, "name":'西华县' },
                { "id":4531, "name":'扶沟县' },
                { "id":4530, "name":'项城市' },
                { "id":4538, "name":'沈丘县'}
            ] },
            { "id":173, "name":'商丘', "sub":[
                { "id":4476, "name":'梁园区' },
                { "id":4477, "name":'睢阳区' },
                { "id":4478, "name":'永城市' },
                { "id":4479, "name":'虞城县' },
                { "id":4480, "name":'民权县' },
                { "id":4481, "name":'宁陵县' },
                { "id":4482, "name":'睢县' },
                { "id":4483, "name":'夏邑县' },
                { "id":4484, "name":'柘城县'}
            ] },
            { "id":174, "name":'信阳', "sub":[
                { "id":4519, "name":'河区' },
                { "id":4527, "name":'罗山县' },
                { "id":4526, "name":'商城县' },
                { "id":4525, "name":'固始县' },
                { "id":4524, "name":'光山县' },
                { "id":4523, "name":'潢川县' },
                { "id":4522, "name":'淮滨县' },
                { "id":4521, "name":'息县' },
                { "id":4520, "name":'平桥区' },
                { "id":4528, "name":'新县'}
            ] },
            { "id":171, "name":'三门峡', "sub":[
                { "id":4403, "name":'湖滨区' },
                { "id":4404, "name":'义马市' },
                { "id":4405, "name":'灵宝市' },
                { "id":4406, "name":'渑池县' },
                { "id":4407, "name":'陕县' },
                { "id":4408, "name":'卢氏县'}
            ] },
            { "id":170, "name":'漯河', "sub":[
                { "id":4491, "name":'源汇区' },
                { "id":4492, "name":'郾城区' },
                { "id":4493, "name":'召陵区' },
                { "id":4494, "name":'舞阳县' },
                { "id":4495, "name":'临颍县'}
            ] },
            { "id":176, "name":'驻马店', "sub":[
                { "id":4539, "name":'驿城区' },
                { "id":4547, "name":'新蔡县' },
                { "id":4546, "name":'平舆县' },
                { "id":4545, "name":'汝南县' },
                { "id":4544, "name":'上蔡县' },
                { "id":4543, "name":'西平县' },
                { "id":4542, "name":'遂平县' },
                { "id":4541, "name":'泌阳县' },
                { "id":4540, "name":'确山县' },
                { "id":4548, "name":'正阳县'}
            ] },
            { "id":165, "name":'鹤壁', "sub":[
                { "id":4446, "name":'淇滨区' },
                { "id":4447, "name":'山城区' },
                { "id":4448, "name":'鹤山区' },
                { "id":4449, "name":'浚县' },
                { "id":4450, "name":'淇县'}
            ] },
            { "id":397, "name":'济源'}
        ] },
        { "id":3, "name":'河北', "subcity":[
            { "id":24, "name":'石家庄', "sub":[
                { "id":504, "name":'新华区' },
                { "id":505, "name":'桥西区' },
                { "id":506, "name":'桥东区' },
                { "id":507, "name":'长安区' },
                { "id":508, "name":'裕华区' },
                { "id":510, "name":'近郊'}
            ] },
            { "id":29, "name":'保定', "sub":[
                { "id":3309, "name":'新市区' },
                { "id":3322, "name":'顺平县' },
                { "id":3323, "name":'唐县' },
                { "id":3324, "name":'望都县' },
                { "id":3325, "name":'涞水县' },
                { "id":3326, "name":'高阳县' },
                { "id":3327, "name":'安新县' },
                { "id":3328, "name":'雄县' },
                { "id":3329, "name":'曲阳县' },
                { "id":3330, "name":'阜平县' },
                { "id":3331, "name":'博野县' },
                { "id":3321, "name":'定兴县' },
                { "id":3320, "name":'涞源县' },
                { "id":3310, "name":'北市区' },
                { "id":3311, "name":'南市区' },
                { "id":3312, "name":'定州市' },
                { "id":3313, "name":'涿州市' },
                { "id":3314, "name":'安国市' },
                { "id":3315, "name":'高碑店市' },
                { "id":3316, "name":'满城县' },
                { "id":3317, "name":'清苑县' },
                { "id":3318, "name":'易县' },
                { "id":3319, "name":'徐水县' },
                { "id":3332, "name":'蠡县'}
            ] },
            { "id":26, "name":'秦皇岛', "sub":[
                { "id":3277, "name":'海港区' },
                { "id":3279, "name":'山海关区' },
                { "id":3280, "name":'北戴河区' },
                { "id":3281, "name":'昌黎县' },
                { "id":3282, "name":'抚宁县' },
                { "id":3283, "name":'卢龙县' },
                { "id":3284, "name":'青龙满族自治县'}
            ] },
            { "id":27, "name":'邯郸', "sub":[
                { "id":3379, "name":'丛台区' },
                { "id":3396, "name":'魏县' },
                { "id":3395, "name":'馆陶县' },
                { "id":3394, "name":'广平县' },
                { "id":3393, "name":'鸡泽县' },
                { "id":3392, "name":'邱县' },
                { "id":3391, "name":'永年县' },
                { "id":3390, "name":'肥乡县' },
                { "id":3389, "name":'磁县' },
                { "id":3388, "name":'涉县' },
                { "id":3387, "name":'大名县' },
                { "id":3386, "name":'成安县' },
                { "id":3385, "name":'临漳县' },
                { "id":3384, "name":'邯郸县' },
                { "id":3383, "name":'武安市' },
                { "id":3382, "name":'峰峰矿区' },
                { "id":3381, "name":'复兴区' },
                { "id":3380, "name":'邯山区' },
                { "id":3397, "name":'曲周县'}
            ] },
            { "id":33, "name":'廊坊', "sub":[
                { "id":3299, "name":'安次区' },
                { "id":3307, "name":'文安县' },
                { "id":3306, "name":'大城县' },
                { "id":3305, "name":'香河县' },
                { "id":3304, "name":'永清县' },
                { "id":3303, "name":'固安县' },
                { "id":3302, "name":'三河市' },
                { "id":3301, "name":'霸州市' },
                { "id":3300, "name":'广阳区' },
                { "id":3308, "name":'大厂回族自治县'}
            ] },
            { "id":25, "name":'唐山', "sub":[
                { "id":3285, "name":'路北区' },
                { "id":3297, "name":'玉田县' },
                { "id":3296, "name":'迁西县' },
                { "id":3295, "name":'乐亭县' },
                { "id":3294, "name":'滦南县' },
                { "id":3293, "name":'滦县' },
                { "id":3292, "name":'迁安市' },
                { "id":3291, "name":'遵化市' },
                { "id":3290, "name":'丰南区' },
                { "id":3289, "name":'丰润区' },
                { "id":3288, "name":'开平区' },
                { "id":3287, "name":'古冶区' },
                { "id":3286, "name":'路南区' },
                { "id":3298, "name":'唐海县'}
            ] },
            { "id":28, "name":'邢台', "sub":[
                { "id":3360, "name":'桥东区' },
                { "id":3377, "name":'清河县' },
                { "id":3376, "name":'威县' },
                { "id":3375, "name":'平乡县' },
                { "id":3374, "name":'广宗县' },
                { "id":3373, "name":'新河县' },
                { "id":3372, "name":'巨鹿县' },
                { "id":3371, "name":'宁晋县' },
                { "id":3370, "name":'南和县' },
                { "id":3369, "name":'任县' },
                { "id":3368, "name":'隆尧县' },
                { "id":3367, "name":'柏乡县' },
                { "id":3366, "name":'内丘县' },
                { "id":3365, "name":'临城县' },
                { "id":3364, "name":'邢台县' },
                { "id":3363, "name":'沙河市' },
                { "id":3362, "name":'南宫市' },
                { "id":3361, "name":'桥西区' },
                { "id":3378, "name":'临西县'}
            ] },
            { "id":31, "name":'承德', "sub":[
                { "id":3266, "name":'双桥区' },
                { "id":3275, "name":'宽城满族自治县' },
                { "id":3274, "name":'丰宁满族自治县' },
                { "id":3273, "name":'隆化县' },
                { "id":3272, "name":'滦平县' },
                { "id":3271, "name":'平泉县' },
                { "id":3270, "name":'兴隆县' },
                { "id":3269, "name":'承德县' },
                { "id":3268, "name":'鹰手营子矿区' },
                { "id":3267, "name":'双滦区' },
                { "id":3276, "name":'围场满族蒙古族自治县'}
            ] },
            { "id":32, "name":'沧州', "sub":[
                { "id":3344, "name":'运河区' },
                { "id":3358, "name":'献县' },
                { "id":3357, "name":'吴桥县' },
                { "id":3356, "name":'南皮县' },
                { "id":3355, "name":'肃宁县' },
                { "id":3354, "name":'盐山县' },
                { "id":3353, "name":'海兴县' },
                { "id":3352, "name":'东光县' },
                { "id":3351, "name":'青县' },
                { "id":3350, "name":'沧县' },
                { "id":3349, "name":'河间市' },
                { "id":3348, "name":'黄骅市' },
                { "id":3347, "name":'任丘市' },
                { "id":3346, "name":'泊头市' },
                { "id":3345, "name":'新华区' },
                { "id":3359, "name":'孟村回族自治县'}
            ] },
            { "id":30, "name":'张家口', "sub":[
                { "id":3249, "name":'桥西区' },
                { "id":3264, "name":'赤城县' },
                { "id":3263, "name":'涿鹿县' },
                { "id":3262, "name":'怀来县' },
                { "id":3261, "name":'万全县' },
                { "id":3260, "name":'怀安县' },
                { "id":3259, "name":'阳原县' },
                { "id":3258, "name":'蔚县' },
                { "id":3257, "name":'尚义县' },
                { "id":3256, "name":'沽源县' },
                { "id":3255, "name":'康保县' },
                { "id":3254, "name":'张北县' },
                { "id":3253, "name":'宣化县' },
                { "id":3252, "name":'下花园区' },
                { "id":3251, "name":'宣化区' },
                { "id":3250, "name":'桥东区' },
                { "id":3265, "name":'崇礼县'}
            ] },
            { "id":34, "name":'衡水', "sub":[
                { "id":3333, "name":'桃城区' },
                { "id":3342, "name":'景县' },
                { "id":3341, "name":'故城县' },
                { "id":3340, "name":'安平县' },
                { "id":3339, "name":'饶阳县' },
                { "id":3338, "name":'武强县' },
                { "id":3337, "name":'武邑县' },
                { "id":3336, "name":'枣强县' },
                { "id":3335, "name":'深州市' },
                { "id":3334, "name":'冀州市' },
                { "id":3343, "name":'阜城县'}
            ]}
        ] },
        { "id":4, "name":'山西', "subcity":[
            { "id":35, "name":'太原', "sub":[
                { "id":420, "name":'迎泽区' },
                { "id":421, "name":'杏花岭区' },
                { "id":422, "name":'万柏林区' },
                { "id":423, "name":'小店区' },
                { "id":424, "name":'尖草坪区' },
                { "id":425, "name":'晋源区' },
                { "id":426, "name":'近郊'}
            ] },
            { "id":36, "name":'大同', "sub":[
                { "id":3408, "name":'城区' },
                { "id":3417, "name":'左云县' },
                { "id":3416, "name":'浑源县' },
                { "id":3415, "name":'灵丘县' },
                { "id":3414, "name":'广灵县' },
                { "id":3413, "name":'天镇县' },
                { "id":3412, "name":'阳高县' },
                { "id":3411, "name":'新荣区' },
                { "id":3410, "name":'南郊区' },
                { "id":3409, "name":'矿区' },
                { "id":3418, "name":'大同县'}
            ] },
            { "id":41, "name":'晋中', "sub":[
                { "id":3457, "name":'榆次区' },
                { "id":3466, "name":'平遥县' },
                { "id":3465, "name":'祁县' },
                { "id":3464, "name":'太谷县' },
                { "id":3463, "name":'寿阳县' },
                { "id":3462, "name":'昔阳县' },
                { "id":3461, "name":'和顺县' },
                { "id":3460, "name":'左权县' },
                { "id":3459, "name":'榆社县' },
                { "id":3458, "name":'介休市' },
                { "id":3467, "name":'灵石县'}
            ] },
            { "id":44, "name":'临汾', "sub":[
                { "id":3468, "name":'尧都区' },
                { "id":3483, "name":'隰县' },
                { "id":3482, "name":'永和县' },
                { "id":3481, "name":'大宁县' },
                { "id":3480, "name":'蒲县' },
                { "id":3479, "name":'乡宁县' },
                { "id":3478, "name":'吉县' },
                { "id":3477, "name":'浮山县' },
                { "id":3476, "name":'安泽县' },
                { "id":3475, "name":'古县' },
                { "id":3474, "name":'洪洞县' },
                { "id":3473, "name":'襄汾县' },
                { "id":3472, "name":'翼城县' },
                { "id":3471, "name":'曲沃县' },
                { "id":3470, "name":'霍州市' },
                { "id":3469, "name":'侯马市' },
                { "id":3484, "name":'汾西县'}
            ] },
            { "id":38, "name":'长治', "sub":[
                { "id":3424, "name":'城区' },
                { "id":3435, "name":'沁县' },
                { "id":3434, "name":'武乡县' },
                { "id":3433, "name":'长子县' },
                { "id":3432, "name":'壶关县' },
                { "id":3431, "name":'黎城县' },
                { "id":3430, "name":'平顺县' },
                { "id":3429, "name":'屯留县' },
                { "id":3428, "name":'襄垣县' },
                { "id":3427, "name":'长治县' },
                { "id":3426, "name":'潞城市' },
                { "id":3425, "name":'郊区' },
                { "id":3436, "name":'沁源县'}
            ] },
            { "id":43, "name":'忻州', "sub":[
                { "id":3443, "name":'忻府区' },
                { "id":3455, "name":'保德县' },
                { "id":3454, "name":'河曲县' },
                { "id":3453, "name":'岢岚县' },
                { "id":3452, "name":'五寨县' },
                { "id":3451, "name":'神池县' },
                { "id":3450, "name":'静乐县' },
                { "id":3449, "name":'宁武县' },
                { "id":3448, "name":'繁峙县' },
                { "id":3447, "name":'代县' },
                { "id":3446, "name":'五台县' },
                { "id":3445, "name":'定襄县' },
                { "id":3444, "name":'原平市' },
                { "id":3456, "name":'偏关县'}
            ] },
            { "id":42, "name":'运城' },
            { "id":39, "name":'晋城', "sub":[
                { "id":3437, "name":'城区' },
                { "id":3438, "name":'高平市' },
                { "id":3439, "name":'泽州县' },
                { "id":3440, "name":'沁水县' },
                { "id":3441, "name":'阳城县' },
                { "id":3442, "name":'陵川县'}
            ] },
            { "id":40, "name":'朔州', "sub":[
                { "id":3402, "name":'朔城区' },
                { "id":3403, "name":'平鲁区' },
                { "id":3404, "name":'山阴县' },
                { "id":3405, "name":'应县' },
                { "id":3406, "name":'右玉县' },
                { "id":3407, "name":'怀仁县'}
            ] },
            { "id":37, "name":'阳泉', "sub":[
                { "id":3419, "name":'城区' },
                { "id":3420, "name":'矿区' },
                { "id":3421, "name":'郊区' },
                { "id":3422, "name":'平定县' },
                { "id":3423, "name":'盂县'}
            ] },
            { "id":45, "name":'吕梁', "sub":[
                { "id":3485, "name":'离石区' },
                { "id":3496, "name":'交城县' },
                { "id":3495, "name":'交口县' },
                { "id":3494, "name":'岚县' },
                { "id":3493, "name":'柳林县' },
                { "id":3492, "name":'方山县' },
                { "id":3491, "name":'临县' },
                { "id":3490, "name":'兴县' },
                { "id":3489, "name":'中阳县' },
                { "id":3488, "name":'文水县' },
                { "id":3487, "name":'汾阳市' },
                { "id":3486, "name":'孝义市' },
                { "id":3497, "name":'石楼县'}
            ]}
        ] },
        { "id":5, "name":'内蒙古', "subcity":[
            { "id":46, "name":'呼和浩特', "sub":[
                { "id":519, "name":'新城区' },
                { "id":520, "name":'玉泉区' },
                { "id":521, "name":'赛罕区' },
                { "id":525, "name":'近郊' },
                { "id":533, "name":'回民区'}
            ] },
            { "id":47, "name":'包头', "sub":[
                { "id":3503, "name":'昆都仑区' },
                { "id":3504, "name":'东河区' },
                { "id":3505, "name":'青山区' },
                { "id":3506, "name":'石拐区' },
                { "id":3507, "name":'白云矿区' },
                { "id":3508, "name":'九原区' },
                { "id":3509, "name":'固阳县' },
                { "id":3510, "name":'土默特右旗' },
                { "id":3511, "name":'达尔罕茂明安联合旗'}
            ] },
            { "id":52, "name":'呼伦贝尔', "sub":[
                { "id":3535, "name":'海拉尔区' },
                { "id":3546, "name":'鄂温克族自治旗' },
                { "id":3545, "name":'鄂伦春自治旗' },
                { "id":3544, "name":'陈巴尔虎旗' },
                { "id":3543, "name":'新巴尔虎左旗' },
                { "id":3542, "name":'新巴尔虎右旗' },
                { "id":3541, "name":'阿荣旗' },
                { "id":3540, "name":'额尔古纳市' },
                { "id":3539, "name":'根河市' },
                { "id":3538, "name":'牙克石市' },
                { "id":3537, "name":'扎兰屯市' },
                { "id":3536, "name":'满洲里市' },
                { "id":3547, "name":'莫力达瓦达斡尔族自治旗'}
            ] },
            { "id":49, "name":'赤峰', "sub":[
                { "id":3515, "name":'红山区' },
                { "id":3525, "name":'喀喇沁旗' },
                { "id":3524, "name":'翁牛特旗' },
                { "id":3523, "name":'克什克腾旗' },
                { "id":3522, "name":'巴林右旗' },
                { "id":3521, "name":'巴林左旗' },
                { "id":3520, "name":'阿鲁科尔沁旗' },
                { "id":3519, "name":'林西县' },
                { "id":3518, "name":'宁城县' },
                { "id":3517, "name":'松山区' },
                { "id":3516, "name":'元宝山区' },
                { "id":3526, "name":'敖汉旗'}
            ] },
            { "id":51, "name":'鄂尔多斯', "sub":[
                { "id":3548, "name":'东胜区' },
                { "id":3549, "name":'达拉特旗' },
                { "id":3550, "name":'准格尔旗' },
                { "id":3551, "name":'鄂托克前旗' },
                { "id":3552, "name":'鄂托克旗' },
                { "id":3553, "name":'杭锦旗' },
                { "id":3554, "name":'乌审旗' },
                { "id":3555, "name":'伊金霍洛旗'}
            ] },
            { "id":50, "name":'通辽', "sub":[
                { "id":3527, "name":'科尔沁区' },
                { "id":3528, "name":'霍林郭勒市' },
                { "id":3529, "name":'开鲁县' },
                { "id":3530, "name":'库伦旗' },
                { "id":3531, "name":'奈曼旗' },
                { "id":3532, "name":'扎鲁特旗' },
                { "id":3533, "name":'科尔沁左翼中旗' },
                { "id":3534, "name":'科尔沁左翼后旗'}
            ] },
            { "id":48, "name":'乌海', "sub":[
                { "id":3512, "name":'海勃湾区' },
                { "id":3513, "name":'海南区' },
                { "id":3514, "name":'乌达区'}
            ] },
            { "id":53, "name":'兴安盟', "sub":[
                { "id":3574, "name":'乌兰浩特市' },
                { "id":3575, "name":'阿尔山市' },
                { "id":3576, "name":'突泉县' },
                { "id":3577, "name":'科尔沁右翼前旗' },
                { "id":3578, "name":'科尔沁右翼中旗' },
                { "id":3579, "name":'扎赉特旗'}
            ] },
            { "id":56, "name":'巴彦淖尔', "sub":[
                { "id":3567, "name":'临河区' },
                { "id":3568, "name":'五原县' },
                { "id":3569, "name":'磴口县' },
                { "id":3570, "name":'乌拉特前旗' },
                { "id":3571, "name":'乌拉特中旗' },
                { "id":3572, "name":'乌拉特后旗' },
                { "id":3573, "name":'杭锦后旗'}
            ] },
            { "id":54, "name":'锡林郭勒', "sub":[
                { "id":3580, "name":'锡林浩特市' },
                { "id":3590, "name":'正镶白旗' },
                { "id":3589, "name":'镶黄旗' },
                { "id":3588, "name":'太仆寺旗' },
                { "id":3587, "name":'西乌珠穆沁旗' },
                { "id":3586, "name":'东乌珠穆沁旗' },
                { "id":3585, "name":'苏尼特右旗' },
                { "id":3584, "name":'苏尼特左旗' },
                { "id":3583, "name":'阿巴嘎旗' },
                { "id":3582, "name":'多伦县' },
                { "id":3581, "name":'二连浩特市' },
                { "id":3591, "name":'正蓝旗'}
            ] },
            { "id":57, "name":'阿拉善', "sub":[
                { "id":3592, "name":'阿拉善左旗' },
                { "id":3593, "name":'阿拉善右旗' },
                { "id":3594, "name":'额济纳旗'}
            ] },
            { "id":55, "name":'乌兰察布', "sub":[
                { "id":3556, "name":'集宁区' },
                { "id":3565, "name":'察哈尔右翼后旗' },
                { "id":3564, "name":'察哈尔右翼中旗' },
                { "id":3563, "name":'察哈尔右翼前旗' },
                { "id":3562, "name":'凉城县' },
                { "id":3561, "name":'兴和县' },
                { "id":3560, "name":'商都县' },
                { "id":3559, "name":'化德县' },
                { "id":3558, "name":'卓资县' },
                { "id":3557, "name":'丰镇市' },
                { "id":3566, "name":'四子王旗'}
            ]}
        ] },
        { "id":6, "name":'辽宁', "subcity":[
            { "id":18, "name":'沈阳', "sub":[
                { "id":130, "name":'和平区' },
                { "id":131, "name":'沈河区' },
                { "id":133, "name":'大东区' },
                { "id":134, "name":'皇姑区' },
                { "id":132, "name":'铁西区' },
                { "id":135, "name":'于洪区' },
                { "id":136, "name":'近郊'}
            ] },
            { "id":19, "name":'大连', "sub":[
                { "id":137, "name":'西岗区' },
                { "id":138, "name":'中山区' },
                { "id":139, "name":'沙河口区' },
                { "id":140, "name":'甘井子区' },
                { "id":143, "name":'近郊'}
            ] },
            { "id":58, "name":'鞍山', "sub":[
                { "id":3643, "name":'铁东区' },
                { "id":3644, "name":'铁西区' },
                { "id":3645, "name":'立山区' },
                { "id":3646, "name":'千山区' },
                { "id":3647, "name":'海城市' },
                { "id":3648, "name":'台安县' },
                { "id":3649, "name":'岫岩满族自治县'}
            ] },
            { "id":62, "name":'锦州', "sub":[
                { "id":3666, "name":'太和区' },
                { "id":3667, "name":'古塔区' },
                { "id":3668, "name":'凌河区' },
                { "id":3669, "name":'凌海市' },
                { "id":3670, "name":'北宁市' },
                { "id":3671, "name":'黑山县' },
                { "id":3672, "name":'义县'}
            ] },
            { "id":59, "name":'抚顺', "sub":[
                { "id":3623, "name":'顺城区' },
                { "id":3624, "name":'新抚区' },
                { "id":3625, "name":'东洲区' },
                { "id":3626, "name":'望花区' },
                { "id":3627, "name":'抚顺县' },
                { "id":3628, "name":'新宾满族自治县' },
                { "id":3629, "name":'清原满族自治县'}
            ] },
            { "id":63, "name":'营口', "sub":[
                { "id":3656, "name":'站前区' },
                { "id":3657, "name":'西市区' },
                { "id":3658, "name":'鲅鱼圈区' },
                { "id":3659, "name":'老边区' },
                { "id":3660, "name":'大石桥市' },
                { "id":3661, "name":'盖州市'}
            ] },
            { "id":61, "name":'丹东', "sub":[
                { "id":3650, "name":'振兴区' },
                { "id":3651, "name":'元宝区' },
                { "id":3652, "name":'振安区' },
                { "id":3653, "name":'凤城市' },
                { "id":3654, "name":'东港市' },
                { "id":3655, "name":'宽甸满族自治县'}
            ] },
            { "id":69, "name":'葫芦岛', "sub":[
                { "id":3673, "name":'龙港区' },
                { "id":3674, "name":'连山区' },
                { "id":3675, "name":'南票区' },
                { "id":3676, "name":'兴城市' },
                { "id":3677, "name":'绥中县' },
                { "id":3678, "name":'建昌县'}
            ] },
            { "id":65, "name":'辽阳', "sub":[
                { "id":3636, "name":'白塔区' },
                { "id":3637, "name":'文圣区' },
                { "id":3638, "name":'宏伟区' },
                { "id":3639, "name":'弓长岭区' },
                { "id":3640, "name":'太子河区' },
                { "id":3641, "name":'灯塔市' },
                { "id":3642, "name":'辽阳县'}
            ] },
            { "id":66, "name":'盘锦', "sub":[
                { "id":3662, "name":'兴隆台区' },
                { "id":3663, "name":'双台子区' },
                { "id":3664, "name":'大洼县' },
                { "id":3665, "name":'盘山县'}
            ] },
            { "id":60, "name":'本溪', "sub":[
                { "id":3630, "name":'平山区' },
                { "id":3631, "name":'溪湖区' },
                { "id":3632, "name":'明山区' },
                { "id":3633, "name":'南芬区' },
                { "id":3634, "name":'本溪满族自治县' },
                { "id":3635, "name":'桓仁满族自治县'}
            ] },
            { "id":64, "name":'阜新', "sub":[
                { "id":3609, "name":'海州区' },
                { "id":3610, "name":'新邱区' },
                { "id":3611, "name":'太平区' },
                { "id":3612, "name":'清河门区' },
                { "id":3613, "name":'细河区' },
                { "id":3614, "name":'彰武县' },
                { "id":3615, "name":'阜新蒙古族自治县'}
            ] },
            { "id":67, "name":'铁岭', "sub":[
                { "id":3616, "name":'银州区' },
                { "id":3617, "name":'清河区' },
                { "id":3618, "name":'调兵山市' },
                { "id":3619, "name":'开原市' },
                { "id":3620, "name":'铁岭县' },
                { "id":3621, "name":'西丰县' },
                { "id":3622, "name":'昌图县'}
            ] },
            { "id":68, "name":'朝阳', "sub":[
                { "id":3602, "name":'双塔区' },
                { "id":3603, "name":'龙城区' },
                { "id":3604, "name":'北票市' },
                { "id":3605, "name":'凌源市' },
                { "id":3606, "name":'朝阳县' },
                { "id":3607, "name":'建平县' },
                { "id":3608, "name":'喀喇沁左翼蒙古族自治县'}
            ]}
        ] },
        { "id":7, "name":'吉林', "subcity":[
            { "id":70, "name":'长春', "sub":[
                { "id":306, "name":'朝阳区' },
                { "id":307, "name":'南关区' },
                { "id":308, "name":'宽城区' },
                { "id":310, "name":'绿园区' },
                { "id":309, "name":'二道区' },
                { "id":612, "name":'高新区' },
                { "id":613, "name":'经济开发区' },
                { "id":614, "name":'净月开发区' },
                { "id":615, "name":'汽车开发区' },
                { "id":311, "name":'双阳区' },
                { "id":313, "name":'近郊'}
            ] },
            { "id":71, "name":'吉林', "sub":[
                { "id":3693, "name":'船营区' },
                { "id":3694, "name":'龙潭区' },
                { "id":3695, "name":'昌邑区' },
                { "id":3696, "name":'丰满区' },
                { "id":3697, "name":'磐石市' },
                { "id":3698, "name":'蛟河市' },
                { "id":3699, "name":'桦甸市' },
                { "id":3700, "name":'舒兰市' },
                { "id":3701, "name":'永吉县'}
            ] },
            { "id":78, "name":'延边', "sub":[
                { "id":3725, "name":'延吉市' },
                { "id":3726, "name":'图们市' },
                { "id":3727, "name":'敦化市' },
                { "id":3728, "name":'珲春市' },
                { "id":3729, "name":'龙井市' },
                { "id":3730, "name":'和龙市' },
                { "id":3731, "name":'汪清县' },
                { "id":3732, "name":'安图县'}
            ] },
            { "id":76, "name":'松原', "sub":[
                { "id":3688, "name":'宁江区' },
                { "id":3689, "name":'扶余县' },
                { "id":3690, "name":'长岭县' },
                { "id":3691, "name":'乾安县' },
                { "id":3692, "name":'前郭尔罗斯蒙古族自治县'}
            ] },
            { "id":72, "name":'四平', "sub":[
                { "id":3702, "name":'铁西区' },
                { "id":3703, "name":'铁东区' },
                { "id":3704, "name":'双辽市' },
                { "id":3705, "name":'公主岭市' },
                { "id":3706, "name":'梨树县' },
                { "id":3707, "name":'伊通满族自治县'}
            ] },
            { "id":74, "name":'通化', "sub":[
                { "id":3712, "name":'东昌区' },
                { "id":3713, "name":'二道江区' },
                { "id":3714, "name":'梅河口市' },
                { "id":3715, "name":'集安市' },
                { "id":3716, "name":'通化县' },
                { "id":3717, "name":'辉南县' },
                { "id":3718, "name":'柳河县'}
            ] },
            { "id":75, "name":'白山', "sub":[
                { "id":3719, "name":'八道江区' },
                { "id":3720, "name":'临江市' },
                { "id":3721, "name":'江源县' },
                { "id":3722, "name":'抚松县' },
                { "id":3723, "name":'靖宇县' },
                { "id":3724, "name":'长白朝鲜族自治县'}
            ] },
            { "id":73, "name":'辽源', "sub":[
                { "id":3708, "name":'龙山区' },
                { "id":3709, "name":'西安区' },
                { "id":3710, "name":'东丰县' },
                { "id":3711, "name":'东辽县'}
            ] },
            { "id":77, "name":'白城', "sub":[
                { "id":3683, "name":'洮北区' },
                { "id":3684, "name":'大安市' },
                { "id":3685, "name":'洮南市' },
                { "id":3686, "name":'镇赉县' },
                { "id":3687, "name":'通榆县'}
            ]}
        ] },
        { "id":8, "name":'黑龙江', "subcity":[
            { "id":79, "name":'哈尔滨', "sub":[
                { "id":345, "name":'道里区' },
                { "id":346, "name":'道外区' },
                { "id":347, "name":'南岗区' },
                { "id":348, "name":'香坊区' },
                { "id":350, "name":'平房区' },
                { "id":351, "name":'松北区' },
                { "id":352, "name":'呼兰区' },
                { "id":353, "name":'近郊'}
            ] },
            { "id":84, "name":'大庆', "sub":[
                { "id":3771, "name":'萨尔图区' },
                { "id":3772, "name":'龙凤区' },
                { "id":3773, "name":'让胡路区' },
                { "id":3774, "name":'大同区' },
                { "id":3775, "name":'红岗区' },
                { "id":3776, "name":'肇州县' },
                { "id":3777, "name":'肇源县' },
                { "id":3778, "name":'林甸县' },
                { "id":3779, "name":'杜尔伯特蒙古族自治县'}
            ] },
            { "id":89, "name":'黑河', "sub":[
                { "id":3765, "name":'爱辉区' },
                { "id":3766, "name":'北安市' },
                { "id":3767, "name":'五大连池市' },
                { "id":3768, "name":'嫩江县' },
                { "id":3769, "name":'逊克县' },
                { "id":3770, "name":'孙吴县'}
            ] },
            { "id":88, "name":'牡丹江', "sub":[
                { "id":3833, "name":'爱民区' },
                { "id":3841, "name":'东宁县' },
                { "id":3840, "name":'宁安市' },
                { "id":3839, "name":'海林市' },
                { "id":3838, "name":'绥芬河市' },
                { "id":3837, "name":'穆棱市' },
                { "id":3836, "name":'西安区' },
                { "id":3835, "name":'阳明区' },
                { "id":3834, "name":'东安区' },
                { "id":3842, "name":'林口县'}
            ] },
            { "id":80, "name":'齐齐哈尔', "sub":[
                { "id":3749, "name":'建华区' },
                { "id":3763, "name":'克东县' },
                { "id":3762, "name":'克山县' },
                { "id":3761, "name":'富裕县' },
                { "id":3760, "name":'甘南县' },
                { "id":3759, "name":'泰来县' },
                { "id":3758, "name":'依安县' },
                { "id":3757, "name":'龙江县' },
                { "id":3756, "name":'讷河市' },
                { "id":3755, "name":'梅里斯达斡尔族区' },
                { "id":3754, "name":'碾子山区' },
                { "id":3753, "name":'富拉尔基区' },
                { "id":3752, "name":'昂昂溪区' },
                { "id":3751, "name":'铁锋区' },
                { "id":3750, "name":'龙沙区' },
                { "id":3764, "name":'拜泉县'}
            ] },
            { "id":86, "name":'佳木斯', "sub":[
                { "id":3805, "name":'前进区' },
                { "id":3814, "name":'汤原县' },
                { "id":3813, "name":'桦川县' },
                { "id":3812, "name":'桦南县' },
                { "id":3811, "name":'富锦市' },
                { "id":3810, "name":'同江市' },
                { "id":3809, "name":'郊区' },
                { "id":3808, "name":'东风区' },
                { "id":3807, "name":'向阳区' },
                { "id":3806, "name":'永红区' },
                { "id":3815, "name":'抚远县'}
            ] },
            { "id":81, "name":'鸡西', "sub":[
                { "id":3824, "name":'鸡冠区' },
                { "id":3825, "name":'恒山区' },
                { "id":3826, "name":'滴道区' },
                { "id":3827, "name":'梨树区' },
                { "id":3828, "name":'城子河区' },
                { "id":3829, "name":'麻山区' },
                { "id":3830, "name":'虎林市' },
                { "id":3831, "name":'密山市' },
                { "id":3832, "name":'鸡东县'}
            ] },
            { "id":91, "name":'大兴安岭', "sub":[
                { "id":3853, "name":'呼玛县' },
                { "id":3854, "name":'塔河县' },
                { "id":3855, "name":'漠河县'}
            ] },
            { "id":87, "name":'七台河', "sub":[
                { "id":3745, "name":'桃山区' },
                { "id":3746, "name":'新兴区' },
                { "id":3747, "name":'茄子河区' },
                { "id":3748, "name":'勃利县'}
            ] },
            { "id":82, "name":'鹤岗', "sub":[
                { "id":3780, "name":'兴山区' },
                { "id":3781, "name":'向阳区' },
                { "id":3782, "name":'工农区' },
                { "id":3783, "name":'南山区' },
                { "id":3784, "name":'兴安区' },
                { "id":3785, "name":'东山区' },
                { "id":3786, "name":'萝北县' },
                { "id":3787, "name":'绥滨县'}
            ] },
            { "id":85, "name":'伊春', "sub":[
                { "id":3788, "name":'伊春区' },
                { "id":3803, "name":'铁力市' },
                { "id":3802, "name":'上甘岭区' },
                { "id":3801, "name":'红星区' },
                { "id":3800, "name":'乌伊岭区' },
                { "id":3799, "name":'带岭区' },
                { "id":3798, "name":'汤旺河区' },
                { "id":3797, "name":'乌马河区' },
                { "id":3796, "name":'五营区' },
                { "id":3795, "name":'金山屯区' },
                { "id":3794, "name":'美溪区' },
                { "id":3793, "name":'新青区' },
                { "id":3792, "name":'翠峦区' },
                { "id":3791, "name":'西林区' },
                { "id":3790, "name":'友好区' },
                { "id":3789, "name":'南岔区' },
                { "id":3804, "name":'嘉荫县'}
            ] },
            { "id":83, "name":'双鸭山', "sub":[
                { "id":3816, "name":'尖山区' },
                { "id":3817, "name":'岭东区' },
                { "id":3818, "name":'四方台区' },
                { "id":3819, "name":'宝山区' },
                { "id":3820, "name":'集贤县' },
                { "id":3821, "name":'友谊县' },
                { "id":3822, "name":'宝清县' },
                { "id":3823, "name":'饶河县'}
            ] },
            { "id":90, "name":'绥化', "sub":[
                { "id":3843, "name":'北林区' },
                { "id":3851, "name":'明水县' },
                { "id":3850, "name":'庆安县' },
                { "id":3849, "name":'青冈县' },
                { "id":3848, "name":'兰西县' },
                { "id":3847, "name":'望奎县' },
                { "id":3846, "name":'海伦市' },
                { "id":3845, "name":'肇东市' },
                { "id":3844, "name":'安达市' },
                { "id":3852, "name":'绥棱县'}
            ]}
        ] },
        { "id":10, "name":'江苏', "subcity":[
            { "id":5, "name":'南京', "sub":[
                { "id":65, "name":'鼓楼区' },
                { "id":68, "name":'白下区' },
                { "id":69, "name":'秦淮区' },
                { "id":66, "name":'玄武区' },
                { "id":67, "name":'建邺区' },
                { "id":71, "name":'下关区' },
                { "id":70, "name":'近郊' },
                { "id":619, "name":'江宁区'}
            ] },
            { "id":6, "name":'苏州', "sub":[
                { "id":72, "name":'平江区' },
                { "id":73, "name":'金阊区' },
                { "id":79, "name":'沧浪区' },
                { "id":74, "name":'吴中区' },
                { "id":75, "name":'工业园区' },
                { "id":76, "name":'高新区' },
                { "id":77, "name":'相城区' },
                { "id":78, "name":'近郊'}
            ] },
            { "id":12, "name":'扬州', "sub":[
                { "id":85, "name":'维扬区' },
                { "id":86, "name":'广陵区' },
                { "id":87, "name":'邗江区' },
                { "id":88, "name":'开发区' },
                { "id":89, "name":'近郊'}
            ] },
            { "id":13, "name":'无锡', "sub":[
                { "id":93, "name":'崇安区' },
                { "id":92, "name":'滨湖区' },
                { "id":95, "name":'北塘区' },
                { "id":94, "name":'南长区' },
                { "id":96, "name":'新区' },
                { "id":90, "name":'锡山区' },
                { "id":91, "name":'惠山区' },
                { "id":97, "name":'近郊'}
            ] },
            { "id":93, "name":'常州', "sub":[
                { "id":3919, "name":'钟楼区' },
                { "id":3920, "name":'天宁区' },
                { "id":3921, "name":'戚墅堰区' },
                { "id":3922, "name":'新北区' },
                { "id":3923, "name":'武进区' },
                { "id":3924, "name":'金坛市' },
                { "id":3925, "name":'溧阳市'}
            ] },
            { "id":92, "name":'徐州', "sub":[
                { "id":3858, "name":'云龙区' },
                { "id":3867, "name":'沛县' },
                { "id":3866, "name":'睢宁县' },
                { "id":3865, "name":'铜山县' },
                { "id":3864, "name":'新沂市' },
                { "id":3863, "name":'邳州市' },
                { "id":3862, "name":'泉山区' },
                { "id":3861, "name":'贾汪区' },
                { "id":3860, "name":'九里区' },
                { "id":3859, "name":'鼓楼区' },
                { "id":3868, "name":'丰县'}
            ] },
            { "id":94, "name":'南通', "sub":[
                { "id":3905, "name":'崇川区' },
                { "id":3906, "name":'港闸区' },
                { "id":3907, "name":'海门市' },
                { "id":3908, "name":'启东市' },
                { "id":3909, "name":'通州市' },
                { "id":3910, "name":'如皋市' },
                { "id":3911, "name":'如东县' },
                { "id":3912, "name":'海安县'}
            ] },
            { "id":98, "name":'镇江', "sub":[
                { "id":3913, "name":'京口区' },
                { "id":3914, "name":'润州区' },
                { "id":3915, "name":'丹徒区' },
                { "id":3916, "name":'扬中市' },
                { "id":3917, "name":'丹阳市' },
                { "id":3918, "name":'句容市'}
            ] },
            { "id":96, "name":'淮安', "sub":[
                { "id":3881, "name":'清河区' },
                { "id":3882, "name":'清浦区' },
                { "id":3883, "name":'楚州区' },
                { "id":3884, "name":'淮阴区' },
                { "id":3885, "name":'金湖县' },
                { "id":3886, "name":'盱眙县' },
                { "id":3887, "name":'洪泽县' },
                { "id":3888, "name":'涟水县'}
            ] },
            { "id":95, "name":'连云港', "sub":[
                { "id":3869, "name":'新浦区' },
                { "id":3870, "name":'连云区' },
                { "id":3871, "name":'海州区' },
                { "id":3872, "name":'赣榆县' },
                { "id":3873, "name":'灌云县' },
                { "id":3874, "name":'东海县' },
                { "id":3875, "name":'灌南县'}
            ] },
            { "id":99, "name":'泰州', "sub":[
                { "id":3899, "name":'海陵区' },
                { "id":3900, "name":'高港区' },
                { "id":3901, "name":'靖江市' },
                { "id":3902, "name":'泰兴市' },
                { "id":3903, "name":'姜堰市' },
                { "id":3904, "name":'兴化市'}
            ] },
            { "id":97, "name":'盐城', "sub":[
                { "id":3889, "name":'亭湖区' },
                { "id":3890, "name":'盐都区' },
                { "id":3891, "name":'东台市' },
                { "id":3892, "name":'大丰市' },
                { "id":3893, "name":'射阳县' },
                { "id":3894, "name":'阜宁县' },
                { "id":3895, "name":'滨海县' },
                { "id":3896, "name":'响水县' },
                { "id":3897, "name":'建湖县'}
            ] },
            { "id":100, "name":'宿迁', "sub":[
                { "id":3876, "name":'宿城区' },
                { "id":3877, "name":'宿豫区' },
                { "id":3878, "name":'沭阳县' },
                { "id":3879, "name":'泗阳县' },
                { "id":3880, "name":'泗洪县'}
            ]}
        ] },
        { "id":11, "name":'浙江', "subcity":[
            { "id":3, "name":'杭州', "sub":[
                { "id":62, "name":'西湖区' },
                { "id":58, "name":'上城区' },
                { "id":59, "name":'下城区' },
                { "id":60, "name":'拱墅区' },
                { "id":61, "name":'江干区' },
                { "id":63, "name":'滨江区' },
                { "id":64, "name":'近郊'}
            ] },
            { "id":11, "name":'宁波', "sub":[
                { "id":3949, "name":'镇海区' },
                { "id":80, "name":'海曙区' },
                { "id":81, "name":'江东区' },
                { "id":82, "name":'江北区' },
                { "id":83, "name":'鄞州区' },
                { "id":417, "name":'北仑区' },
                { "id":84, "name":'近郊'}
            ] },
            { "id":102, "name":'嘉兴', "sub":[
                { "id":3938, "name":'南湖区' },
                { "id":3939, "name":'秀洲区' },
                { "id":3940, "name":'平湖市' },
                { "id":3941, "name":'海宁市' },
                { "id":3942, "name":'桐乡市' },
                { "id":3943, "name":'嘉善县' },
                { "id":3944, "name":'海盐县'}
            ] },
            { "id":101, "name":'温州', "sub":[
                { "id":3980, "name":'鹿城区' },
                { "id":3989, "name":'洞头县' },
                { "id":3988, "name":'泰顺县' },
                { "id":3987, "name":'平阳县' },
                { "id":3986, "name":'文成县' },
                { "id":3985, "name":'永嘉县' },
                { "id":3984, "name":'乐清市' },
                { "id":3983, "name":'瑞安市' },
                { "id":3982, "name":'瓯海区' },
                { "id":3981, "name":'龙湾区' },
                { "id":3990, "name":'苍南县'}
            ] },
            { "id":108, "name":'台州', "sub":[
                { "id":3971, "name":'椒江区' },
                { "id":3972, "name":'黄岩区' },
                { "id":3973, "name":'路桥区' },
                { "id":3974, "name":'临海市' },
                { "id":3975, "name":'温岭市' },
                { "id":3976, "name":'三门县' },
                { "id":3977, "name":'天台县' },
                { "id":3978, "name":'仙居县' },
                { "id":3979, "name":'玉环县'}
            ] },
            { "id":105, "name":'金华', "sub":[
                { "id":3962, "name":'婺城区' },
                { "id":3963, "name":'金东区' },
                { "id":3964, "name":'兰溪市' },
                { "id":3965, "name":'永康市' },
                { "id":3966, "name":'义乌市' },
                { "id":3967, "name":'东阳市' },
                { "id":3968, "name":'武义县' },
                { "id":3969, "name":'浦江县' },
                { "id":3970, "name":'磐安县'}
            ] },
            { "id":104, "name":'绍兴', "sub":[
                { "id":3950, "name":'越城区' },
                { "id":3951, "name":'诸暨市' },
                { "id":3952, "name":'上虞市' },
                { "id":3953, "name":'嵊州市' },
                { "id":3954, "name":'绍兴县' },
                { "id":3955, "name":'新昌县'}
            ] },
            { "id":103, "name":'湖州', "sub":[
                { "id":3933, "name":'吴兴区' },
                { "id":3934, "name":'南浔区' },
                { "id":3935, "name":'长兴县' },
                { "id":3936, "name":'德清县' },
                { "id":3937, "name":'安吉县'}
            ] },
            { "id":107, "name":'舟山', "sub":[
                { "id":3945, "name":'定海区' },
                { "id":3946, "name":'普陀区' },
                { "id":3947, "name":'岱山县' },
                { "id":3948, "name":'嵊泗县'}
            ] },
            { "id":106, "name":'衢州', "sub":[
                { "id":3956, "name":'柯城区' },
                { "id":3957, "name":'衢江区' },
                { "id":3958, "name":'江山市' },
                { "id":3959, "name":'常山县' },
                { "id":3960, "name":'开化县' },
                { "id":3961, "name":'龙游县'}
            ] },
            { "id":109, "name":'丽水', "sub":[
                { "id":3991, "name":'莲都区' },
                { "id":3992, "name":'龙泉市' },
                { "id":3993, "name":'缙云县' },
                { "id":3994, "name":'青田县' },
                { "id":3995, "name":'云和县' },
                { "id":3996, "name":'遂昌县' },
                { "id":3997, "name":'松阳县' },
                { "id":3998, "name":'庆元县' },
                { "id":3999, "name":'景宁畲族自治县'}
            ]}
        ] },
        { "id":12, "name":'安徽', "subcity":[
            { "id":110, "name":'合肥', "sub":[
                { "id":354, "name":'瑶海区' },
                { "id":355, "name":'庐阳区' },
                { "id":356, "name":'蜀山区' },
                { "id":357, "name":'包河区' },
                { "id":358, "name":'近郊'}
            ] },
            { "id":118, "name":'黄山', "sub":[
                { "id":4071, "name":'屯溪区' },
                { "id":4072, "name":'黄山区' },
                { "id":4073, "name":'徽州区' },
                { "id":4074, "name":'歙县' },
                { "id":4075, "name":'休宁县' },
                { "id":4076, "name":'黟县' },
                { "id":4077, "name":'祁门县'}
            ] },
            { "id":112, "name":'蚌埠', "sub":[
                { "id":4024, "name":'蚌山区' },
                { "id":4025, "name":'龙子湖区' },
                { "id":4026, "name":'禹会区' },
                { "id":4027, "name":'淮上区' },
                { "id":4028, "name":'怀远县' },
                { "id":4029, "name":'五河县' },
                { "id":4030, "name":'固镇县'}
            ] },
            { "id":111, "name":'芜湖', "sub":[
                { "id":4049, "name":'镜湖区' },
                { "id":4050, "name":'弋江区' },
                { "id":4051, "name":'三山区' },
                { "id":4052, "name":'鸠江区' },
                { "id":4053, "name":'芜湖县' },
                { "id":4054, "name":'繁昌县' },
                { "id":4055, "name":'南陵县'}
            ] },
            { "id":121, "name":'宿州', "sub":[
                { "id":4003, "name":'埇桥区' },
                { "id":4004, "name":'砀山县' },
                { "id":4005, "name":'萧县' },
                { "id":4006, "name":'灵璧县' },
                { "id":4007, "name":'泗县'}
            ] },
            { "id":113, "name":'淮南', "sub":[
                { "id":4031, "name":'田家庵区' },
                { "id":4032, "name":'大通区' },
                { "id":4033, "name":'谢家集区' },
                { "id":4034, "name":'八公山区' },
                { "id":4035, "name":'潘集区' },
                { "id":4036, "name":'凤台县'}
            ] },
            { "id":119, "name":'滁州', "sub":[
                { "id":4037, "name":'琅琊区' },
                { "id":4038, "name":'南谯区' },
                { "id":4039, "name":'明光市' },
                { "id":4040, "name":'天长市' },
                { "id":4041, "name":'来安县' },
                { "id":4042, "name":'全椒县' },
                { "id":4043, "name":'定远县' },
                { "id":4044, "name":'凤阳县'}
            ] },
            { "id":117, "name":'安庆', "sub":[
                { "id":4060, "name":'迎江区' },
                { "id":4069, "name":'望江县' },
                { "id":4068, "name":'宿松县' },
                { "id":4067, "name":'太湖县' },
                { "id":4066, "name":'潜山县' },
                { "id":4065, "name":'枞阳县' },
                { "id":4064, "name":'怀宁县' },
                { "id":4063, "name":'桐城市' },
                { "id":4062, "name":'宜秀区' },
                { "id":4061, "name":'大观区' },
                { "id":4070, "name":'岳西县'}
            ] },
            { "id":114, "name":'马鞍山', "sub":[
                { "id":4045, "name":'雨山区' },
                { "id":4046, "name":'花山区' },
                { "id":4047, "name":'金家庄区' },
                { "id":4048, "name":'当涂县'}
            ] },
            { "id":115, "name":'淮北', "sub":[
                { "id":4008, "name":'相山区' },
                { "id":4009, "name":'杜集区' },
                { "id":4010, "name":'烈山区' },
                { "id":4011, "name":'濉溪县'}
            ] },
            { "id":120, "name":'阜阳', "sub":[
                { "id":4016, "name":'颍州区' },
                { "id":4017, "name":'颍东区' },
                { "id":4018, "name":'颍泉区' },
                { "id":4019, "name":'界首市' },
                { "id":4020, "name":'临泉县' },
                { "id":4021, "name":'太和县' },
                { "id":4022, "name":'阜南县' },
                { "id":4023, "name":'颍上县'}
            ] },
            { "id":122, "name":'巢湖', "sub":[
                { "id":4085, "name":'居巢区' },
                { "id":4086, "name":'庐江县' },
                { "id":4087, "name":'无为县' },
                { "id":4088, "name":'含山县' },
                { "id":4089, "name":'和县'}
            ] },
            { "id":126, "name":'宣城', "sub":[
                { "id":4094, "name":'宣州区' },
                { "id":4095, "name":'宁国市' },
                { "id":4096, "name":'郎溪县' },
                { "id":4097, "name":'广德县' },
                { "id":4098, "name":'泾县' },
                { "id":4099, "name":'旌德县' },
                { "id":4100, "name":'绩溪县'}
            ] },
            { "id":124, "name":'亳州', "sub":[
                { "id":4012, "name":'谯城区' },
                { "id":4013, "name":'涡阳县' },
                { "id":4014, "name":'蒙城县' },
                { "id":4015, "name":'利辛县'}
            ] },
            { "id":116, "name":'铜陵', "sub":[
                { "id":4056, "name":'铜官山区' },
                { "id":4057, "name":'狮子山区' },
                { "id":4058, "name":'郊区' },
                { "id":4059, "name":'铜陵县'}
            ] },
            { "id":125, "name":'池州', "sub":[
                { "id":4090, "name":'贵池区' },
                { "id":4091, "name":'东至县' },
                { "id":4092, "name":'石台县' },
                { "id":4093, "name":'青阳县'}
            ] },
            { "id":123, "name":'六安', "sub":[
                { "id":4078, "name":'金安区' },
                { "id":4079, "name":'裕安区' },
                { "id":4080, "name":'寿县' },
                { "id":4081, "name":'霍邱县' },
                { "id":4082, "name":'舒城县' },
                { "id":4083, "name":'金寨县' },
                { "id":4084, "name":'霍山县'}
            ]}
        ] },
        { "id":13, "name":'福建', "subcity":[
            { "id":14, "name":'福州', "sub":[
                { "id":98, "name":'鼓楼区' },
                { "id":99, "name":'晋安区' },
                { "id":100, "name":'台江区' },
                { "id":101, "name":'仓山区' },
                { "id":103, "name":'近郊'}
            ] },
            { "id":15, "name":'厦门', "sub":[
                { "id":104, "name":'思明区' },
                { "id":105, "name":'湖里区' },
                { "id":106, "name":'集美区' },
                { "id":108, "name":'同安区' },
                { "id":107, "name":'海沧区' },
                { "id":109, "name":'翔安区'}
            ] },
            { "id":129, "name":'泉州', "sub":[
                { "id":4136, "name":'鲤城区' },
                { "id":4145, "name":'永春县' },
                { "id":4144, "name":'安溪县' },
                { "id":4143, "name":'惠安县' },
                { "id":4142, "name":'南安市' },
                { "id":4141, "name":'晋江市' },
                { "id":4140, "name":'石狮市' },
                { "id":4139, "name":'泉港区' },
                { "id":4138, "name":'洛江区' },
                { "id":4137, "name":'丰泽区' },
                { "id":4146, "name":'德化县'}
            ] },
            { "id":130, "name":'漳州', "sub":[
                { "id":4147, "name":'芗城区' },
                { "id":4156, "name":'平和县' },
                { "id":4155, "name":'南靖县' },
                { "id":4154, "name":'东山县' },
                { "id":4153, "name":'长泰县' },
                { "id":4152, "name":'诏安县' },
                { "id":4151, "name":'漳浦县' },
                { "id":4150, "name":'云霄县' },
                { "id":4149, "name":'龙海市' },
                { "id":4148, "name":'龙文区' },
                { "id":4157, "name":'华安县'}
            ] },
            { "id":132, "name":'龙岩', "sub":[
                { "id":4158, "name":'新罗区' },
                { "id":4159, "name":'漳平市' },
                { "id":4160, "name":'长汀县' },
                { "id":4161, "name":'永定县' },
                { "id":4162, "name":'上杭县' },
                { "id":4163, "name":'武平县' },
                { "id":4164, "name":'连城县'}
            ] },
            { "id":131, "name":'南平', "sub":[
                { "id":4109, "name":'延平区' },
                { "id":4117, "name":'松溪县' },
                { "id":4116, "name":'光泽县' },
                { "id":4115, "name":'浦城县' },
                { "id":4114, "name":'顺昌县' },
                { "id":4113, "name":'建阳市' },
                { "id":4112, "name":'建瓯市' },
                { "id":4111, "name":'武夷山市' },
                { "id":4110, "name":'邵武市' },
                { "id":4118, "name":'政和县'}
            ] },
            { "id":133, "name":'宁德', "sub":[
                { "id":4165, "name":'蕉城区' },
                { "id":4166, "name":'福安市' },
                { "id":4167, "name":'福鼎市' },
                { "id":4168, "name":'寿宁县' },
                { "id":4169, "name":'霞浦县' },
                { "id":4170, "name":'柘荣县' },
                { "id":4171, "name":'屏南县' },
                { "id":4172, "name":'古田县' },
                { "id":4173, "name":'周宁县'}
            ] },
            { "id":128, "name":'三明', "sub":[
                { "id":4124, "name":'梅列区' },
                { "id":4134, "name":'泰宁县' },
                { "id":4133, "name":'将乐县' },
                { "id":4132, "name":'沙县' },
                { "id":4131, "name":'尤溪县' },
                { "id":4130, "name":'大田县' },
                { "id":4129, "name":'宁化县' },
                { "id":4128, "name":'清流县' },
                { "id":4127, "name":'明溪县' },
                { "id":4126, "name":'永安市' },
                { "id":4125, "name":'三元区' },
                { "id":4135, "name":'建宁县'}
            ] },
            { "id":127, "name":'莆田', "sub":[
                { "id":4119, "name":'城厢区' },
                { "id":4120, "name":'涵江区' },
                { "id":4121, "name":'荔城区' },
                { "id":4122, "name":'秀屿区' },
                { "id":4123, "name":'仙游县'}
            ]}
        ] },
        { "id":14, "name":'江西', "subcity":[
            { "id":134, "name":'南昌', "sub":[
                { "id":329, "name":'东湖区' },
                { "id":330, "name":'西湖区' },
                { "id":331, "name":'青云谱区' },
                { "id":332, "name":'湾里区' },
                { "id":333, "name":'青山湖区' },
                { "id":334, "name":'近郊'}
            ] },
            { "id":140, "name":'赣州', "sub":[
                { "id":4204, "name":'章贡区' },
                { "id":4220, "name":'寻乌县' },
                { "id":4219, "name":'会昌县' },
                { "id":4218, "name":'兴国县' },
                { "id":4217, "name":'于都县' },
                { "id":4216, "name":'宁都县' },
                { "id":4215, "name":'全南县' },
                { "id":4214, "name":'定南县' },
                { "id":4213, "name":'龙南县' },
                { "id":4212, "name":'安远县' },
                { "id":4211, "name":'崇义县' },
                { "id":4210, "name":'上犹县' },
                { "id":4209, "name":'大余县' },
                { "id":4208, "name":'信丰县' },
                { "id":4207, "name":'赣县' },
                { "id":4206, "name":'南康市' },
                { "id":4205, "name":'瑞金市' },
                { "id":4221, "name":'石城县'}
            ] },
            { "id":137, "name":'九江', "sub":[
                { "id":4178, "name":'浔阳区' },
                { "id":4188, "name":'湖口县' },
                { "id":4187, "name":'都昌县' },
                { "id":4186, "name":'星子县' },
                { "id":4185, "name":'德安县' },
                { "id":4184, "name":'永修县' },
                { "id":4183, "name":'修水县' },
                { "id":4182, "name":'武宁县' },
                { "id":4181, "name":'九江县' },
                { "id":4180, "name":'瑞昌市' },
                { "id":4179, "name":'庐山区' },
                { "id":4189, "name":'彭泽县'}
            ] },
            { "id":144, "name":'上饶', "sub":[
                { "id":4222, "name":'信州区' },
                { "id":4232, "name":'万年县' },
                { "id":4231, "name":'鄱阳县' },
                { "id":4230, "name":'余干县' },
                { "id":4229, "name":'弋阳县' },
                { "id":4228, "name":'横峰县' },
                { "id":4227, "name":'铅山县' },
                { "id":4226, "name":'玉山县' },
                { "id":4225, "name":'广丰县' },
                { "id":4224, "name":'上饶县' },
                { "id":4223, "name":'德兴市' },
                { "id":4233, "name":'婺源县'}
            ] },
            { "id":135, "name":'景德镇', "sub":[
                { "id":4190, "name":'珠山区' },
                { "id":4191, "name":'昌江区' },
                { "id":4192, "name":'乐平市' },
                { "id":4193, "name":'浮梁县'}
            ] },
            { "id":141, "name":'吉安', "sub":[
                { "id":4255, "name":'吉州区' },
                { "id":4266, "name":'安福县' },
                { "id":4265, "name":'万安县' },
                { "id":4264, "name":'遂川县' },
                { "id":4263, "name":'泰和县' },
                { "id":4262, "name":'永丰县' },
                { "id":4261, "name":'新干县' },
                { "id":4260, "name":'峡江县' },
                { "id":4259, "name":'吉水县' },
                { "id":4258, "name":'吉安县' },
                { "id":4257, "name":'井冈山市' },
                { "id":4256, "name":'青原区' },
                { "id":4267, "name":'永新县'}
            ] },
            { "id":138, "name":'新余', "sub":[
                { "id":4197, "name":'渝水区' },
                { "id":4198, "name":'分宜县'}
            ] },
            { "id":142, "name":'宜春', "sub":[
                { "id":4245, "name":'袁州区' },
                { "id":4253, "name":'靖安县' },
                { "id":4252, "name":'宜丰县' },
                { "id":4251, "name":'上高县' },
                { "id":4250, "name":'万载县' },
                { "id":4249, "name":'奉新县' },
                { "id":4248, "name":'高安市' },
                { "id":4247, "name":'樟树市' },
                { "id":4246, "name":'丰城市' },
                { "id":4254, "name":'铜鼓县'}
            ] },
            { "id":136, "name":'萍乡', "sub":[
                { "id":4199, "name":'安源区' },
                { "id":4200, "name":'湘东区' },
                { "id":4201, "name":'莲花县' },
                { "id":4202, "name":'上栗县' },
                { "id":4203, "name":'芦溪县'}
            ] },
            { "id":139, "name":'鹰潭', "sub":[
                { "id":4194, "name":'月湖区' },
                { "id":4195, "name":'贵溪市' },
                { "id":4196, "name":'余江县'}
            ] },
            { "id":143, "name":'抚州', "sub":[
                { "id":4234, "name":'临川区' },
                { "id":4243, "name":'东乡县' },
                { "id":4242, "name":'资溪县' },
                { "id":4241, "name":'金溪县' },
                { "id":4240, "name":'宜黄县' },
                { "id":4239, "name":'乐安县' },
                { "id":4238, "name":'崇仁县' },
                { "id":4237, "name":'南丰县' },
                { "id":4236, "name":'黎川县' },
                { "id":4235, "name":'南城县' },
                { "id":4244, "name":'广昌县'}
            ]}
        ] },
        { "id":15, "name":'山东', "subcity":[
            { "id":21, "name":'青岛', "sub":[
                { "id":144, "name":'市南区' },
                { "id":145, "name":'市北区' },
                { "id":148, "name":'崂山区' },
                { "id":147, "name":'李沧区' },
                { "id":146, "name":'四方区' },
                { "id":149, "name":'开发区' },
                { "id":150, "name":'近郊'}
            ] },
            { "id":22, "name":'济南', "sub":[
                { "id":151, "name":'历下区' },
                { "id":152, "name":'市中区' },
                { "id":153, "name":'槐荫区' },
                { "id":154, "name":'天桥区' },
                { "id":155, "name":'历城区' },
                { "id":156, "name":'长清区' },
                { "id":157, "name":'近郊'}
            ] },
            { "id":148, "name":'烟台', "sub":[
                { "id":4316, "name":'莱山区' },
                { "id":4326, "name":'招远市' },
                { "id":4325, "name":'蓬莱市' },
                { "id":4324, "name":'莱州市' },
                { "id":4323, "name":'莱阳市' },
                { "id":4322, "name":'龙口市' },
                { "id":4321, "name":'海阳市' },
                { "id":4320, "name":'栖霞市' },
                { "id":4319, "name":'牟平区' },
                { "id":4318, "name":'福山区' },
                { "id":4317, "name":'芝罘区' },
                { "id":4327, "name":'长岛县'}
            ] },
            { "id":152, "name":'威海', "sub":[
                { "id":4328, "name":'环翠区' },
                { "id":4329, "name":'荣成市' },
                { "id":4330, "name":'乳山市' },
                { "id":4331, "name":'文登市'}
            ] },
            { "id":149, "name":'潍坊', "sub":[
                { "id":4304, "name":'潍城区' },
                { "id":4314, "name":'临朐县' },
                { "id":4313, "name":'寿光市' },
                { "id":4312, "name":'诸城市' },
                { "id":4311, "name":'青州市' },
                { "id":4310, "name":'高密市' },
                { "id":4309, "name":'昌邑市' },
                { "id":4308, "name":'安丘市' },
                { "id":4307, "name":'奎文区' },
                { "id":4306, "name":'坊子区' },
                { "id":4305, "name":'寒亭区' },
                { "id":4315, "name":'昌乐县'}
            ] },
            { "id":151, "name":'泰安', "sub":[
                { "id":4373, "name":'泰山区' },
                { "id":4374, "name":'岱岳区' },
                { "id":4375, "name":'新泰市' },
                { "id":4376, "name":'肥城市' },
                { "id":4377, "name":'宁阳县' },
                { "id":4378, "name":'东平县'}
            ] },
            { "id":145, "name":'淄博', "sub":[
                { "id":4296, "name":'张店区' },
                { "id":4297, "name":'淄川区' },
                { "id":4298, "name":'博山区' },
                { "id":4299, "name":'临淄区' },
                { "id":4300, "name":'周村区' },
                { "id":4301, "name":'桓台县' },
                { "id":4302, "name":'高青县' },
                { "id":4303, "name":'沂源县'}
            ] },
            { "id":155, "name":'临沂', "sub":[
                { "id":4343, "name":'兰山区' },
                { "id":4353, "name":'沂南县' },
                { "id":4352, "name":'费县' },
                { "id":4351, "name":'平邑县' },
                { "id":4350, "name":'蒙阴县' },
                { "id":4349, "name":'沂水县' },
                { "id":4348, "name":'莒南县' },
                { "id":4347, "name":'苍山县' },
                { "id":4346, "name":'郯城县' },
                { "id":4345, "name":'河东区' },
                { "id":4344, "name":'罗庄区' },
                { "id":4354, "name":'临沭县'}
            ] },
            { "id":150, "name":'济宁', "sub":[
                { "id":4361, "name":'市中区' },
                { "id":4371, "name":'泗水县' },
                { "id":4370, "name":'汶上县' },
                { "id":4369, "name":'嘉祥县' },
                { "id":4368, "name":'金乡县' },
                { "id":4367, "name":'鱼台县' },
                { "id":4366, "name":'微山县' },
                { "id":4365, "name":'邹城市' },
                { "id":4364, "name":'兖州市' },
                { "id":4363, "name":'曲阜市' },
                { "id":4362, "name":'任城区' },
                { "id":4372, "name":'梁山县'}
            ] },
            { "id":147, "name":'东营', "sub":[
                { "id":4291, "name":'东营区' },
                { "id":4292, "name":'河口区' },
                { "id":4293, "name":'垦利县' },
                { "id":4294, "name":'利津县' },
                { "id":4295, "name":'广饶县'}
            ] },
            { "id":153, "name":'日照', "sub":[
                { "id":4339, "name":'东港区' },
                { "id":4340, "name":'岚山区' },
                { "id":4341, "name":'五莲县' },
                { "id":4342, "name":'莒县'}
            ] },
            { "id":146, "name":'枣庄', "sub":[
                { "id":4355, "name":'薛城区' },
                { "id":4356, "name":'市中区' },
                { "id":4357, "name":'峄城区' },
                { "id":4358, "name":'台儿庄区' },
                { "id":4359, "name":'山亭区' },
                { "id":4360, "name":'滕州市'}
            ] },
            { "id":156, "name":'德州', "sub":[
                { "id":4280, "name":'德城区' },
                { "id":4289, "name":'宁津县' },
                { "id":4288, "name":'临邑县' },
                { "id":4287, "name":'齐河县' },
                { "id":4286, "name":'武城县' },
                { "id":4285, "name":'夏津县' },
                { "id":4284, "name":'平原县' },
                { "id":4283, "name":'陵县' },
                { "id":4282, "name":'禹城市' },
                { "id":4281, "name":'乐陵市' },
                { "id":4290, "name":'庆云县'}
            ] },
            { "id":158, "name":'滨州', "sub":[
                { "id":4381, "name":'滨城区' },
                { "id":4382, "name":'惠民县' },
                { "id":4383, "name":'阳信县' },
                { "id":4384, "name":'无棣县' },
                { "id":4385, "name":'沾化县' },
                { "id":4386, "name":'博兴县' },
                { "id":4387, "name":'邹平县'}
            ] },
            { "id":157, "name":'聊城', "sub":[
                { "id":4272, "name":'东昌府区' },
                { "id":4273, "name":'临清市' },
                { "id":4274, "name":'阳谷县' },
                { "id":4275, "name":'莘县' },
                { "id":4276, "name":'茌平县' },
                { "id":4277, "name":'东阿县' },
                { "id":4278, "name":'冠县' },
                { "id":4279, "name":'高唐县'}
            ] },
            { "id":159, "name":'菏泽', "sub":[
                { "id":4388, "name":'牡丹区' },
                { "id":4389, "name":'曹县' },
                { "id":4390, "name":'定陶县' },
                { "id":4391, "name":'成武县' },
                { "id":4392, "name":'单县' },
                { "id":4393, "name":'巨野县' },
                { "id":4394, "name":'郓城县' },
                { "id":4395, "name":'鄄城县' },
                { "id":4396, "name":'东明县'}
            ] },
            { "id":154, "name":'莱芜', "sub":[
                { "id":4379, "name":'莱城区' },
                { "id":4380, "name":'钢城区'}
            ]}
        ] },
        { "id":31, "name":'新疆', "subcity":[
            { "id":325, "name":'乌鲁木齐', "sub":[
                { "id":482, "name":'天山区' },
                { "id":483, "name":'沙依巴克区' },
                { "id":484, "name":'新市区' },
                { "id":485, "name":'水磨沟区' },
                { "id":534, "name":'近郊'}
            ] },
            { "id":331, "name":'巴音郭楞', "sub":[
                { "id":5708, "name":'库尔勒市' },
                { "id":5709, "name":'轮台县' },
                { "id":5710, "name":'尉犁县' },
                { "id":5711, "name":'若羌县' },
                { "id":5712, "name":'且末县' },
                { "id":5713, "name":'和静县' },
                { "id":5714, "name":'和硕县' },
                { "id":5715, "name":'博湖县' },
                { "id":5716, "name":'焉耆回族自治县'}
            ] },
            { "id":336, "name":'伊犁', "sub":[
                { "id":5717, "name":'伊宁市' },
                { "id":5725, "name":'尼勒克县' },
                { "id":5724, "name":'特克斯县' },
                { "id":5723, "name":'昭苏县' },
                { "id":5722, "name":'新源县' },
                { "id":5721, "name":'巩留县' },
                { "id":5720, "name":'霍城县' },
                { "id":5719, "name":'伊宁县' },
                { "id":5718, "name":'奎屯市' },
                { "id":5726, "name":'察布查尔锡伯自治县'}
            ] },
            { "id":339, "name":'石河子' },
            { "id":338, "name":'阿勒泰地区', "sub":[
                { "id":5734, "name":'阿勒泰市' },
                { "id":5735, "name":'布尔津县' },
                { "id":5736, "name":'富蕴县' },
                { "id":5737, "name":'福海县' },
                { "id":5738, "name":'哈巴河县' },
                { "id":5739, "name":'青河县' },
                { "id":5740, "name":'吉木乃县'}
            ] },
            { "id":327, "name":'吐鲁番地区' },
            { "id":334, "name":'喀什地区', "sub":[
                { "id":5657, "name":'喀什市' },
                { "id":5667, "name":'巴楚县' },
                { "id":5666, "name":'伽师县' },
                { "id":5665, "name":'岳普湖县' },
                { "id":5664, "name":'麦盖提县' },
                { "id":5663, "name":'叶城县' },
                { "id":5662, "name":'莎车县' },
                { "id":5661, "name":'泽普县' },
                { "id":5660, "name":'英吉沙县' },
                { "id":5659, "name":'疏勒县' },
                { "id":5658, "name":'疏附县' },
                { "id":5668, "name":'塔什库尔干塔吉克自治县'}
            ] },
            { "id":328, "name":'哈密地区', "sub":[
                { "id":5690, "name":'哈密市' },
                { "id":5691, "name":'伊吾县' },
                { "id":5692, "name":'巴里坤哈萨克自治县'}
            ] },
            { "id":326, "name":'克拉玛依', "sub":[
                { "id":5653, "name":'克拉玛依区' },
                { "id":5654, "name":'独山子区' },
                { "id":5655, "name":'白碱滩区' },
                { "id":5656, "name":'乌尔禾区'}
            ] },
            { "id":337, "name":'塔城地区', "sub":[
                { "id":5727, "name":'塔城市' },
                { "id":5728, "name":'乌苏市' },
                { "id":5729, "name":'额敏县' },
                { "id":5730, "name":'沙湾县' },
                { "id":5731, "name":'托里县' },
                { "id":5732, "name":'裕民县' },
                { "id":5733, "name":'和布克赛尔蒙古自治县'}
            ] },
            { "id":332, "name":'阿克苏地区', "sub":[
                { "id":5669, "name":'阿克苏市' },
                { "id":5670, "name":'温宿县' },
                { "id":5671, "name":'库车县' },
                { "id":5672, "name":'沙雅县' },
                { "id":5673, "name":'新和县' },
                { "id":5674, "name":'拜城县' },
                { "id":5675, "name":'乌什县' },
                { "id":5676, "name":'阿瓦提县' },
                { "id":5677, "name":'柯坪县'}
            ] },
            { "id":335, "name":'和田地区', "sub":[
                { "id":5678, "name":'和田市' },
                { "id":5688, "name":'鄯善县' },
                { "id":5687, "name":'吐鲁番市' },
                { "id":5686, "name":'吐鲁番地区' },
                { "id":5685, "name":'民丰县' },
                { "id":5684, "name":'于田县' },
                { "id":5683, "name":'策勒县' },
                { "id":5682, "name":'洛浦县' },
                { "id":5681, "name":'皮山县' },
                { "id":5680, "name":'墨玉县' },
                { "id":5679, "name":'和田县' },
                { "id":5689, "name":'托克逊县'}
            ] },
            { "id":330, "name":'博尔塔拉', "sub":[
                { "id":5697, "name":'博乐市' },
                { "id":5698, "name":'精河县' },
                { "id":5699, "name":'温泉县'}
            ] },
            { "id":333, "name":'克孜勒苏', "sub":[
                { "id":5693, "name":'阿图什市' },
                { "id":5694, "name":'阿克陶县' },
                { "id":5695, "name":'阿合奇县' },
                { "id":5696, "name":'乌恰县'}
            ] },
            { "id":389, "name":'阿拉尔' },
            { "id":405, "name":'图木舒克' },
            { "id":409, "name":'五家渠'}
        ]}
    ];

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/util/ajax", ["wepp@~2.7.0","zepto-wepp@~1.1.0","underscore@~1.5.0"], function(require, exports, module) {
/*
 * 封装下$.ajax
 * 根据code处理
 * 用POST
 * */

var UI = require('wepp').UI;
var $ = require('zepto-wepp');
var _ = require('underscore');

var uiAlert = function(res){
    UI.alert(res.data.content,2000);
};

module.exports = function(url,data,callbacks){
    /*
     * url can be string or object
     * if is object , merge to ajax param
     * */
    var ajaxParam = {
        url:'',
        data:data ||{},
        type:"POST",
        dataType:"json",
        success:function(res){
            callbacks['finish'] && callbacks['finish']();
            callbacks['success'] && callbacks['success'](res.data);
            var code = res.code;
            if(code===200){
                callbacks['200'](res.data);
            }else {
                if(callbacks['other']){
                    callbacks['other'](res.data,res);
                }else if(callbacks[code]){
                    callbacks[code](res.data);
                }else {
                    uiAlert(res);
                }
            }
        },
        error:function(){
            callbacks['finish'] && callbacks['finish']();
            UI.alert('网络出错,请稍后再试哦~');
        }
    };
    if(typeof url ==="string"){
        ajaxParam.url = url;
    }else {
        _.extend(ajaxParam,url);
    }
    $.ajax(ajaxParam);
};

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/modules/deliveryadd/content/template.html", [], function(require, exports, module) {
module.exports = '<div class="delivery"><p class="c-box-tit">请认真填写配送信息，以保证货品送达</p><div class="c-box"><div class="item"><span class="tit">省份:</span><select name="province" class="J_province"><option value="-1">--请选择--</option><%list.forEach(function(item,index){%><option value="<%= index %>"><%= item.name %></option><%});%></select></div><div class="item"><span class="tit">城市:</span><select class="J_city" name="city" id="J_city"><option value="0">--请选择--</option></select></div><div class="item"><span class="tit">区县：</span><select class="J_district" name="district" id="J_district"><option value="0">--请选择--</option></select></div><div class="item"><span class="tit">详细地址：</span><input  class="J_detailAddr com-input" placeholder="无需重复填写省市区" type="text" maxlength="200" name="address"></div><div class="item"><span class="tit">邮编：</span><input  class="J_postcode com-input" type="text" name="postCode" placeholder="请输入邮编"></div><div class="item"><span class="tit">收货人：</span><input id="J_consignee" class="J_consignee com-input" type="text" name="consignee" placeholder="收货人姓名"></div><div class="item"><span class="tit">手机号：</span><input id="J_telphone" class="J_telphone com-input" type="number" name="phoneNO" placeholder="手机号或电话号码"></div></div></div><a class="y-btn J_deliveradd_submit">保存</a><a class="n-btn J_un_deliveradd_submit hide">正在处理</a><div class="height-box"></div>'

}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});
define("unit-m-weixin@1.12.6/js/pages/deliveryadd", ["zepto-wepp@~1.1.0","underscore@~1.5.0","marionette@~1.4.0","../modules/deliveryadd/content/controller","../modules/deliveryadd/layout.html"], function(require, exports, module) {
var $ = require('zepto-wepp');
var _ = require('underscore');
var Marionette = require('marionette');

var content = require('../modules/deliveryadd/content/controller');

var AddressController = Marionette.Controller.extend({
    show:function(index){
        var self =  this;
        self.contentController = new content({
            temp:index == 'temp'
        });
        ThisApp.openPage().then(function(page){
            page.initRegion({
                template:_.template(require("../modules/deliveryadd/layout.html")),
                regions:{
                    'header': '.J_header',
                    'content': '.J_content'
                }
            });
            self.contentController.show(page.layout.content);
        });
    }
});

exports.Controller = AddressController;



}, {
    "asyncDeps": [
        "iscroll@~5.0.9"
    ]
});