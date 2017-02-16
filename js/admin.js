/*搜披露页面业务逻辑的整理*/
// 公共部分
//获取截止日期（在mainView中调用此函数）
var getEndDate = function (n) {
    var today = new Date();
    switch (n) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
            return today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate();
        default:
            today.setFullYear(n, 11, 31);
            return today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate();
    }
}

//获取初始日期（在mainView中调用此函数）
var getStartDate = function(n) {
    var dayStart = new Date();
    switch (n) {
        case 1:
            dayStart.setDate(dayStart.getDate() - 7);
            return dayStart.getFullYear() + "/" + (dayStart.getMonth() + 1) + "/" + dayStart.getDate();
        case 2:
            dayStart.setMonth(dayStart.getMonth() - 1);
            return dayStart.getFullYear() + "/" + (dayStart.getMonth() + 1) + "/" + dayStart.getDate();
        case 3:
            dayStart.setMonth(dayStart.getMonth() - 3);
            return dayStart.getFullYear() + "/" + (dayStart.getMonth() + 1) + "/" + dayStart.getDate();
        case 4:
            dayStart.setMonth(dayStart.getMonth() - 6);
            return dayStart.getFullYear() + "/" + (dayStart.getMonth() + 1) + "/" + dayStart.getDate();
        case 5:
            dayStart.setYear(dayStart.getFullYear() - 1);
            return dayStart.getFullYear() + "/" + (dayStart.getMonth() + 1) + "/" + dayStart.getDate();
        case 6:
            dayStart.setYear(dayStart.getFullYear() - 3);
            return dayStart.getFullYear() + "/" + (dayStart.getMonth() + 1) + "/" + dayStart.getDate();
        case 7:
            return "2000/1/1";
        default:
            dayStart.setFullYear(n, 0, 1);
            return dayStart.getFullYear() + "/" + (dayStart.getMonth() + 1) + "/" + dayStart.getDate();
    }
}
/*解决ie8中没有placeholder*/

// 1、注册页面
//对用户输入信息进行验证，一，验证是否符合规范，二，验证用户名是否可用，并且验证信息需要实时反映给客户，提升用户体验
// 2、登录页面

// 3、沪深
// 日期的获取和设置
var today = new Date();
    var defaultDayStart = new Date(2000, 0, 1);
    $("#input_ds").val(defaultDayStart.getFullYear() + "/" + (defaultDayStart.getMonth() + 1) + "/" + defaultDayStart.getDate());
    $("#input_de").val(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate());
    $("#lst_periods a").on("click", function () {
        var opt;
        switch ($(this).text()) {
            case "最近一周": opt = 1; break;
            case "最近一月": opt = 2; break;
            case "最近三月": opt = 3; break;
            case "最近六月": opt = 4; break;
            case "最近一年": opt = 5; break;
            case "最近三年": opt = 6; break;
            case "全部时间": opt = 7; break;
            case "2016年": opt = 2016; break;
            case "2015年": opt = 2015; break;
            case "2014年": opt = 2014; break;
            case "2013年": opt = 2013; break;
            default: opt = 7; break;
        }
        $("#input_ds").val(getStartDate(opt));
        $("#input_de").val(getEndDate(opt));
    });

// 4、新三板

// 5、美股

// 6、互动平台

// 7、法规
 
// 8、帮助

// 9、用户中心

// 10、个人主页以及行为习惯的配置

// 11、退出登录