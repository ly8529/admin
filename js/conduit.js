//console.log("看到这条信息的程序员：我们正在招技术合伙和码农，有意请投简历至hr@soupilu.com，期待你的加入！");
//console.log("'A Lannister Always Pays His Debts'  -- from the Imp");

$(document).ready(function () {
    //全局变量
    var i;
    var user = {};
    var user.uid = "";
    var user.login = false;
    var $menu = $("#menu_user");

    var register = {};
    var register.business = 0;

    var $ulBusiness = $("#ul_business");

    $("#ul_tab a").on("click", function (e) {
        $(this).tab("show");
    });
    //模态框的调用
    $("#modal_login").on("shown.bs.modal", function (e) {
        $("#input_loginUid").focus();
    });

    $("#main_body").attr("style", "min-height:" + ($(window).height() - 75) + "px;background-color:#444;");
    //判断用户是否登录
    if (localStorage.uid) {
        user.uid = localStorage.uid;
        user.login = true;
    }
    
    if (user.login) {
        $menu.show();
        $menu.text(user.uid);
    } else {
        $menu.text("");
        $menu.hide();
    }
    //缓存用户id
    var writeUser = function (uid) {
        localStorage.uid = uid;
    }

    var arrBusiness = [
        { "value": 1, "label": "投资银行" },
        { "value": 2, "label": "法律" },
        { "value": 3, "label": "审计" },
        { "value": 4, "label": "评估" },
        { "value": 5, "label": "商业银行" },
        { "value": 6, "label": "公司研究" },
        { "value": 7, "label": "二级市场投资" },
        { "value": 8, "label": "一级市场投资" },
        { "value": 9, "label": "企业经营" },
        { "value": 10, "label": "其他类型" }
    ];
    //e.data.b  ？？？
    var selectBusiness = function(e) {
        register.business = arrBusiness[e.data.b].value;
        $("#btn_business").html(arrBusiness[e.data.b].label + "&nbsp;<span class='caret'></span>");
    }
    for (i = 0; i < arrBusiness.length; i++) {
        var $a = $("<a href='javascript:void(0)'></a>");
        $a.text(arrBusiness[i].label);
        $a.bind("click", { "b": i }, function (e) {
            selectBusiness(e);
        });
        var $link = $("<li></li>");
        $link.append($a);
        $ulBusiness.append($link);
    }
//注册验证
    $("#btn_register").on("click", function() {
        var regUid = new RegExp("[A-Za-z0-9]{4,16}");
        register.uid = $("#input_registerUid").val();
        register.pwd = $("#input_registerPwd").val();
        register.chkpwd = $("#input_registerCheckPwd").val();
        register.email = $("#input_registerEmail").val();

        if (!register.uid || !regUid.test(register.uid)) {
            alert("用户名输入格式有误，请检查！");
            return false;
        }
        if (register.uid == "4~16位字母、数字") {
            alert("用户名不能为空！");
            return false;
        }

        if (register.chkpwd != register.pwd) {
            alert("两次密码输入不一致，请检查！");
            return false;
        }
        if (!register.email || register.email.length>45) {
            alert("请检查注册邮箱格式！");
            return false;
        }

        if (register.email == "接受验证邮件的邮箱") {
            alert("邮箱不能为空！");
            return false;
        }

        if (!register.pwd || register.pwd.length<8 || register.pwd.length>16) {
            alert("请检查密码格式！");
            return false;
        }
        var registerBody = {
            "uid": register.uid,
            "pwd": md5(register.uid + register.pwd),
            "business": register.business,
            "email": register.email
        }
        $.post("/api/Auth/Register", registerBody, function(result) {
            if (result.ResponseCode == 1) {
                $.post("/api/Auth/SendValidationEmail", registerBody);
                $("#tab_success").tab("show");
            } else if (result.ResponseCode == -1) {
                alert("对不起，该用户名已经有人注册，请更换后重新注册，谢谢！");
            } else if (result.ResponseCode == -2) {
                alert("对不起，该邮箱已经有人注册，请更换后重新注册，谢谢！");
            } else {
                alert("对不起，发生其他注册错误，请联系管理员，谢谢！");
            }
        });
    });
    //颜色修改，指示不明确，需要修改
    $("#input_registerCheckPwd").blur(function () {
        if (register.chkpwd != register.pwd) {
            $(this).attr("style", "background-color:MistyRose");
        } else if (register.chkpwd) {
            $(this).attr("style", "background-color:PaleGreen");
        }
    });

    $("#input_registerCheckPwd").focus(function () {
        $(this).attr("style", "background-color:White");
    });
    //用户登录
    var userLogin = function(market) {
        var loginBody = {
            "uid": user.uid,
            "pwd": md5(user.uid + user.pwd),
            "citadel": localStorage.citadel
        }
        if (typeof (localStorage.citadel) == "undefined") {
            localStorage.citadel = "";
        }
        user.uid = $("#input_loginUid").val();
        user.pwd = $("#input_loginPwd").val();

        if (user.uid == "用户名") {
            alert("用户名为空");
            return false;
        }
        $.post("/api/Auth/Login", loginBody, function (result) {
            if (result.ResponseCode == 1) {
                writeUser(user.uid);
                if (result.Citadel != "") {
                    localStorage.citadel = result.Citadel;
                }
                localStorage.token = result.ResponseMessage;
                $menu.show();
                $menu.text(user.uid);
                if (market == 1) {
                    if (isMobileDevice()) {
                        window.location.href = "/Home/SearchMainMobile";
                    } else {
                        window.location.href = "/Home/SearchMain";
                    }
                } else {
                    if (isMobileDevice()) {
                        window.location.href = "/Home/SearchOtcMobile";
                    } else {
                        window.location.href = "/Home/SearchOtc";
                    }
                }

            } else if (result.ResponseCode == -1) {
                alert("对不起，不存在这样的用户，请重试！");
            } else if (result.ResponseCode == -3) {
                alert("对不起，用户尚未激活，请通过验证邮件激活！");
            } else {
                alert("对不起，用户名密码不匹配，请重试！");
            }
        });
    }

    $("#btn_loginMain").on("click", function() {
        userLogin(1);
    });
    $("#btn_loginOtc").on("click", function () {
        userLogin(2);
    });

    $("#btn_logout").on("click", function () {
        $menu.text("");
        $menu.hide();
        user.uid = "";
        localStorage.token = "";
        writeUser("");
        window.location.href = "/";
    });

    $("#input_loginPwd").on("keyup", function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            userLogin();
        }
    });

    var site = 1;
    if (window.location.href.indexOf("Law") > 0) {
        site = 2;
    }
    //重置邮件
    $("#btn_validate").on("click", function () {
        user.forgetEmail = $("#input_forgetEmail").val();
        var forgetBody = {
            "email": user.forgetEmail
        }
        $.post("/api/Auth/ForgetPass", forgetBody, function(result) {
            if (result.ResponseCode == 1) {
                alert("重置邮件已经发到您的邮箱，请点击里面的链接完成重置步骤，谢谢！");
                $("#modal_forget").modal("hide");
            } else {
                alert("暂时无法重置，请重试！");
            }
        });
    });
});




