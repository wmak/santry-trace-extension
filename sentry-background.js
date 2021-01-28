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

function isValidUrl(url, data) {
  return (data.prodRegex ? url.match(new RegExp(data.prodRegex)) : false) || (data.stagingRegex ? url.match(new RegExp(data.stagingRegex)) : false);
}

function transactionListener(event) {
  const decoder = new TextDecoder("utf-8");
  const rawBody = decoder.decode(new Uint8Array(event.requestBody.raw[0].bytes));
  const sentryEvent = JSON.parse(rawBody.split("\n", 3)[2]);
  let newTraceId = sentryEvent?.contexts?.trace?.trace_id;
  localget(["prodRegex", "stagingRegex"], function(data) {
    const url = sentryEvent?.request?.url || "";
    const isValid = isValidUrl(url, data);
    const isLocal = url.match(new RegExp(DEV_REGEX));

    if (isValid || isLocal) {
      if (newTraceId !== traceId) {
        const transactionEvent = {
          environment: sentryEvent.environment,
          event_id: sentryEvent.event_id,
          isValid: isValid,
          isLocal: isLocal,
          timestamp: sentryEvent.timestamp,
          trace_id: newTraceId,
          transaction: sentryEvent.transaction,
        }
        traceId = newTraceId;
        transactions.unshift(transactionEvent)
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
    const isValid = isValidUrl(url, data);
    const isLocal = url.match(new RegExp(DEV_REGEX));

    if (isValid || isLocal) {
      if (newEventId !== errorId) {
        const errorEvent = {
          environment: sentryEvent.environment,
          event_id: newEventId,
          isLocal: isLocal,
          isValid: isValid,
          timestamp: sentryEvent.timestamp,
          exception: sentryEvent.exception,
          type: sentryEvent?.exception?.values[0]?.type,
        }
        errorId = newEventId;
        transactions.unshift(errorEvent)
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
