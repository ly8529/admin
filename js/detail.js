$(document).ready(function () {
    $("#ul_tabs a").on("click", function (e) {
        if (!$(this).hasClass("pdf")) {
            $(this).tab("show");
        }
    });

    $(function () {
        $("[data-toggle=\"tooltip\"]").tooltip();
    });

    //Adjust Positions
    var windowHeight = $(window).height();
    $("#div_pages").height(windowHeight - 170);
    $("div.tab-content").height(windowHeight - 190);
    $("#iframe_originalPdf").height(windowHeight - 170);
    $("#iframe_originalPdf").width(780);

    var i, j;
    var detail = {};
    var regKey = new RegExp("key=([^&]+)(?=&market)");
    var regMarket = new RegExp("market=([0-9]+)");
    var parameters = decodeURI(window.location);
    var strKey = parameters.match(regKey)[1];
    var strMarket = parameters.match(regMarket)[1];
    detail.key = strKey;
    var flagMarket = parseInt(strMarket);

    var regLawKeyword = new RegExp("[《》]|中华人民共和国", "g");
    var regSs = new RegExp("ss=([^&]*)");
    var regCm = new RegExp("cm=([^&]*)");
    var regCs = new RegExp("cs=([^&]*)");
    var strSs, strCm, strCs;
    if (parameters.match(regSs) != null) {
        strSs = parameters.match(regSs)[1];
    } else {
        strSs = "";
    }
    if (parameters.match(regCm) != null) {
        strCm = parameters.match(regCm)[1];
    } else {
        strCm = "";
    }
    if (parameters.match(regCs) != null) {
        strCs = parameters.match(regCs)[1];
    } else {
        strCs = "";
    }
    var oldKeywords = "";
    detail.keywords = [];
    if (strSs) detail.keywords.push(strSs);
    if (strCm) detail.keywords.push(strCm);
    if (strCs) detail.keywords.push(strCs);

    oldKeywords = detail.keywords.join(" ");
    $("#input_keywords").val(oldKeywords);
    var filterKeywords;
    $("#input_keywords").on("keyup", function ($event) {
        if ($event.keyCode == 13) {
            if (oldKeywords != $("#input_keywords").val()) {
                oldKeywords = $("#input_keywords").val();
                filterKeywords();
            } else {
                $("#btn_nextMatch").trigger("click");
            }
        }
    });

    var wait = function (option) {
        if (option === "show") {
            $(".wait").show();
        } else {
            $(".wait").hide();
        }
    }
    wait("show");

    var detailBody = {
        "key": detail.key,
        "market": flagMarket,
        "uid": localStorage.uid,
        "client": 1
    };

    detail.pages = [];
    detail.shownPages = [];
    var totalPage = 0;


    detail.notices = [];
    var updateRecentNoticeView = function() {
        var $div = $("#div_recentNotice");
        $div.empty();
        for (i = 0; i < detail.notices.length; i++) {
            var $notice = $("<a class='list-group-item' role='button' target='_blank'></a>");
            $notice.attr("title", detail.notices[i].source.Title);
            $notice.attr("href", detail.notices[i].url);
            $notice.html(detail.notices[i].source.PublishDate.replace(regDate, "") + "&emsp;" + detail.notices[i].short);
            $div.append($notice);
        }
    };

    var updateCompanyInfoView = function() {
        var $ul = $("#div_companyInfo ul");
        var $liRegion = $("<li class='list-group-item'></li>");
        $liRegion.text("所属地域：" + detail.province);
        $ul.append($liRegion);
        var $liParentIndustry = $("<li class='list-group-item'></li>");
        $liParentIndustry.text("一级行业：" + detail.parentIndustry);
        $ul.append($liParentIndustry);
        var $liIndustry = $("<li class='list-group-item'></li>");
        $liIndustry.text("二级行业：" + detail.industry);
        $ul.append($liIndustry);
    }

    var updateLawsView = function() {
        var $div = $("#div_Law");
        $div.empty();
        for (i = 0; i < detail.laws.length; i++) {
            var $law = $("<a class='list-group-item' role='button' target='_blank'></a>");
            $law.attr("title", detail.laws[i].title);
            $law.attr("href", "/Home/SearchLaw?title=" + detail.laws[i].keyword);
            $law.text(detail.laws[i].short);
            $div.append($law);
        }
    }

    detail.subTitles = [];
    var navPages = [];
    var updateSubTitlesView = function () {
        if (detail.subTitles.length > 0) {
            for (j = 0; j < detail.subTitles.length; j++) {
                detail.subTitles[j].filter = false;
                if (detail.subTitles[j].childs.length > 0) {
                    for (var k = 0; k < detail.subTitles[j].childs.length; k++) {
                        detail.subTitles[j].childs[k].childfilter = false;
                    }
                }
            }
        }
        if (navPages.length > 0 && detail.subTitles.length > 0) {
            for (i = 0; i < navPages.length; i++) {
                var matchPage = navPages[i];
                var flgParent = false;
                var flgChild = false;
                for (j = 0; j < detail.subTitles.length - 1; j++) {
                    if (detail.subTitles[j].page <= matchPage && detail.subTitles[j + 1].page >= matchPage) {
                        detail.subTitles[j].filter = true;
                        if (detail.subTitles[j].childs.length > 0) {
                            for (k = 0; k < detail.subTitles[j].childs.length - 1; k++) {
                                if (detail.subTitles[j].childs[k].childpage <= matchPage && detail.subTitles[j].childs[k + 1].childpage >= matchPage) {
                                    detail.subTitles[j].childs[k].childfilter = true;
                                    flgChild = true;
                                    break;
                                }
                            }
                            if (!flgChild) {
                                detail.subTitles[j].childs[detail.subTitles[j].childs.length - 1].childfilter = true;
                            }
                        }
                        flgParent = true;
                        break;
                    }
                }
                if (!flgParent) {
                    detail.subTitles[detail.subTitles.length - 1].filter = true;
                }
            }
        }

        if (detail.subTitles.length == 0) {
            $("#div_noSubTitles").show();
            $("#div_subTitles").hide();
        } else {
            $("#div_noSubTitles").hide();
            $("#div_subTitles").empty();
            for (i = 0; i < detail.subTitles.length; i++) {
                var $divCombo = $("<div></div>");
                var $divFirstSubTitle = $("<div class='btn-group btn-group-justified content-border'>");
                if (detail.subTitles[i].filter) {
                    $divFirstSubTitle.addClass("match-page");
                } else {
                    $divFirstSubTitle.removeClass("match-page");
                }
                var $aCollapse = $("<a role='button' data-toggle='collapse' href='javascript:void(0)' class='btn btn-default filter' style='color: #444; padding: 3px; border-radius: 0'></a>");
                $aCollapse.attr("data-target", "#div_subTitle" + detail.subTitles[i].id);
                if (detail.subTitles[i].childs.length == 0) {
                    $aCollapse.html("&emsp;");
                } else {
                    $aCollapse.html("<span class='glyphicon glyphicon-plus-sign' style='top: 2px'></span>");
                }
                $aCollapse.bind("click", function () {
                    var $span = $(this).find("span");
                    if ($span.hasClass("glyphicon-plus-sign")) {
                        $span.removeClass("glyphicon-plus-sign");
                        $span.addClass("glyphicon-minus-sign");
                    } else {
                        $span.removeClass("glyphicon-minus-sign");
                        $span.addClass("glyphicon-plus-sign");
                    }
                });

                $divFirstSubTitle.append($aCollapse);
                var $aSubTitle = $("<a role='button' class='btn btn-default content-list' style='width: 15%; text-align: left; border-radius: 0;'></a>");
                $aSubTitle.attr("title", detail.subTitles[i].parent);
                $aSubTitle.attr("href", "#p" + detail.subTitles[i].para);
                $aSubTitle.text(detail.subTitles[i].short);
                $divFirstSubTitle.append($aSubTitle);
                $divCombo.append($divFirstSubTitle);
                if (detail.subTitles[i].childs.length > 0) {
                    var $divSecondSubTitle = $("<div class='panel-collapse collapse'></div>");
                    $divSecondSubTitle.attr("id", "div_subTitle" + detail.subTitles[i].id);
                    for (j = 0; j < detail.subTitles[i].childs.length; j++) {
                        var $aChild = $("<a role='button' class='list-group-item filter content-border' style='border-radius: 0'></a>");
                        $aChild.attr("title", detail.subTitles[i].childs[j].child);
                        $aChild.attr("href", "#p" + detail.subTitles[i].childs[j].para);
                        $aChild.html("&emsp;&emsp;" + detail.subTitles[i].childs[j].childshort);
                        $aChild.attr("title", detail.subTitles[i].childs[j].child);
                        if (detail.subTitles[i].childs[j].childfilter) {
                            $aChild.addClass("match-nd-page");
                        } else {
                            $aChild.removeClass("match-nd-page");
                        }
                        $divSecondSubTitle.append($aChild);
                    }
                    $divCombo.append($divSecondSubTitle);
                }
                $("#div_subTitles").append($divCombo);
            }
        }
    }

    var currentMatch = 0;
    var pageTops = [];
    //Add Em Tag
    var highlightKeyword = function(pageHtml) {
        if (detail.keywords.length > 0) {
            var regKeywords = new RegExp(detail.keywords.join("|"), "gi");
            if (regKeywords.test(pageHtml)) {
                var result = pageHtml.replace(regKeywords, function (str) {
                    return "<em class='content'>" + str + "</em>";
                    //todo: avoid tags
                });
                return result;
            } else {
                return "";
            }
        }
        return "";
    }

    var scrollPage = 1;
    $("#div_pages").on("scroll", function (e) {
        var currentTop = $(this).scrollTop();
        var toPage = -1;
        for (i = 0; i < pageTops.length; i++) {
            if (currentTop + $(this).height() / 2 < pageTops[i]) {
                toPage = i;
                break;
            }
        }
        if (toPage >= 0) {
            scrollPage = toPage;
            if (navPages.length > 0) {
                var flgEnd = true;
                for (i = 0; i < navPages.length; i++) {
                    if (scrollPage < navPages[i]) {
                        currentMatch = i;
                        flgEnd = false;
                        break;
                    }
                }
                if (flgEnd) currentMatch = navPages.length;
                $("#btn_nav").html("页匹配&nbsp;" + currentMatch + "/" + navPages.length);
            }
        }
    });
   

    var gotoPage = function (p) {
        scrollPage = p;
        $("#div_pages").scrollTop(pageTops[p - 1]);
    }
    //向前匹配
    $("#btn_prevMatch").on("click", function() {
        if (navPages.length > 0) {
            for (i = 0; i < navPages.length; i++) {
                if (navPages[i] >= scrollPage && i != 0) {
                    gotoPage(navPages[i - 1]);
                    currentMatch = i;
                    return;
                }
            }
            if (navPages[0] < scrollPage) {
                gotoPage(navPages[0]);
            }
            $("#btn_nav").html("页匹配&nbsp;" + currentMatch + "/" + navPages.length);
        }

    });
    //向后匹配
    $("#btn_nextMatch").on("click", function() {
        if (navPages.length > 0) {
            for (i = 0; i < navPages.length; i++) {
                if (navPages[i] > scrollPage) {
                    gotoPage(navPages[i]);
                    currentMatch = i + 1;
                    return;
                }
            }
            $("#btn_nav").html("页匹配&nbsp;" + currentMatch + "/" + navPages.length);
        }
    });
    //操作键盘的前后按键来进行前后匹配
    $(document).on("keydown", function (e) {
        if (e.keyCode == 37) {
            $("#btn_prevMatch").trigger("click");
        } else if (e.keyCode == 39) {
            $("#btn_nextMatch").trigger("click");
        }
    });

    var loadPagesView = function() {
        var $div = $("#div_pages");
        pageTops = [];
        for (i = 0; i < detail.pages.length; i++) {
            var $page = $("<div class='bs-callout color-edge' style='padding: 50px;'></div>");
            $page.attr("id", "page" + i);
            var pageHtml = highlightKeyword(detail.pages[i].PageContent);
            if (pageHtml) {
                $page.html(pageHtml);
                navPages.push(i + 1);
            } else {
                $page.html(detail.pages[i].PageContent);
            }
            $div.append($page);
            pageTops.push($page.position().top);
        }
        //Nav
        if (navPages.length > 0) {
            gotoPage(navPages[0]);
            currentMatch = 1;
            $("#btn_nav").html("页匹配&nbsp;" + currentMatch + "/" + navPages.length);
        } else {
            gotoPage(1);
            currentMatch = 0;
            $("#btn_nav").html("暂无匹配");
        }
    }
    
    filterKeywords = function () {
        if ($("#input_keywords").val()) {
            detail.keywords = [];
            var words = $("#input_keywords").val().split(" ");
            for (i = 0; i < words.length; i++) {
                if (words[i]) {
                    detail.keywords.push(words[i]);
                }
            }
        }

        navPages = [];
        if (detail.keywords.length > 0) {
            for (i = 0; i < detail.pages.length; i++) {
                var $page = $("#page" + i);
                var pageHtml = highlightKeyword(detail.pages[i].PageContent);
                if (pageHtml) {
                    $page.html(pageHtml);
                    navPages.push(i + 1);
                } else {
                    $page.html(detail.pages[i].PageContent);
                }
            }
        } else {
            for (i = 0; i < detail.pages.length; i++) {
                $page = $("#page" + i);
                pageHtml = detail.pages[i].PageContent;
                $page.html(pageHtml);
            }
        } 
        updateSubTitlesView();
    }

    $("#btn_highlight").on("click", function() {
        filterKeywords();
    });

    $.post("/api/Disclosure/RetrieveDetail", detailBody, function (result) {
        if (result.Hits.length == 0) {
            //没有返回结果
            $("#btn_company").text("错误");
            $("#span_title").text(result.Message);
            $("#div_detail").hide();
            return false;
        }
        detail.code = result.Hits[0].Source.StockCode;
        detail.title = result.Hits[0].Source.Title;
        detail.ticker = result.Hits[0].Source.StockTicker;
        if (detail.code == "预披露") {
            detail.company = "";
        } else {
            detail.company = "/Home/Company?market=" + flagMarket + "&code=" + detail.code + "&ticker=" + detail.ticker + "&key=";
        }

        detail.province = result.Hits[0].Source.Province;
        detail.parentIndustry = result.Hits[0].Source.ParentIndustry;
        detail.industry = result.Hits[0].Source.Industry;

        detail.publishDate = result.Hits[0].Source.PublishDate;
        detail.pages = result.Hits[0].Source.Pages;
        detail.url = result.Hits[0].Source.Url;
        $("#btn_openSource").attr("href", detail.url);
        $("#btn_company").attr("href", detail.company);
        $("#btn_company").text(detail.code);
        $("#span_title").html(detail.title + "&emsp;" + extractDate(detail.publishDate));

        detail.laws = [];
        detail.subTitles = [];

        if (result.Hits[0].Source.FileType == 3) {
            $("#div_html").removeClass("active");
            $("#iframe_originalPdf").attr("src", detail.url);
            $("#div_ocr").addClass("active");
        } else {
            for (i = 0; i < result.Hits[0].Source.RelevantLaws.length; i++) {
                var keyword = result.Hits[0].Source.RelevantLaws[i].LawTitle.replace(regLawKeyword, "");
                detail.laws.push({ "keyword": keyword, "title": result.Hits[0].Source.RelevantLaws[i].LawTitle, "short": abbr(result.Hits[0].Source.RelevantLaws[i].LawTitle, 15, "...》") });
            }
            detail.rawUrl = result.Hits[0].Source.Url;
            if (result.Hits[0].Source.SubTitles.length > 0) {
                var currentFirstLevel = "";
                for (i = 0; i < result.Hits[0].Source.SubTitles.length; i++) {
                    var subId = "sub" + result.Hits[0].Source.SubTitles[i].Sd;
                    if (result.Hits[0].Source.SubTitles[i].Stx[0] == "" && result.Hits[0].Source.SubTitles[i].Stx.length == 2) {
                        detail.subTitles.push({ "id": subId, "parent": result.Hits[0].Source.SubTitles[i].Stx[1], "short": abbr(result.Hits[0].Source.SubTitles[i].Stx[1], 17, "..."), "page": result.Hits[0].Source.SubTitles[i].Sn, "para":result.Hits[0].Source.SubTitles[i].Sd, "childs": [], "filter": false });
                    } else if (result.Hits[0].Source.SubTitles[i].Stx[0] != "" && result.Hits[0].Source.SubTitles[i].Stx.length == 1) {
                        detail.subTitles.push({ "id": subId, "parent": result.Hits[0].Source.SubTitles[i].Stx[0], "short": abbr(result.Hits[0].Source.SubTitles[i].Stx[0], 17, "..."), "page": result.Hits[0].Source.SubTitles[i].Sn, "para":result.Hits[0].Source.SubTitles[i].Sd, "childs": [], "filter": false });
                        currentFirstLevel = result.Hits[0].Source.SubTitles[i].Stx[0];
                    } else if (result.Hits[0].Source.SubTitles[i].Stx[0] != "" && result.Hits[0].Source.SubTitles[i].Stx.length == 2) {
                        if (result.Hits[0].Source.SubTitles[i].Stx[0] == currentFirstLevel) {
                            var lastSubTitle = detail.subTitles.pop();
                            lastSubTitle.childs.push({ "child": result.Hits[0].Source.SubTitles[i].Stx[1], "childpage": result.Hits[0].Source.SubTitles[i].Sn, "para":result.Hits[0].Source.SubTitles[i].Sd, "childshort": abbr(result.Hits[0].Source.SubTitles[i].Stx[1], 15, "..."), "childfilter": false });
                            detail.subTitles.push(lastSubTitle);
                        } else {
                            detail.subTitles.push({ "id": subId, "parent": result.Hits[0].Source.SubTitles[i].Stx[0], "short": abbr(result.Hits[0].Source.SubTitles[i].Stx[0], 17, "..."), "page": result.Hits[0].Source.SubTitles[i].Sn, "para":result.Hits[0].Source.SubTitles[i].Sd, "childs": [{ "child": result.Hits[0].Source.SubTitles[i].Stx[1], "childpage": result.Hits[0].Source.SubTitles[i].Sn, "para":result.Hits[0].Source.SubTitles[i].Sd, "childshort": abbr(result.Hits[0].Source.SubTitles[i].Stx[1], 20, "..."), "childfilter": false }], "filter": false });
                        }
                    }
                }
            }
            for (i = 0; i < detail.pages.length; i++) {
                detail.pages[i].PageContent = "<p align=\"center\"><b>第" + detail.pages[i].PageNo + "页</b></p><br />" + detail.pages[i].PageContent;
            }
            totalPage = detail.pages.length;
            updateLawsView();
            updateCompanyInfoView();
            loadPagesView();
            filterKeywords();
        }

        //邻近公告
        var adjacentBody = {
            "cd": detail.code,
            "pd": detail.publishDate,
            "market": flagMarket
        };


        $.post("/api/Disclosure/RetrieveAdjacent", adjacentBody, function(data) {
            detail.notices = [];
            var hits = data.Hits || [];
            if (hits.length > 0) {
                for (j = 0; j < hits.length; j++) {
                    var hit = hits[j];
                    if (hit.Source.Title != detail.title) {
                        var shortTitle = abbr(hit.Source.Title, 16, "...");
                        detail.notices.push({ "id": hit.Id, "source": hit.Source, "short": shortTitle, "url": hit.Source.Href });
                    }
                }
            }
            updateRecentNoticeView();
        });
        wait("hide");
    });

    detail.fav = {};
    detail.fav.suggests = [];
    detail.favExist = "1";
    detail.fav.cat = "";
    detail.fav.cmt = "";
    $("#p_favTitle").text(detail.title);

    $("#btn_addFav").on("click", function() {
        detail.fav.cat = $("#input_favCat").val();
        detail.fav.cmt = $("#txt_favCmt").val();
        var favBody = {
            "token": localStorage.token,
            "key": detail.key,
            "cat": detail.fav.cat,
            "cmt": detail.fav.cmt,
            "market": flagMarket,
            "type": detail.favExist,
            "title": detail.title,
            "url": detail.rawUrl,
            "code": detail.code,
            "ticker": detail.ticker,
            "date": detail.publishDate
        };
        $.post("/api/Disclosure/AddFavourite", favBody, function(result) {
            if (result) {
                $("#span_fav").removeClass("glyphicon-heart-empty");
                $("#span_fav").addClass("glyphicon-heart");
                $("#span_fav_text").text("已收藏");
                $("#modal_fav").modal("hide");
                if (detail.fav.suggests.length > 0) {
                    var strComp = detail.fav.cat.split(" ");
                    for (i = 0; i < strComp.length; i++) {
                        var flgSug = false;
                        for (j = 0; j < detail.fav.suggests.length; j++) {
                            if (strComp[i] == detail.fav.suggests[j]) {
                                flgSug = true;
                                break;
                            }
                        }
                        if (!flgSug) {
                            detail.fav.suggests.push(strComp[i]);
                        }
                    }
                }
                detail.favExist = "2";
            } else {
                $("#modal_fav").modal("hide");
            }
        });
    });

    var checkFav = function () {
        var favBody = {
            "uid": localStorage.uid,
            "key": detail.key,
            "market": flagMarket
        };
        $.post("/api/Disclosure/CheckFavourite", favBody, function(result) {
            if (result.Existed) {
                $("#span_fav").removeClass("glyphicon-heart-empty");
                $("#span_fav").addClass("glyphicon-heart");
                detail.fav.cat = result.Cat;
                $("#input_favCat").val(detail.fav.cat);
                detail.fav.cmt = result.Cmt;
                $("#txt_favCmt").val(detail.fav.cmt);
            }
        });

    }
    checkFav();

    var addSuggest = function (e) {
        if (!detail.fav.cat) {
            detail.fav.cat = e.data.sug;
            $("#input_favCat").val(detail.fav.cat);
            return;
        }
        var strComp = detail.fav.cat.split(" ");
        var flgSug = false;
        for (i = 0; i < strComp.length; i++) {
            if (e.data.sug == strComp[i]) {
                flgSug = true;
            }
        }
        if (!flgSug) {
            detail.fav.cat = detail.fav.cat + " " + e.data.sug;
            $("#input_favCat").val(detail.fav.cat);
        }
    }

    $("#btn_fav").on("click", function () {
        if (detail.fav.suggests.length > 0) return;
        var catBody = {
            "uid": localStorage.uid
        };
        $.post("/api/Disclosure/RetrieveCategories", catBody, function(result) {
            detail.fav.suggests = [];
            if (result.length == 0) return;
            var $div = $("#div_detailSuggests");
            $div.empty();
            for (i = 0; i < result.length; i++) {
                detail.fav.suggests.push(result[i]);
                var $suggest = $("<a class='btn btn-default panel-label' style='margin-right: 10px'></a>");
                $suggest.text(result[i]);
                $suggest.bind("click", { "sug": result[i] }, function(e) {
                    addSuggest(e);
                });
                $div.append($suggest);
            }
        });
    });

    $("a.detail-font").on("click", function() {
        $("a.detail-font").removeClass("color-info");
        $(this).addClass("color-info");
        if ($(this).text() == "雅黑") {
            $("#div_pages").css("font-family", "'open_sansregular', 'Microsoft YaHei'");
        } else {
            $("#div_pages").css("font-family", "'open_sansregular', 'SimSun'");
        }
        localStorage.fontFamily = $(this).text();
    });

    $("a.detail-size").on("click", function () {
        $("a.detail-size").removeClass("color-info");
        $(this).addClass("color-info");
        if ($(this).text() == "大号") {
            $("#div_pages").css("font-size", "16px");
        } else {
            $("#div_pages").css("font-size", "14px");
        }
        localStorage.fontSize = $(this).text();
    });

    if (localStorage.fontFamily) {
        if (localStorage.fontFamily == "雅黑") {
            $("#div_pages").css("font-family", "'open_sansregular', 'Microsoft YaHei'");
            $("#btn_font_yahei").addClass("color-info");
        } else {
            $("#div_pages").css("font-family", "'open_sansregular', 'SimSun'");
            $("#btn_font_sun").addClass("color-info");
        }
    } else {
        $("#btn_font_yahei").addClass("color-info");
    }

    if (localStorage.fontSize) {
        if (localStorage.fontSize == "大号") {
            $("#div_pages").css("font-size", "16px");
            $("#btn_font_big").addClass("color-info");
        } else {
            $("#div_pages").css("font-size", "14px");
            $("#btn_font_small").addClass("color-info");
        }
    } else {
        $("#btn_font_small").addClass("color-info");
    }

});
