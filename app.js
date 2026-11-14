/**
 * よりそう 支援依頼 LIFF フォーム
 * LIFF ID: 2012611374-Vn57eys9
 *
 * 送信は、トーク内なら liff.sendMessages で構造化テキストを投稿する。
 * トーク外・外部ブラウザ・送信失敗時は line.me/R/oaMessage/@065boblz で
 * 公式アカウントのトークを開き、同じ本文を入力欄に入れる。
 * 既存の Messaging API Webhook → ルーティンがこれを受信して受付番号を返す。
 */
(function () {
  "use strict";

  var LIFF_ID = "2012611374-Vn57eys9";
  var MESSAGE_HEADER = "【支援依頼フォーム】";

  var SHUSHIN_FIELDS = [
    "pickupPlace",
    "pickupTime",
    "hospital",
    "department",
    "appointmentTime",
  ];

  var state = {
    ready: false,
    inClient: false,
    data: null,
    sending: false,
  };

  var $ = function (id) {
    return document.getElementById(id);
  };

  function todayJST() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function showScreen(id) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].hidden = screens[i].id !== id;
    }
    window.scrollTo(0, 0);
  }

  function setError(fieldId, message) {
    var input = $(fieldId);
    var field = input.closest(".field");
    var err = field.querySelector(".field-error");
    field.classList.add("invalid");
    if (err) {
      err.hidden = !message;
      err.textContent = message || "";
    }
  }

  function clearError(fieldId) {
    var input = $(fieldId);
    if (!input) return;
    var field = input.closest(".field");
    if (!field) return;
    field.classList.remove("invalid");
    var err = field.querySelector(".field-error");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
  }

  function valueOf(id) {
    var el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  function isShushin(type) {
    return type === "受診同行";
  }

  function isNoPreferredDate() {
    var el = $("noPreferredDate");
    return !!(el && el.checked);
  }

  function toggleNoPreferredDate() {
    var noDate = isNoPreferredDate();
    var input = $("preferredDate");
    if (!input) return;
    input.disabled = noDate;
    if (noDate) {
      input.value = "";
      clearError("preferredDate");
    }
  }

  function preferredDateLabel(data) {
    if (data.noPreferredDate) return "希望日なし";
    return data.preferredDate || "";
  }

  function toggleConditional() {
    var type = valueOf("supportType");
    var shushin = $("fields-shushin");
    var other = $("fields-other");
    if (!type) {
      shushin.hidden = true;
      other.hidden = true;
      return;
    }
    shushin.hidden = !isShushin(type);
    other.hidden = isShushin(type);
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return parts[0] + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日（" + weekday + "）";
  }

  function formatTime(hhmm) {
    return hhmm || "";
  }

  function collect() {
    return {
      requester: valueOf("requester"),
      clientName: valueOf("clientName"),
      supportType: valueOf("supportType"),
      noPreferredDate: isNoPreferredDate(),
      preferredDate: isNoPreferredDate() ? "" : valueOf("preferredDate"),
      pickupPlace: valueOf("pickupPlace"),
      pickupTime: valueOf("pickupTime"),
      hospital: valueOf("hospital"),
      department: valueOf("department"),
      appointmentTime: valueOf("appointmentTime"),
      startTimePlace: valueOf("startTimePlace"),
      notes: valueOf("notes"),
    };
  }

  function validate(data) {
    var errors = [];
    function req(id, label, val) {
      clearError(id);
      if (!val) errors.push({ id: id, message: label + "を入力してください。" });
    }

    req("requester", "依頼者", data.requester);
    req("clientName", "利用者名", data.clientName);
    req("supportType", "支援の種類", data.supportType);
    clearError("preferredDate");
    if (data.noPreferredDate) {
      /* 希望日なしは日付なしで送信可 */
    } else {
      req("preferredDate", "希望日", data.preferredDate);
    }

    if (isShushin(data.supportType)) {
      req("pickupPlace", "お迎え先", data.pickupPlace);
      req("pickupTime", "お迎え時間", data.pickupTime);
      req("hospital", "病院名", data.hospital);
      req("department", "受診科", data.department);
      req("appointmentTime", "予約時間", data.appointmentTime);
    } else if (data.supportType) {
      req("startTimePlace", "開始時間・場所", data.startTimePlace);
    }

    errors.forEach(function (e) {
      setError(e.id, e.message);
    });
    return errors;
  }

  /**
   * ルーティンがパースする送信テキスト。先頭行は固定の見出し。
   * 日付は YYYY-MM-DD、時刻は HH:MM（24時間）。値に改行が含まれる場合は空白に置換。
   */
  function oneLine(s) {
    return String(s || "").replace(/[\r\n]+/g, " ").trim();
  }

  function buildMessage(data) {
    var lines = [
      MESSAGE_HEADER,
      "依頼者：" + oneLine(data.requester),
      "利用者名：" + oneLine(data.clientName),
      "支援の種類：" + oneLine(data.supportType),
      "希望日：" + oneLine(preferredDateLabel(data)),
    ];
    if (isShushin(data.supportType)) {
      lines.push("お迎え先：" + oneLine(data.pickupPlace));
      lines.push("お迎え時間：" + oneLine(data.pickupTime));
      lines.push("病院名：" + oneLine(data.hospital));
      lines.push("受診科：" + oneLine(data.department));
      lines.push("予約時間：" + oneLine(data.appointmentTime));
    } else {
      lines.push("開始時間・場所：" + oneLine(data.startTimePlace));
    }
    if (data.notes) {
      lines.push("支援内容：");
      lines.push(String(data.notes).trim());
    } else {
      lines.push("支援内容：（なし）");
    }
    return lines.join("\n");
  }

  function renderSummary(data) {
    var rows = [
      ["依頼者", data.requester],
      ["利用者名", data.clientName],
      ["支援の種類", data.supportType],
      ["希望日", data.noPreferredDate ? "希望日なし" : formatDate(data.preferredDate) + "\n" + data.preferredDate],
    ];
    if (isShushin(data.supportType)) {
      rows.push(["お迎え先", data.pickupPlace]);
      rows.push(["お迎え時間", formatTime(data.pickupTime)]);
      rows.push(["病院名", data.hospital]);
      rows.push(["受診科", data.department]);
      rows.push(["予約時間", formatTime(data.appointmentTime)]);
    } else {
      rows.push(["開始時間・場所", data.startTimePlace]);
    }
    rows.push(["支援内容・備考", data.notes || "（なし）"]);

    var dl = $("confirm-summary");
    dl.innerHTML = "";
    rows.forEach(function (row) {
      var wrap = document.createElement("div");
      var dt = document.createElement("dt");
      dt.textContent = row[0];
      var dd = document.createElement("dd");
      dd.textContent = row[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      dl.appendChild(wrap);
    });
  }

  function fillProfile(profile) {
    var input = $("requester");
    if (input && !input.value && profile && profile.displayName) {
      input.value = profile.displayName;
    }
  }

  function initFormChrome() {
    $("preferredDate").min = todayJST();
    $("supportType").addEventListener("change", toggleConditional);
    $("noPreferredDate").addEventListener("change", toggleNoPreferredDate);
    toggleConditional();
    toggleNoPreferredDate();

    $("request-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = collect();
      var errors = validate(data);
      if (errors.length) {
        var first = $(errors[0].id);
        if (first) {
          first.focus();
          first.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      state.data = data;
      renderSummary(data);
      $("send-error").hidden = true;
      $("send-error").className = "send-error";
      $("confirm-out-of-line").hidden = canSendInChat();
      showScreen("screen-confirm");
    });

    $("btn-back").addEventListener("click", function () {
      showScreen("screen-form");
    });

    $("btn-send").addEventListener("click", onSend);
    $("btn-close").addEventListener("click", function () {
      if (window.liff && liff.isInClient && liff.isInClient()) {
        liff.closeWindow();
      } else {
        showScreen("screen-form");
      }
    });
    $("btn-retry").addEventListener("click", function () {
      window.location.reload();
    });
  }

  var OA_MESSAGE_BASE = "https://line.me/R/oaMessage/@065boblz/?";
  var OA_MESSAGE_MAX_LEN = 2000;
  var CHAT_CONTEXT_TYPES = { utou: true, group: true, room: true, square_chat: true };

  function canSendInChat() {
    if (!state.inClient || !window.liff || !liff.sendMessages) return false;
    var ctx = liff.getContext ? liff.getContext() : null;
    var type = ctx && ctx.type;
    return !!(type && CHAT_CONTEXT_TYPES[type]);
  }

  function truncateMessageForOa(text) {
    if ((OA_MESSAGE_BASE + encodeURIComponent(text)).length <= OA_MESSAGE_MAX_LEN) {
      return text;
    }

    var marker = "支援内容：";
    var idx = text.lastIndexOf(marker);
    var head;
    var body;
    if (idx < 0) {
      head = "";
      body = text;
    } else {
      head = text.slice(0, idx + marker.length);
      body = text.slice(idx + marker.length);
      if (body.charAt(0) === "\n") {
        head += "\n";
        body = body.slice(1);
      }
    }

    var lo = 0;
    var hi = body.length;
    var best = head + "…";
    if ((OA_MESSAGE_BASE + encodeURIComponent(best)).length > OA_MESSAGE_MAX_LEN) {
      var cut = text;
      while (cut.length && (OA_MESSAGE_BASE + encodeURIComponent(cut + "…")).length > OA_MESSAGE_MAX_LEN) {
        cut = cut.slice(0, -1);
      }
      return cut + "…";
    }
    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2);
      var candidate = head + body.slice(0, mid) + "…";
      if ((OA_MESSAGE_BASE + encodeURIComponent(candidate)).length <= OA_MESSAGE_MAX_LEN) {
        best = candidate;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return best;
  }

  function showFallbackGuidance() {
    var errEl = $("send-error");
    errEl.className = "send-hint";
    errEl.textContent = "トーク画面に移動します。内容を確認して送信ボタンを押してください。";
    errEl.hidden = false;
  }

  function openOaMessage(text) {
    var url = OA_MESSAGE_BASE + encodeURIComponent(truncateMessageForOa(text));
    showFallbackGuidance();
    if (state.inClient && window.liff && liff.openWindow) {
      try {
        liff.openWindow({ url: url, external: false });
        return;
      } catch (e) {
        /* fall through to location.href */
      }
    }
    window.location.href = url;
  }

  function onSend() {
    if (state.sending || !state.data) return;
    var message = buildMessage(state.data);
    var errEl = $("send-error");
    errEl.hidden = true;
    errEl.className = "send-error";

    if (!canSendInChat()) {
      openOaMessage(message);
      return;
    }

    state.sending = true;
    $("btn-send").disabled = true;
    $("btn-send").textContent = "送信中…";

    liff
      .sendMessages([{ type: "text", text: message }])
      .then(function () {
        showScreen("screen-done");
      })
      .catch(function () {
        openOaMessage(message);
      })
      .finally(function () {
        state.sending = false;
        $("btn-send").disabled = false;
        $("btn-send").textContent = "送信する";
      });
  }

  function showInitError(message) {
    $("error-message").textContent = message;
    showScreen("screen-error");
  }

  function start() {
    initFormChrome();

    if (!window.liff) {
      showInitError("LINEの部品を読み込めませんでした。通信状況をご確認のうえ、再読み込みしてください。");
      return;
    }

    liff
      .init({ liffId: LIFF_ID })
      .then(function () {
        state.inClient = !!liff.isInClient();
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        return liff.getProfile().then(
          function (profile) {
            fillProfile(profile);
          },
          function () {
            /* プロフィールが取れなくても手入力できる */
          }
        );
      })
      .then(function () {
        if (!liff.isLoggedIn()) return;
        state.ready = true;
        showScreen("screen-form");
      })
      .catch(function (err) {
        var detail = (err && (err.message || err.code)) || "";
        showInitError(
          "フォームを初期化できませんでした。" +
            (detail ? "（" + detail + "）" : "") +
            " LIFFのエンドポイントURLが、このページのURLと一致しているか確認してください。"
        );
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
