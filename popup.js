ENV = {
  local: {
    root_url: "http://dev.getsentry.net:8000/"
  },
  prod: {
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
  browser.storage.local.get("transactions").then(function(data) {
    const content = document.getElementById("popup-content");
    content.innerHTML = "";
    for (const element of data.transactions) {
      const env = element.host.includes("dev.getsentry.net") ? "local" : "prod"
      start = encodeURIComponent(formatDateParam(new Date(Number(element.date) - (5*60*1000))));
      end = encodeURIComponent(formatDateParam(new Date(Number(element.date) + (5*60*1000))));
      url = `${ENV[env].root_url}organizations/sentry/discover/results/?field=transaction&field=event.type&field=project&field=transaction.duration&field=timestamp&name=Transactions+by+Volume&query=trace%3A${element.traceId}&sort=-timestamp&start=${start}&end=${end}&interval=5s`
      content.innerHTML += `<tr><td><div><a href="${url}">${element.name}</a></div></td><td><div>${env}</div></td><td><div>${element.date.toTimeString()}</div></td></tr>`;
    }
  });
}
onOpen();
document.getElementById("clear-traces").onclick = function clearTrace() {
  browser.storage.local.clear().then(function () {
    browser.runtime.sendMessage(0);
    onOpen();
  });
}
