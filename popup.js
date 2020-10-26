try {
  browser;
  localget = (keys, promise) => browser.storage.local.get(keys).then(promise);
  localset = (keys, promise) => browser.storage.local.set(keys).then(promise);
} catch (ex) {
  browser = chrome;
  localget = (keys, promise) => browser.storage.local.get(keys, promise);
  localset = (keys, promise) => browser.storage.local.set(keys, promise);
}
ENV = {
  dev: {
    root_url: "http://dev.getsentry.net:8000/"
  },
  valid: {
    root_url: "https://sentry.io/"
  }
}
function pad(value) {
  return String(value).padStart(2, 0);
};
function formatDateParam(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00`
}
function onOpen() {
  localget(["transactions", "slug"], function(data) {
    const content = document.getElementById("popup-content");
    content.innerHTML = "";
    if (data.transactions === undefined) {
      data.transactions = [];
      localset(data);
    }
    for (const element of data.transactions) {
      const env = element.environment;
      const timestamp = element.timestamp * 1000.0;
      const start = encodeURIComponent(formatDateParam(new Date(timestamp - (5*60*1000))));
      const end = encodeURIComponent(formatDateParam(new Date(timestamp + (5*60*1000))));
      const root_url = element.isValid ? ENV.valid.root_url : ENV.dev.root_url
      const url = `${root_url}organizations/${data.slug}/discover/results/?field=transaction&field=event.type&field=project&field=transaction.duration&field=timestamp&environment=${element.environment}&name=Transactions+by+Volume&query=trace%3A${element.contexts.trace.trace_id}&sort=-timestamp&start=${start}&end=${end}&interval=5s`
      content.innerHTML += `<tr><td><div><a href="${url}" target="_blank">${element.transaction}</a></div></td><td><div>${env}</div></td><td><div>${new Date(timestamp).toTimeString()}</div></td></tr>`;
    }
  });
}
onOpen();
document.getElementById("clear-traces").onclick = function clearTrace() {
  localset({"transactions": []}, function () {
    browser.runtime.sendMessage(0);
    onOpen();
  });
}
