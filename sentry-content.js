let traceId = null;
browser.runtime.onMessage.addListener(function () {
  try {
    Hub = window.wrappedJSObject.Sentry.getCurrentHub();
    transaction = Hub.getScope().getTransaction();
    newTraceId = transaction.traceId;
    name = transaction.name;
    host = Hub.getClient().getDsn().host;
    date = new Date();
    if (newTraceId !== traceId) {
      traceId = newTraceId;
      browser.storage.local.get("transactions").then(function(data) {
        if (data.transactions === undefined) {
          data.transactions = [];
        }
        if (data.transactions.length == 50) {
          data.transactions.pop();
        }
        data.transactions.unshift({traceId, host, name, date})
        browser.storage.local.set(data);
        browser.runtime.sendMessage(data.transactions.length);
      });
    }
  } catch (exc) {
  }
});
