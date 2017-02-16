var regDate = new RegExp("T.*");
var extractDate = function(str) {
    return str.replace(regDate, "");
}

var regFloatPart = new RegExp("\\.\\d+$");
var regIntPart = new RegExp("^\\d+");
var formatThousand = function (number) {
    if (number == 0) return "0";
    if (!number) return "";
    var str = number.toString();
    str = str.replace(",", "");
    var strInt, strFloat = "";
    if (!regIntPart.test(str)) return "";
    strInt = str.match(regIntPart)[0];
    if (regFloatPart.test(str)) {
        strFloat = str.match(regFloatPart)[0];
    }
    var digits = [];
    for (var i = strInt.length - 1; i >= 0; i--) {
        if ((strInt.length - i - 1) % 3 == 0 && i != strInt.length - 1) {
            digits.unshift(",");
        }
        digits.unshift(strInt[i]);
    }
    strInt = digits.join("");
    return strInt + strFloat;
    return number;
}

var wait = function (option) {
    if (option === "show") {
        $(".wait").show();
    } else {
        $(".wait").hide();
    }
}

var connotate = function(uri) {
    return uri.replace("%", "%25");
}

var abbr = function (str, length, appendString) {
    if (str.length > length + appendString.length - 1) {
        return str.substring(0, length) + appendString;
    } else {
        return str;
    }
}

var abbrEm = function (str, length, appendString) {
    var rgEm = new RegExp("<[^<>]+>", "g");
    if (!rgEm.test(str)) {
        return abbr(str, length, appendString);
    }
    var strRaw = str.replace(rgEm, "");
    if (strRaw.length <= length) {
        return str;
    } else {
        var rgFirstEm = new RegExp("^(.*?)<em>([^<]+)<");
        var strPre = str.match(rgFirstEm)[1];
        var strEm = str.match(rgFirstEm)[2];
        var strReturn;
        if (strPre.length + strEm.length > length) {
            var diff = strPre.length + strEm.length - length;
            strPre = strPre.substr(0, strPre.length - diff - 1) + "...";
            strReturn = strPre + "<em>" + strEm + "</em>" + appendString;
            return strReturn;
        } else {
            var rgEmEnd = new RegExp("</em>(.*)$");
            var strAfter = str.match(rgEmEnd)[1];
            diff = length - strPre.length - strEm.length;
            strAfter = strAfter.substr(0, diff);
            var rgOpenEmEnd = new RegExp("<[/em]+$");
            strAfter = strAfter.replace(rgOpenEmEnd, "");
            strReturn = strPre + "<em>" + strEm + "</em>" + strAfter + appendString;
            return strReturn;
        }
    }
}
//分类文章的数量
var abbrNum = function(num) {
    if (num > 99999) {
        return "99999+";
    } else {
        return num;
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
    
function Dictionary()
{
    var size = 0;
    var entry = new Object();

    this.add = function (key , value)
    {
        if(!this.containsKey(key))
        {
            size ++ ;
        }
        entry[key] = value;
    }

    this.getValue = function (key)
    {
        return this.containsKey(key) ? entry[key] : null;
    }

    this.remove = function ( key )
    {
        if( this.containsKey(key) && ( delete entry[key] ) )
        {
            size --;
        }
    }

    this.containsKey = function ( key )
    {
        return (key in entry);
    }

    this.containsValue = function ( value )
    {
        for(var prop in entry)
        {
            if(entry[prop] == value)
            {
                return true;
            }
        }
        return false;
    }

    this.getValues = function ()
    {
        var values = new Array();
        for(var prop in entry)
        {
            values.push(entry[prop]);
        }
        return values;
    }

    this.getKeys = function ()
    {
        var keys = new Array();
        for(var prop in entry)
        {
            keys.push(prop);
        }
        return keys;
    }

    this.getSize = function ()
    {
        return size;
    }

    this.clear = function ()
    {
        size = 0;
        entry = new Object();
    }
}

function isMobileDevice() {
    var ua = navigator.userAgent;
    if (/(iphone|ios|android|mini|mobile|mobi|Nokia|Symbian|iPod|Windows\s+Phone|MQQBrowser|wp7|wp8|UCBrowser7|UCWEB|360\s+Aphone\s+Browser)/i.test(ua)) {
        return true;
    }
    return false;
}

$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};


$(document).ready(function () {

    //工具提示
    $("[data-toggle=\"tooltip\"]").tooltip();

});