try {
  browser;
  localget = (keys, promise) => browser.storage.local.get(keys).then(promise);
  // Not supported in chrome
  browser.browserAction.setBadgeTextColor({color: "#ffffff"});
} catch (ex) {
  browser = chrome;
  localget = (keys, promise) => browser.storage.local.get(keys, promise);
}
Sentry.init({
  dsn: 'https://91b83206aef54757af38f2e6a391f17f@o349958.ingest.sentry.io/5498617',
  integrations: [
    new Sentry.Integrations.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
  release: "santry-trace-extension@" + browser.runtime.getManifest().version,
});
browser.browserAction.setBadgeBackgroundColor({color: "#fa4747"});
// Specifically for dev
const DEV_REGEX = /.*dev\.getsentry\.net.*/;
let traceId = null;
let errorId = null;
let transactions = [];

function updateBadge(length, transaction) {
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
  transactions = data.transactions;
  updateBadge(data.transactions.length)
  browser.storage.local.set(data);
});
browser.runtime.onMessage.addListener((length, sender) => {
  updateBadge(0);
  transactions = [];
})

function transactionListener(event) {
  const decoder = new TextDecoder("utf-8");
  const rawBody = decoder.decode(new Uint8Array(event.requestBody.raw[0].bytes));
  const sentryEvent = JSON.parse(rawBody.split("\n", 3)[2]);
  let newTraceId = sentryEvent?.contexts?.trace?.trace_id;
  localget(["prodRegex", "stagingRegex"], function(data) {
    const url = sentryEvent?.request?.url || "";
    sentryEvent.isValid = (data.prodRegex ? url.match(new RegExp(data.prodRegex)) : false) || (data.stagingRegex ? url.match(new RegExp(data.stagingRegex)) : false);
    sentryEvent.isLocal = url.match(new RegExp(DEV_REGEX));

    if (sentryEvent.isValid || sentryEvent.isLocal) {
      if (newTraceId !== traceId) {
        traceId = newTraceId;
        transactions.unshift(sentryEvent)
        browser.storage.local.set({"transactions": transactions, "recentTransactions": transactions.slice(0, 10)});
        updateBadge(transactions.length);
      }
    }
  });
}

function errorListener(event) {
  const decoder = new TextDecoder("utf-8");
  const rawBody = decoder.decode(new Uint8Array(event.requestBody.raw[0].bytes));
  const sentryEvent = JSON.parse(rawBody);
  let newEventId = sentryEvent?.event_id;
  localget(["prodRegex", "stagingRegex"], function(data) {
    const url = sentryEvent?.request?.url || "";
    sentryEvent.isValid = (data.prodRegex ? url.match(new RegExp(data.prodRegex)) : false) || (data.stagingRegex ? url.match(new RegExp(data.stagingRegex)) : false);
    sentryEvent.isLocal = url.match(new RegExp(DEV_REGEX));

    if (sentryEvent.isValid || sentryEvent.isLocal) {
      if (newEventId !== errorId) {
        errorId = newEventId;
        transactions.unshift(sentryEvent)
        browser.storage.local.set({"transactions": transactions, "recentTransactions": transactions.slice(0, 10)});
        updateBadge(transactions.length);
      }
    }
  });
}

browser.webRequest.onBeforeRequest.addListener(
  transactionListener,
  {urls: ["*://*.sentry.io/*/envelope/*", "*://dev.getsentry.net/*/envelope/*"]},
  ["requestBody"]
);

browser.webRequest.onBeforeRequest.addListener(
  errorListener,
  {urls: ["*://*.sentry.io/*/store/*", "*://dev.getsentry.net/*/store/*"]},
  ["requestBody"]
);
