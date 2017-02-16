$(document).ready(function () {

//公司代码检索，自动完成（类似于谷歌查询）
    $("#input_stockcode").typeahead({
        source: function (query, process) {
            var parameter = { "keyword": query };
            if (!query || query.length < 2) return false;
            $.post("/api/Disclosure/RetrieveMainCompany/", parameter, function (data) {
                process(data.Hints);
            });
        }
    });


    $("#btn_expandAll").click(function () {
        if ($(this).html() === "全部展开") {
            $("div.result-area.real").find("div.para.collapse").collapse("show");
            $(this).html("全部收起");
        } else {
            $("div.result-area.real").find("div.para.in").collapse("hide");
            $(this).html("全部展开");
        }
    });
//高级，单框搜索的切换
    var flagSingle = true;
    $("#btn_expandMulti").on("click", function () {
        if ($(this).text() == "高级") {
            $("#div_single").slideUp();
            $("#div_multi").slideDown();
            $(this).text("单框");
            flagSingle = false;
        } else {
            $("#div_multi").slideUp();
            $("#div_single").slideDown();
            $(this).text("高级");
            flagSingle = true;
        }
    });


    var i, j, k;

    //Search Result
    var results = {};
    results.count = 0; 
    results.pages = []; 
    results.hits = [];
    results.statNav = [];

    var news = [];

    var flagMt = 0;
    var flagPn = 1;
    var flagRf = 0;
    var flagAt = 6;
    var filters = [];
    var flagRt = 2;
    var flagMarket = 1;
    var flagWarm = true;
    var flagOnSearch = false;
    //var flagSynonym = false;

    var regSpan = new RegExp("【|】|\[|\]", "g");
    var regLawKeyword = new RegExp("[《》]|中华人民共和国", "g");

    var noticeType = new Array("年度报告", "半年度报告", "一季度报告", "三季度报告", "首次公开发行及上市", "配股", "增发", "可转债", "权证", "其他融资", "权益及限制出售股份",
    "股权变动", "交易", "股东大会", "澄清、风险、业绩预告", "特别处理及退市", "补充及更正", "中介机构报告", "上市公司制度", "其他重大事项", "债券公告", "投资者关系", "监事会公告", "董事会公告");

    var arrMarkets = new Array("全部市场类型", "沪市主板", "深市主板", "深市中小板", "深市创业板", "深市全部", "深市主板和中小板");

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

    //Add Market Selection
    var selectMarket = function (e) {
        flagMt = e.data.m;
        var $button = $("#btn_market");
        var $span = $("<span class='caret'></span>");
        $button.empty();
        $button.html(arrMarkets[e.data.m] + "&nbsp;");
        $button.append($span);
    };
    var $ulMarkets = $("#ul_markets");
    for (i = 0; i < arrMarkets.length; i++) {
        var $a = $("<a href='javascript:void(0)'></a>");
        $a.text(arrMarkets[i]);
        $a.bind("click", { "m": i }, function (e) {
            selectMarket(e);
        });
        var $link = $("<li></li>");
        $link.append($a);
        $ulMarkets.append($link);
    }

    var updateResultView = function () {
        $("#div_news").slideUp();
        var $temp = $("#div_result_0");
        $("div.result-area.real").remove();
        for (i = 0; i < results.hits.length; i++) {
            var $result = $temp.clone(true);
            $result.addClass("real");
            $result.removeClass("temp");
            $result.attr("id", "div_result_" + (i + 1));
            //Collapse
            $result.find("div").eq(0).attr("data-target", "#" + results.hits[i].id);
            //Company
            var $company = $result.find("a").eq(0);
            $company.attr("href", results.hits[i].source.Company);
            $company.text(results.hits[i].source.StockCode);
            //Title
            var $title = $result.find("a.title");
            $title.attr("href", results.hits[i].source.Href);
            $title.attr("title", results.hits[i].source.Title);
            $title.html(results.hits[i].short);
            //Source File
            $result.find("a.source").attr("href", results.hits[i].source.Url);
            //Span
            $result.find("span").eq(0).text(extractDate(results.hits[i].source.PublishDate));
            //Paragraph
            var $paragraphs = $result.find("div").eq(1);
            $paragraphs.attr("id", results.hits[i].id);
            for (j = 0; j < results.hits[i].highlights.length; j++) {
                var $para = $("<p class='para'></p>");
                $para.html(results.hits[i].highlights[j]);
                $paragraphs.append($para);
            }
            if (i == 0) {
                $paragraphs.removeClass("collapse");
                $paragraphs.addClass("in");
            }
            $result.hide();
            $result.insertAfter($("#div_result_" + i));
            $result.slideDown();
        }
    }

    var load;
    var updatePage = function () {
        $("#div_pages a.foot-page").remove();
        var $loadNext = $("#btn_loadNext");
        for (i = 0; i < results.pages.length; i++) {
            var $page = $("<a role='button' class='btn btn-default foot-page'></a>");
            $page.bind("click", { "p": results.pages[i] }, function (e) {
                load(e);
            });
            $page.text(results.pages[i]);
            if (results.pages[i] == flagPn) {
                $page.attr("style", "font-weight:bold");
            } else {
                $page.attr("style", "");
            }

            $page.insertBefore($loadNext);
        }
        var finalPage = Math.ceil(results.count / 20);
        if (results.pages[0] == 1) {
            $("#btn_loadPrior").addClass("disabled");
        } else {
            $("#btn_loadPrior").removeClass("disabled");
        }
        if (results.pages.length < 5 || results.pages[4] == finalPage) {
            $("#btn_loadNext").addClass("disabled");
        } else {
            $("#btn_loadNext").removeClass("disabled");

        }
    }

    var updateNewsView = function() {
        var $div = $("#div_news");
        var $ul = $div.find("ul").eq(0);

        $div.show();
        for (i = 0; i < news.length; i++) {
            var $li = $("<li role='presentation'></li>");
            var $aTab = $("<a class='tablist' href='javascript:void(0)' data-target='' role='tab'></a>");
            $aTab.attr("data-target", "#news_" + i);
            $aTab.html(news[i].Source);
            $aTab.bind("click", function() {
                $(this).tab("show");
            });
            $li.append($aTab);
            $ul.append($li);
            var $divSource = $("#div_news_content");
            var $divSourceNews;
            if (i == 0) {
                $li.addClass("active");
                $divSourceNews = $("<div role='tabpanel' class='tab-pane fade in active' style='padding-bottom:5px'></div>");
            } else {
                $divSourceNews = $("<div role='tabpanel' class='tab-pane fade' style='padding-bottom:5px'></div>");
            }
            $divSourceNews.attr("id", "news_" + i);
            for (j = 0; j < news[i].News.length; j++) {
                var $divPiece = $("<div style='margin: 5px 10px; padding-right:10px;'></div>");
                var $aPiece = $("<a href='' target='_blank' style='color: #222; font-size: 15px; vertical-align: middle; display: inline-block; margin: 7px 10px' title=''></a>");
                $aPiece.html(abbr(news[i].News[j].Title, 42, "..."));
                $aPiece.attr("href", news[i].News[j].Url);
                $aPiece.attr("title", news[i].News[j].Title);
                $divPiece.append($aPiece);
                var $spanDate = $("<span class='pull-right' style='margin-top: 8px; color: #222; display: inline-block;'></span>");
                $spanDate.html(news[i].News[j].PublishDate);
                $divPiece.append($spanDate);
                $divSourceNews.append($divPiece);
            }
            var $aSource = $("<a class='btn btn-default pull-right' role='button' href='' target='_blank' style='margin: 10px'></a>");
            $aSource.html("查看更多");
            $aSource.attr("href", news[i].LinkUrl);
            $divSourceNews.append($aSource);
            $divSource.append($divSourceNews);
            $div.append($divSource);
            $divSource.show();
        }
    }

    results.currentStatContent = [];
    var addFilter;
    var changeStatTab;
    var turnStatPage;
    var updateStatView = function () {
        var data = { "n": flagAt };
        changeStatTab({ "data": data });
        var $statPage, $statFooter;
        switch (flagAt) {
            case 1:
                $statPage = $("#div_industryStat").find("div.pbody");
                $statFooter = $("#div_industryStat").find("ul");
                $statPage.empty();
                if (results.currentStatContent.length == 0) break;
                for (i = 0; i < results.currentStatContent.length; i++) {
                    var industry = results.currentStatContent[i];
                    var $div = $("<div></div>");
                    //Parent Industry
                    var $parent = $("<div class='btn-group btn-group-justified'>");
                    var $button = $("<a role='button' data-toggle='collapse' class='btn btn-default filter' style='color: #444; padding: 3px; border-radius: 0; border-right: 0'><span class='glyphicon glyphicon-plus-sign' style='top: 2px'></span></a>");
                    $button.attr("data-target", "#" + industry.name);
                    $button.bind("click", function () {
                        var $span = $(this).find("span").eq(0);
                        if ($span.hasClass("glyphicon-plus-sign")) {
                            $span.removeClass("glyphicon-plus-sign");
                            $span.addClass("glyphicon-minus-sign");
                        } else {
                            $span.removeClass("glyphicon-minus-sign");
                            $span.addClass("glyphicon-plus-sign");
                        }
                    });
                    var $item = $("<a href='javascript:void(0)' class='btn btn-default filter' style='width:10%; text-align:left'></a>");
                    $item.text(industry.short);
                    $item.bind("click", {
                        "ff": 1,
                        "fv": industry.name,
                        "label": industry.name
                    }, function (e) {
                        addFilter(e);
                    });
                    var $count = $("<span class='badge pull-right'></span>");
                    $count.text(industry.count);
                    $count.prependTo($item);
                    $parent.append($button);
                    $parent.append($item);
                    $div.append($parent);
                    //Child Industry
                    var $child = $("<div class='panel-collapse collapse'>");
                    $child.attr("id", industry.name);
                    for (j = 0; j < industry.childs.length; j++) {
                        var childIndustry = industry.childs[j];
                        var $childItem = $("<a class='list-group-item filter' role='button' href='javascript:void(0)'></a>");
                        $childItem.html("&emsp;&emsp;" + childIndustry.childshort);
                        $childItem.bind("click", {
                            "ff": 11,
                            "fv": childIndustry.childname,
                            "label": childIndustry.childname
                        }, function (e) {
                            addFilter(e);
                        });
                        var $childCount = $("<span class='badge' style='background-color: white; color: #222222; border-style: solid; border-width: 1px; border-color: gray'></span>");
                        $childCount.text(childIndustry.childCount);
                        $childItem.append($childCount);
                        $child.append($childItem);
                    }
                    $div.append($child);
                    $statPage.append($div);
                }
                break;
            case 2:
                $statPage = $("#div_locationStat").find("div.pbody");
                $statFooter = $("#div_locationStat").find("ul");
                $statPage.empty();
                if (results.currentStatContent.length == 0) break;
                for (i = 0; i < results.currentStatContent.length; i++) {
                    $item = $("<a href='javascript:void(0)' class='list-group-item filter'></a>");
                    var province = results.currentStatContent[i];
                    $item.text(province.name);
                    $item.bind("click", {
                        "ff": 2,
                        "fv": province.name,
                        "label": province.name
                    }, function (e) {
                        addFilter(e);
                    });
                    $count = $("<span class='badge'></span>");
                    $count.text(province.count);
                    $count.prependTo($item);
                    $statPage.append($item);
                }
                break;
            case 3:
                $statPage = $("#div_companyStat").find("div.pbody");
                $statFooter = $("#div_companyStat").find("ul");
                $statPage.empty();
                if (results.currentStatContent.length == 0) break;
                for (i = 0; i < results.currentStatContent.length; i++) {
                    $item = $("<a href='javascript:void(0)' class='list-group-item filter'></a>");
                    var company = results.currentStatContent[i];
                    $item.text(company.name);
                    $item.bind("click", {
                        "ff": 3,
                        "fv": company.name,
                        "label": company.name
                    }, function (e) {
                        addFilter(e);
                    });
                    $count = $("<span class='badge'></span>");
                    $count.text(company.count);
                    $count.prependTo($item);
                    $statPage.append($item);
                }
                break;
            case 4:
                $statPage = $("#div_lawStat").find("div.pbody");
                $statFooter = $("#div_lawStat").find("ul");
                $statPage.empty();
                if (results.currentStatContent.length == 0) break;
                for (i = 0; i < results.currentStatContent.length; i++) {
                    var law = results.currentStatContent[i];
                    $div = $(" <div class='btn-group btn-group-justified'></div>");
                    $button = $("<a role='button' target='_blank' class='btn btn-default filter' style='color: #444; padding: 3px; border-radius: 0; border-right: 0'><span class='glyphicon glyphicon-circle-arrow-right' style='top: 2px'></span></a>");
                    $button.attr("href", "/Home/SearchLaw?title=" + law.keyword);
                    $item = $("<a href='javascript:void(0)' class='btn btn-default filter' style='width:10%; text-align:left'></a>");
                    $item.text(law.short);
                    $item.bind("click", {
                        "ff": 4,
                        "fv": law.name,
                        "label": law.name
                    }, function (e) {
                        addFilter(e);
                    });
                    $count = $("<span class='badge pull-right'></span>");
                    $count.text(law.count);
                    $count.prependTo($item);
                    $div.append($button);
                    $div.append($item);
                    $statPage.append($div);
                }
                break;
            case 6:
                $statPage = $("#div_noticeStat").find("div.pbody");
                $statFooter = $("#div_noticeStat").find("ul");
                $statPage.empty();
                if (results.currentStatContent.length == 0) break;
                for (i = 0; i < results.currentStatContent.length; i++) {
                    var notice = results.currentStatContent[i];
                    $item = $("<a href='javascript:void(0)' class='list-group-item filter'></a>");
                    $item.text(notice.chs);
                    $item.bind("click", {
                        "ff": 6,
                        "fv": notice.name,
                        "label": notice.chs
                    }, function (e) {
                        addFilter(e);
                    });
                    $count = $("<span class='badge'></span>");
                    $count.text(notice.count);
                    $count.prependTo($item);
                    $statPage.append($item);
                }
                break;
            default:
        }
        $statFooter.empty();
        for (i = 0; i < results.statNav.length; i++) {
            var $footLink = $("<a href='javascript:void(0)'></a>");
            $footLink.bind("click", { "n": results.statNav[i], "type": flagAt }, function (e) {
                turnStatPage(e);
            });
            $footLink.text(results.statNav[i]);
            if (results.statNav[i] == results.currentStatPage) {
                $footLink.attr("style", "font-weight:bold");
            } else {
                $footLink.attr("style", "");
            }
            var $wrapLink = $("<li></li>");
            $wrapLink.append($footLink);
            $statFooter.append($wrapLink);
        }
    }
    turnStatPage = function (e) {
        results.currentStatPage = e.data.n;
        results.currentStatContent = [];
        switch (e.data.type) {
            case 1:
                for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.industries.length) ; j++) {
                    results.currentStatContent.push(results.industries[j]);
                }
                break;
            case 2:
                for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.provinces.length) ; j++) {
                    results.currentStatContent.push(results.provinces[j]);
                }
                break;
            case 3:
                for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.companies.length) ; j++) {
                    results.currentStatContent.push(results.companies[j]);
                }
                break;
            case 4:
                for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.laws.length) ; j++) {
                    results.currentStatContent.push(results.laws[j]);
                }
                break;
            case 5:
                for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.qualifications.length) ; j++) {
                    results.currentStatContent.push(results.qualifications[j]);
                }
                break;
            case 6:
                for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.notices.length) ; j++) {
                    results.currentStatContent.push(results.notices[j]);
                }
                break;
        }
        updateStatView();
    }




    changeStatTab = function (e) {
        flagAt = e.data.n;
        results.statNav = [];
        results.currentStatContent = [];
        switch (e.data.n) {
            case 1://Industry
                for (i = 0; i < Math.ceil(results.industries.length / 10) ; i++) {
                    results.statNav.push(i + 1);
                }
                if (results.currentStatPage <= Math.ceil(results.industries.length / 10)) {
                    results.currentStatContent = [];
                    for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.industries.length) ; j++) {
                        results.currentStatContent.push(results.industries[j]);
                    }
                }
                break;
            case 2:
                for (i = 0; i < Math.ceil(results.provinces.length / 10) ; i++) {
                    results.statNav.push(i + 1);
                }
                if (results.currentStatPage <= Math.ceil(results.provinces.length / 10)) {
                    results.currentStatContent = [];
                    for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.provinces.length) ; j++) {
                        results.currentStatContent.push(results.provinces[j]);
                    }
                }
                break;
            case 3:
                for (i = 0; i < Math.ceil(results.companies.length / 10) ; i++) {
                    results.statNav.push(i + 1);
                }
                if (results.currentStatPage <= Math.ceil(results.companies.length / 10)) {
                    results.currentStatContent = [];
                    for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.companies.length) ; j++) {
                        results.currentStatContent.push(results.companies[j]);
                    }
                }
                break;
            case 4:
                for (i = 0; i < Math.ceil(results.laws.length / 10) ; i++) {
                    results.statNav.push(i + 1);
                }
                if (results.currentStatPage <= Math.ceil(results.laws.length / 10)) {
                    results.currentStatContent = [];
                    for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.laws.length) ; j++) {
                        results.currentStatContent.push(results.laws[j]);
                    }
                }
                break;
            case 6:
                for (i = 0; i < Math.ceil(results.notices.length / 10) ; i++) {
                    results.statNav.push(i + 1);
                }
                if (results.currentStatPage <= Math.ceil(results.notices.length / 10)) {
                    results.currentStatContent = [];
                    for (j = results.currentStatPage * 10 - 10; j < Math.min(results.currentStatPage * 10, results.notices.length) ; j++) {
                        results.currentStatContent.push(results.notices[j]);
                    }
                }
                break;
            default:
        }

        $("#tab" + flagAt).tab("show");
    }
    $("#tab1").bind("click", { "n": 1 }, function (e) {
        flagAt = 1;
        results.currentStatPage = 1;
        updateStatView();
    });
    $("#tab2").bind("click", { "n": 2 }, function (e) {
        flagAt = 2;
        results.currentStatPage = 1;
        updateStatView();
    });
    $("#tab3").bind("click", { "n": 3 }, function (e) {
        flagAt = 3;
        results.currentStatPage = 1;
        updateStatView();
    });
    $("#tab4").bind("click", { "n": 4 }, function (e) {
        flagAt = 4;
        results.currentStatPage = 1;
        updateStatView();
    });
    $("#tab6").bind("click", { "n": 6 }, function (e) {
        flagAt = 6;
        results.currentStatPage = 1;
        updateStatView();
    });


    //Fill Search Result
    var fillPage = function(data) {
        results.pages = [];
        $("#btn_loadPrior").addClass("disabled");
        if (results.count > 0) {
            if (results.count > 100) {
                results.pages.push(1, 2, 3, 4, 5);
                $("#btn_loadNext").removeClass("disabled");
            } else {
                for (i = 1; i <= Math.ceil(results.count / 20) ; i++) {
                    results.pages.push(i);
                }
                $("#btn_loadPrior").addClass("disabled");
                $("#btn_loadNext").addClass("disabled");
            }
        }
        updatePage();
    }

    var fillSearch = function (data) {
        if (data.Token == "no") {
            localStorage.uid = "";
            localStorage.token = "";
            alert("您的账户刚刚在另一浏览器登陆，请您重新登陆，谢谢！");
            window.location.href = "/";
            return;
        }
        localStorage.token = data.Token;
        results.count = data.Total || 0;
        results.hits = [];
        //Count
        var inHits = data.Hits || [];
        if (flagWarm) {
            $("#span_count").text("最新 " + formatThousand(results.count) + " 个结果");
            $("#div_result_count a").hide();
            $("#btn_expandAll").show();
        } else {
            $("#span_count").text("找到 " + formatThousand(results.count) + " 个结果");
            $("#div_result_count a").show();
        }

        for (i = 0; i < inHits.length; i++) {
            //Highlight for Content
            var highlights = [];
            for (j = 0; j < inHits[i].Highlight.Content.length; j++) {
                highlights.push(inHits[i].Highlight.Content[j]);
            }
            //For Title
            var displayedTitle = "";
            if (inHits[i].Highlight.Title.length > 0) {
                displayedTitle = abbrEm(inHits[i].Highlight.Title[0], 36, "...");
            } else {
                displayedTitle = abbr(inHits[i].Source.Title, 36, "...");
            }
            inHits[i].Source.Href = connotate(inHits[i].Source.Href + "&ss=" + $("#input_ss").val().replace(regSpan, "") + "&cm=" + $("#input_cm").val().replace(regSpan, "") + "&cs=" + $("#input_cs").val().replace(regSpan, ""));
            if (inHits[i].Source.StockCode == "预披露" || inHits[i].Source.StockCode == "监管") {
                inHits[i].Source.Company = "javascript:void(0)";
            } else {
                inHits[i].Source.Company = "/Home/Company?market=" + flagMarket + "&code=" + inHits[i].Source.StockCode + "&ticker=" + inHits[i].Source.StockTicker + "&key=";
            }
            results.hits.push({ "id": inHits[i].Id, "source": inHits[i].Source, "highlights": highlights, "short": displayedTitle });
        }
        updateResultView();
        updatePage();
    }

    //Fill Stat
    var fillStat = function (data) {
        if (data.Token == "no") {
            localStorage.token = "";
            localStorage.uid = "";
            return;
        }
        localStorage.token = data.Token;
        results.industries = [];
        results.provinces = [];
        results.companies = [];
        results.agencies = [];
        results.laws = [];
        results.notices = [];
        results.statNav = [];

        var shortName;
        var inAgg = data.Aggregations || [];
        for (i = 0; i < inAgg.length; i++) {
            switch (inAgg[i].AggKey) {
                case "parentIndustry":
                    for (j = 0; j < inAgg[i].Items.length; j++) {
                        var pushChildIndustry = [];
                        for (k = 0; k < inAgg[i].Items[j].S.Items.length; k++) {
                            pushChildIndustry.push({
                                "childname": inAgg[i].Items[j].S.Items[k].N,
                                "childcount": abbrNum(inAgg[i].Items[j].S.Items[k].C),
                                "childshort": abbr(inAgg[i].Items[j].S.Items[k].N, 10, "...")
                            });
                        }
                        results.industries.push({ "name": inAgg[i].Items[j].N, "count": abbrNum(inAgg[i].Items[j].C), "childs": pushChildIndustry, "short": abbr(inAgg[i].Items[j].N, 12, "...") });
                    }
                    break;
                case "province":
                    for (j = 0; j < inAgg[i].Items.length; j++) {
                        results.provinces.push({ "name": inAgg[i].Items[j].N, "count": abbrNum(inAgg[i].Items[j].C) });
                    }
                    break;
                case "notice":
                    for (j = 0; j < inAgg[i].Items.length; j++) {
                        var chs;
                        if (inAgg[i].Items[j].N == 30) {
                            chs = "预披露";
                        } else if (inAgg[i].Items[j].N == 40) {
                            chs = "监管文件";
                        } else {
                            chs = noticeType[parseInt(inAgg[i].Items[j].N) - 1];
                        }
                        results.notices.push({ "name": inAgg[i].Items[j].N, "count": abbrNum(inAgg[i].Items[j].C), "chs": chs });
                    }
                    break;
                case "law":
                    for (j = 0; j < inAgg[i].Items.length; j++) {
                        shortName = abbr(inAgg[i].Items[j].N, 11, "...》");
                        var keyword = inAgg[i].Items[j].N.replace(regLawKeyword, "");
                        results.laws.push({ "name": inAgg[i].Items[j].N, "count": abbrNum(inAgg[i].Items[j].C), "short": shortName, "keyword": keyword });
                    }
                    break;
                case "company":
                    for (j = 0; j < inAgg[i].Items.length; j++) {
                        results.companies.push({ "name": inAgg[i].Items[j].N, "count": abbrNum(inAgg[i].Items[j].C) });
                    }
                    break;
            }
        }
        results.currentStatPage = 1;
        updateStatView();
    }

    //Warmer
    var getWarm = function () {
        var newsBody = {
            "site": flagMarket,
            "token": localStorage.token
        }
        $.post("/api/User/RetrieveNews", newsBody, function(result) {
            news = result;
            updateNewsView();
        });
        var warmBody = {
            "market": flagMarket,
            "token": localStorage.token
        }
        $.post("/api/Disclosure/WarmUp", warmBody, function (result) {
            fillStat(result);
            $("#div_stat").slideDown("fast");
        });
    };

    var ieSearchDisclosureAdjust = function (body) {
        body.ss = (body.ss == "请输入标题或正文中的关键词（至少两个字），多个词以空格隔开") ? "" : body.ss;
        body.tm = (body.tm == "必含关键词...") ? "" : body.tm;
        body.ts = (body.ts == "可含关键词...") ? "" : body.ts;
        body.tn = (body.tn == "不含关键词...") ? "" : body.tn;
        body.cm = (body.cm == "必含关键词...") ? "" : body.cm;
        body.cs = (body.cs == "可含关键词...") ? "" : body.cs;
        body.cn = (body.cn == "不含关键词...") ? "" : body.cn;
        body.c = (body.c == "公司代码/简称") ? "" : body.c;
        return body;
    }

    var singleFilter = function (body) {
        if (flagSingle) {
            body.tm = "";
            body.ts = "";
            body.tn = "";
            body.cm = "";
            body.cs = "";
            body.cn = "";
        } else {
            body.ss = "";
        }
        return body;
    }
    var search = function () {

        if (flagOnSearch) {
            return false;
        } else {
            flagOnSearch = true;
        }
        wait("show");
        flagPn = 1;
        $("ul.typeahead").hide();

        //Empty Search
        if (!$("#input_ss").val() && !$("#input_stockcode").val() && flagSingle) {
            alert("至少要输入一个关键词（不包括不含）或公司名称");
            flagOnSearch = false;
            wait("hide");
            return false;
        }
        if (!$("#input_tm").val() && !$("#input_ts").val() && !$("#input_cm").val() && !$("#input_cs").val() && !$("#input_stockcode").val() && !flagSingle) {
            alert("至少要输入一个关键词（不包括不含）或公司名称");
            flagOnSearch = false;
            wait("hide");
            return false;
        }

        var body = $("#frm_search").serializeObject();
        body = ieSearchDisclosureAdjust(body);
        body = singleFilter(body);
        body.ds = decodeURI(body.ds);
        body.de = decodeURI(body.de);
        var extendBody = {
            "mt": flagMt,
            "pn": flagPn,
            "rf": flagRf,
            "at": flagAt,
            "ft": filters,
            "rt": flagRt,
            "market": flagMarket,
            "token": localStorage.token
        }
        $.extend(body, extendBody);
        $.post("/api/Disclosure/SearchDisclosure", body, function (data) {
            flagWarm = false;
            fillSearch(data);
            fillPage(data);
            $("#div_result").slideDown("fast");
            $("#btn_expandAll").text("全部展开");
            flagOnSearch = false;
            wait("hide");
            //Aggregation
            $.extend(body, { "rf": 2 });
            $.post("/api/Disclosure/SearchDisclosure", body, function (stat) {
                fillStat(stat);
                $("#div_stat").slideDown("fast");
            })
            .fail(function (error) {

            });
        })
        .fail(function (error) {

        });
    };
    $("#frm_search").on("submit", function (e) {
        e.preventDefault();
        search();
    });


    var sort = function (e) {
        flagPn = 1;
        flagRt = e.data.type;
        var body = $("#frm_search").serializeObject();
        body.ds = decodeURI(body.ds);
        body.de = decodeURI(body.de);
        body = ieSearchDisclosureAdjust(body);
        body = singleFilter(body);
        var extendBody = {
            "mt": flagMt,
            "pn": flagPn,
            "rf": flagRf,
            "at": flagAt,
            "ft": filters,
            "rt": flagRt,
            "market": flagMarket,
            "token": localStorage.token
        }
        $.extend(body, extendBody);
        wait("show");

        $.post("/api/Disclosure/SearchDisclosure", body, function (data) {
            flagWarm = false;
            fillSearch(data);
            fillPage(data);
            $("#btn_expandAll").text("全部展开");
            flagOnSearch = false;
            updateResultView();
            wait("hide");
        })
        .fail(function (error) {

        });
    }
    $("#btn_sortByBalance").on("click", { "type": 0 }, function (e) {
        sort(e);
    });
    $("#btn_sortByRelevance").on("click", { "type": 1 }, function (e) {
        sort(e);
    });
    $("#btn_sortByRecency").on("click", { "type": 2 }, function (e) {
        sort(e);
    });
    $("#btn_sortByFast").on("click", { "type": 3 }, function (e) {
        sort(e);
    });
    //排序颜色切换
    $("a.rank").on("click", function (e) {
        $("a.rank").attr("style", "");
        $(this).attr("style", "background-color: #444; color: white");

        e.preventDefault();
    });


    load = function (e) {
        flagPn = e.data.p;

        //Empty Search
        if (!$("#input_ss").val() && !$("#input_stockcode").val() && flagSingle) {
            alert("至少要输入一个关键词（不包括不含）或公司名称");
            flagOnSearch = false;
            wait("hide");
            return false;
        }
        if (!$("#input_tm").val() && !$("#input_ts").val() && !$("#input_cm").val() && !$("#input_cs").val() && !$("#input_stockcode").val() && !flagSingle) {
            alert("至少要输入一个关键词（不包括不含）或公司名称");
            flagOnSearch = false;
            wait("hide");
            return false;
        }

        var body = $("#frm_search").serializeObject();
        body.ds = decodeURI(body.ds);
        body.de = decodeURI(body.de);
        body = ieSearchDisclosureAdjust(body);
        body = singleFilter(body);

        var extendBody = {
            "mt": flagMt,
            "pn": flagPn,
            "rf": flagRf,
            "at": flagAt,
            "ft": filters,
            "rt": flagRt,
            "market": flagMarket,
            "token": localStorage.token
        }
        $.extend(body, extendBody);
        wait("show");

        $.post("/api/Disclosure/SearchDisclosure", body, function (data) {
            flagWarm = false;
            fillSearch(data);
            $("#btn_expandAll").text("全部展开");
            flagOnSearch = false;
            updateResultView();
            wait("hide");
        })
        .fail(function (error) {

        });
    };

    $("#btn_loadPrior").on("click", function () {
        var finalPage = Math.ceil(results.count / 20);
        if (results.pages[0] > 5) {
            var firstPage = results.pages[0] - 5;
            results.pages = [];
            for (i = firstPage; i < firstPage + 5; i++) {
                results.pages.push(i);
            }
        } else {
            results.pages = [];
            for (i = 1; i < Math.min(finalPage + 1, 6) ; i++) {
                results.pages.push(i);
            }
        }
        updatePage();
    });

    $("#btn_loadNext").on("click", function () {
        var lastPage = results.pages[results.pages.length - 1];
        var finalPage = Math.ceil(results.count / 20);
        if (finalPage > lastPage + 6) {
            results.pages = [];
            for (i = lastPage + 1; i < lastPage + 6; i++) {
                results.pages.push(i);
            }
        } else {
            results.pages = [];
            for (i = finalPage - Math.min(4, finalPage - 1) ; i <= finalPage; i++) {
                results.pages.push(i);
            }
        }
        updatePage();
    });

    $("#btn_loadFirst").on("click", function () {
        if (flagWarm) return;
        results.pages = [];
        if (results.count > 0) {
            if (results.count > 100) {
                results.pages.push(1, 2, 3, 4, 5);
            } else {
                for (i = 1; i < Math.ceil(results.count / 20) ; i++) {
                    results.pages.push(i);
                }
            }
        }
        updatePage();
        load(1);
    });

    $("#btn_lockStock").on("click", function () {
        var body = $("#frm_search").serializeObject();
        body = ieSearchDisclosureAdjust(body);
        body = singleFilter(body);
        body.ds = decodeURI(body.ds);
        body.de = decodeURI(body.de);
        var extendBody = {
            "mt": flagMt,
            "pn": flagPn,
            "rf": 3,
            "at": flagAt,
            "ft": filters,
            "rt": flagRt,
            "market": flagMarket,
            "token": localStorage.token
        }
        $.extend(body, extendBody);
        $("#span_lockStatus").text("锁定中...");
        $.post("/api/Disclosure/LockStock", body, function (result) {
            if (result > 0) {
                $("#btn_lockStock").text("更新公司范围");
                if (result == 100) {
                    $("#span_lockStatus").text("已锁定前100家");
                } else {
                    $("#span_lockStatus").text("已锁定" + result + "家");
                }
                $("#btn_cancelStock").removeClass("disabled");
            } else {
                $("#span_lockStatus").text("无公司锁定");
            }
        });
    });

    $("#btn_cancelStock").on("click", function () {
        var body = { "token": localStorage.token };
        $("#btn_cancelStock").text("撤销中...");
        $.post("/api/Disclosure/CancelStock", body, function (result) {
            if (result) {
                $("#btn_lockStock").text("锁定公司范围");
                $("#span_lockStatus").text("尚未锁定");
                $("#btn_cancelStock").text("撤销");
                $("#btn_cancelStock").addClass("disabled");
            }
        });
    });
    //刷新
    var refreshLock = function () {
        var body = { "token": localStorage.token };
        $.post("/api/Disclosure/CancelStock", body, function (result) {
            return;
        });
    }
    refreshLock();

    var applyFilters = function () {
        search();
        if (!$("#input_ss").val() && !$("#input_tm").val() && !$("#input_ts").val() && !$("#input_cm").val() && !$("#input_cs").val() && !$("#input_stockcode").val()) {
            return false;
        }
        $(".filter-label").addClass("color-main");
    }
    $("#btn_applyFilters").bind("click", function () {
        applyFilters();
    });

    $("#input_ss").on("keyup", function (e) {
        if (e.keyCode == 13) {

            e.preventDefault();
            applyFilters();
        }
    });
    //删除筛选的类别
    var deleteFilter = function (e) {
        var ff = e.data.ff;
        var fv = e.data.fv;
        for (i = 0; i < filters.length; i++) {
            if (filters[i].ff === ff && filters[i].fv === fv) {
                filters.splice(i, 1);
            }
        }
        //Update View
        $("#" + ff + "_" + fv.replace(" ", "_")).remove();
        $(".filter-label").removeClass("color-main");
        if (filters.length == 0) {
            $("#div_filter").slideUp();
            $("#btn_applyFilters").addClass("disabled");
            $("#btn_resetFilters").addClass("disabled");
            //search();
        }
    }
    //添加筛选的类别
    addFilter = function (e) {
        var ff = e.data.ff;
        var fv = e.data.fv;
        var label = e.data.label;
        for (i = 0; i < filters.length; i++) {
            if (filters[i].ff === ff && filters[i].fv === fv) {
                return false;
            }
        }
        filters.push({ "ff": ff, "fv": fv, "label": label });
        //Update Filter View
        var $div = $("<div class='btn-group btn-group-sm filter-gp' role='group'></div>");
        $div.attr("id", ff + "_" + fv.replace(" ", "_"));
        var $filter = $("<a class='btn btn-default filter-label' role='button'></a>");
        $filter.text(label);
        $div.append($filter);
        var $delete = $("<a class='btn btn-default filter-close' role='button' href='javascript:void(0)'>&times;</a>");
        $delete.bind("click", { "ff": ff, "fv": fv }, function (ee) {
            deleteFilter(ee);
        });

        $div.append($delete);
        $("#div_filter").append($div);
        if (filters.length == 1) $("#div_filter").slideDown();
        $("#btn_applyFilters").removeClass("disabled");
        $("#btn_resetFilters").removeClass("disabled");
    }



    //输入框内容进行重置
    var reset = function () {
        $("#input_ds").val(defaultDayStart.getFullYear() + "/" + (defaultDayStart.getMonth() + 1) + "/" + defaultDayStart.getDate());
        $("#input_de").val(today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate());
        $("#input_ss").val("");
        $("#input_tm").val("");
        $("#input_ts").val("");
        $("#input_tn").val("");
        $("#input_cm").val("");
        $("#input_cs").val("");
        $("#input_tn").val("");
        $("#input_stockcode").val("");
    };
    $("#btn_reset").bind("click", function () {
        reset();
    });

    //清除筛选的类型
    var resetFilters = function () {
        filters = [];
        $("#div_filter").hide();
        $("#btn_applyFilters").addClass("disabled");
        $("#btn_resetFilters").addClass("disabled");
        search();
    };
    $("#btn_resetFilters").bind("click", function () {
        resetFilters();
    });

    //Paras in Url
    var parameters = decodeURI(window.location);
    var regSs = new RegExp("ss=([^&]*)");
    if (parameters.match(regSs)) {
        $("#input_ss").val(parameters.match(regSs)[1]);
        var regTm = new RegExp("tm=([^&]*)");
        var regTs = new RegExp("ts=([^&]*)");
        var regTn = new RegExp("tn=([^&]*)");
        var regCm = new RegExp("cm=([^&]*)");
        var regCs = new RegExp("cs=([^&]*)");
        var regCn = new RegExp("cn=([^&]*)");
        var regC = new RegExp("c=([^&]*)");
        var regDs = new RegExp("ds=([^&]*)");
        var regDe = new RegExp("de=([^&]*)");
        var regMt = new RegExp("mt=([^&]*)");
        var regMarket = new RegExp("market=([^&]*)");
        var regFf = new RegExp("ff=([^&]*)");
        if (parameters.match(regTm)) $("#input_tm").val(parameters.match(regTm)[1]);
        if (parameters.match(regTs)) $("#input_ts").val(parameters.match(regTs)[1]);
        if (parameters.match(regTn)) $("#input_tn").val(parameters.match(regTn)[1]);
        if (parameters.match(regCm)) $("#input_cm").val(parameters.match(regCm)[1]);
        if (parameters.match(regCs)) $("#input_cs").val(parameters.match(regCs)[1]);
        if (parameters.match(regCn)) $("#input_cn").val(parameters.match(regCn)[1]);
        if (parameters.match(regC)) $("#input_stockcode").val(parameters.match(regC)[1]);

        if ($("#input_tm").val() || $("#input_ts").val() || $("#input_tn").val() || $("#input_cm").val() || $("#input_cs").val() || $("#input_cn").val()) {
            flagSingle = false;
            $("#btn_expandMulti").trigger("click");
        }

        if (parameters.match(regDs)) $("#input_ds").val(parameters.match(regDs)[1]);
        if (parameters.match(regDe)) $("#input_de").val(parameters.match(regDe)[1]);
        if (parameters.match(regMt)) {
            flagMt = parseInt(parameters.match(regMt)[1]);
            //trigger view update
        }
        if (parameters.match(regMarket)) flagMarket = parseInt(parameters.match(regMarket)[1]);
        if (parameters.match(regFf)) {
            var filterStrings = parameters.match(regFf)[1].split(";");
            for (i = 0; i < filterStrings.length; i++) {
                if (filterStrings[i] != "") {
                    var comp = filterStrings[i].split(":");
                    if (comp[0] != "6") {
                        filters.push({ "ff": comp[0], "fv": comp[1], "label": comp[1] });
                    } else {
                        var chs = "";
                        var nType = parseInt(comp[1]);
                        if (nType == 30) {
                            chs = "预披露";
                        } else if (nType == 40) {
                            chs = "监管文件";
                        } else {
                            chs = noticeType[nType];
                        }
                        filters.push({ "ff": comp[0], "fv": comp[1], "label": chs });
                    }
                }
            }
            if (filters.length > 0) {
                if (parameters.match(regFf)[1] != "") {
                    $("#div_filter").show();
                    $("#btn_applyFilters").removeClass("disabled");
                    $("#btn_resetFilters").removeClass("disabled");
                }
            }
        }
        applyFilters();
    } else {
        getWarm();
    }

});
