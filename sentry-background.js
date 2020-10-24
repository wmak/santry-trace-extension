browser.storage.local.set({transactions: []});
browser.browserAction.setBadgeBackgroundColor({color: "#fa4747"});
browser.browserAction.setBadgeTextColor({color: "#ffffff"});
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
browser.storage.local.get(["transactions"]).then(function(data) {
  updateBadge(data.transactions.length);
});

function listener(event) {
  const decoder = new TextDecoder("utf-8");
  const rawBody = decoder.decode(new Uint8Array(event.requestBody.raw[0].bytes));
  const sentryEvent = JSON.parse(rawBody.split("\n", 3)[2]);
  let newTraceId = sentryEvent?.contexts?.trace?.trace_id;
  browser.storage.local.get(["transactions", "prodRegex", "stagingRegex"]).then(function(data) {
    const url = sentryEvent?.request?.url;
    sentryEvent.isValid = url.match(new RegExp(data.prodRegex)) || url.match(new RegExp(data.stagingRegex));
    sentryEvent.isLocal = url.match(new RegExp(DEV_REGEX));

    if (sentryEvent.isValid || sentryEvent.isLocal) {
      if (newTraceId !== traceId) {
        traceId = newTraceId;
        if (data.transactions === undefined) {
          data.transactions = [];
        }
        if (data.transactions.length == 50) {
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
