browser.storage.local.set({transactions: []});
browser.browserAction.setBadgeBackgroundColor({color: "#fa4747"});
browser.browserAction.setBadgeTextColor({color: "#ffffff"});
try {
  browser.runtime.onMessage.addListener((length, sender) => {
    if (length > 0) {
      browser.browserAction.setBadgeText({text: length.toString()});
    } else {
      browser.browserAction.setBadgeText({text: ""});
    }
  });
} catch (exc) {
  console.error(exc)
}
