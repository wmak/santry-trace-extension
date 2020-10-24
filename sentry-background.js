browser.storage.local.set({transactions: []});
browser.browserAction.setBadgeBackgroundColor({color: "#fa4747"});
browser.browserAction.setBadgeTextColor({color: "#ffffff"});
browser.webNavigation.onDOMContentLoaded.addListener(function (event) {
  browser.tabs.sendMessage(event.tabId, {});
});
browser.webNavigation.onHistoryStateUpdated.addListener(function (event) {
  browser.tabs.sendMessage(event.tabId, {});
});
try {
  browser.runtime.onMessage.addListener((length, sender) => {
    if (length > 0) {
      browser.browserAction.setBadgeText({text: length.toString()});
    } else {
      browser.browserAction.setBadgeText({text: ""});
    }
  });
} catch (exc) {
}
browser.webRequest.onBeforeRequest.addListener(
  function (event) {
    var decoder = new TextDecoder("utf-8");
    var rawBody = decoder.decode(new Uint8Array(event.requestBody.raw[0].bytes));
    console.log(event.requestBody.raw);
  },
  {urls: ["*://*.sentry.io/*/envelope/*"]},
  ["requestBody"]
);
