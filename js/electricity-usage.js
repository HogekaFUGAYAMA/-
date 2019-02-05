$(function() {
    // 表示をリセットする（画面描画後処理）
    resetView();

    // 日付をもとに一覧を生成する
    $(".date").change(function() {
        var from, to;
        switch($(this).attr("id")) {
            case "d-from":
                from = new Date($(this).val());
                to = calcDateTo(from);
                break;
            case "d-to":
                from = new Date($("#d-from").val());
                to = new Date($(this).val());
                break;
            default:
                // 何もしない
                break;
        }
        createTabl(from, to);
    });

    // 表示をリセットする
    $("#reset").click(function() {
        resetView();
        return false;
    });

    // メーター数から使用量を算出する
    $(document).on("change", ".meter", function() {
        calcUsage($(this));
        calcAveUsage();
    });
});

// 表示をリセットする
function resetView() {
    $("#d-from, #d-to").val("");
    $("#eu-tbl").html("");
    $("#subtraction, #average, #co2").text("");
}

// 一覧を生成する
function createTabl(from, to) {
    var tbl = $("#eu-tbl");
    tbl.html("");

    var idx = 0;
    var date = new Date(from);
    while(date < to) {
        date = addDate(from, idx++);

        var row = $("<tr>");
        // No.
        var cell = $("<td>").text(idx);
        row.append(cell);
        // 日付
        var y = date.getFullYear();
        var m = ("00" + (date.getMonth() + 1)).slice(-2);
        var d = ("00" + date.getDate()).slice(-2);
        var day = "日月火水木金土"[date.getDay()];
        cell = $("<td>").text(y + "/" + m + "/" + d + "(" + day + ")");
        row.append(cell);
        /*
        // 天気（Dark Sky APIを使いたい）
        cell = $("<td>");
        row.append(cell);
        */
        // メーター数
        var input = $("<input>").attr({
            "type": "number",
            "step": 0.1,
            "min": 0.0,
            "class": "meter",
            "data-meter-idx": idx
        });
        cell = $("<td>").append(input);
        row.append(cell);
        // 使用量
        cell = $("<td>").attr({
            "class": "usage",
            "data-usage-idx": idx
        });
        row.append(cell);
        tbl.append(row);
    }
}

// 日付（from）から日付（to）を算出する
function calcDateTo(from) {
    var to = addDate(from, 7);
    var y = to.getFullYear();
    var m = ("00" + (to.getMonth() + 1)).slice(-2);
    var d = ("00" + to.getDate()).slice(-2);
    $("#d-to").val(y + "-" + m + "-" + d);
    return to;
}

// 日付に日数を足す
function addDate(date, addDays) {
    return new Date(
        date.getFullYear(), date.getMonth(), date.getDate() + addDays,
        date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}

// 使用量を算出する
function calcUsage(elm) {
    var idx = elm.data("meter-idx");
    var currentVal = elm.val();

    while(--idx > 0) {
        var val = $("[data-meter-idx=" + idx + "]").val();
        var usage = "";
        if (val.length !== 0) {
            var usage = (currentVal * 10 - val * 10) / 10;
            currentVal = val;
        }
        $("[data-usage-idx=" + idx + "]").text(usage);
    }
}

// 使用量の平均等を算出する
function calcAveUsage() {
    var minVal, maxVal, minIdx, maxIdx;
    var arr = new Object;
    $("[data-meter-idx]").each(function() {
        var elm = $(this);
        var val = elm.val();
        var idx = elm.data("meter-idx");
        if (val !== "" && val > 0) {
            if (minVal === undefined) {
                minVal = val;
                minIdx = idx;
                maxVal = val;
                maxIdx = idx;
            } else if (Math.min(minVal, val) !== Number(minVal)) {
                minVal = val;
                minIdx = idx;
            } else if (Math.max(maxVal, val) === Number(val)) {
                maxVal = val;
                maxIdx = idx;
            }
        }
    });

    // ア. 差引
    var sub = (maxVal * 10 - minVal * 10) / 10;
    $("#subtraction").text(sub);
    // イ. 1日の平均使用量
    var ave = 0;
    if (sub !== 0) {
        var days = maxIdx - minIdx;
        ave = Math.round(sub / days * 10) / 10;
    }
    $("#average").text(ave);
    // ウ. 1日平均CO2排出量
    var co2 = ave * 10 * 36 / 1000;
    $("#co2").text(co2);
}
