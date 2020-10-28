try {
  browser;
  localget = (keys, promise) => browser.storage.local.get(keys).then(promise);
  // Not supported in chrome
  browser.browserAction.setBadgeTextColor({color: "#ffffff"});
} catch (ex) {
  browser = chrome;
  localget = (keys, promise) => browser.storage.local.get(keys, promise);
}
try {
  browser.browserAction.setBadgeBackgroundColor({color: "#fa4747"});
} catch (ex) {
}
// Specifically for dev
const DEV_REGEX = /.*dev\.getsentry\.net.*/;
let traceId = null;

function updateBadge(length) {
  if (length > 0) {
    browser.browserAction.setBadgeText({text: length.toString()});
  } else {
    browser.browserAction.setBadgeText({text: ""});
  }
}
localget("transactions", function(data) {
  if (data.transactions === undefined) {
    data.transactions = [];
  }
  updateBadge(data.transactions.length)
  browser.storage.local.set(data);
});
browser.runtime.onMessage.addListener((length, sender) => updateBadge(length))

function listener(event) {
  const decoder = new TextDecoder("utf-8");
  const rawBody = decoder.decode(new Uint8Array(event.requestBody.raw[0].bytes));
  const sentryEvent = JSON.parse(rawBody.split("\n", 3)[2]);
  let newTraceId = sentryEvent?.contexts?.trace?.trace_id;
  localget(["transactions", "prodRegex", "stagingRegex"], function(data) {
    const url = sentryEvent?.request?.url || "";
    sentryEvent.isValid = (data.prodRegex ? url.match(new RegExp(data.prodRegex)) : false) || (data.stagingRegex ? url.match(new RegExp(data.stagingRegex)) : false);
    sentryEvent.isLocal = url.match(new RegExp(DEV_REGEX));

    if (sentryEvent.isValid || sentryEvent.isLocal) {
      if (newTraceId !== traceId) {
        traceId = newTraceId;
        if (data.transactions === undefined) {
          data.transactions = [];
        }
        if (data.transactions.length == 999) {
          data.transactions.pop();
        }
        data.transactions.unshift(sentryEvent)
        browser.storage.local.set(data);
        const length = data.transactions.length;
        updateBadge(data.transactions.length);
      }
    }
  });
}

browser.webRequest.onBeforeRequest.addListener(
  listener,
  {urls: ["*://*.sentry.io/*/envelope/*", "*://dev.getsentry.net/*/envelope/*"]},
  ["requestBody"]
);
