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
