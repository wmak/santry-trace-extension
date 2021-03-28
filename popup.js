let transactions = [];
let slug = '';
try {
  browser;
  localget = (keys, promise) => browser.storage.local.get(keys).then(promise);
  localset = (keys, promise) => browser.storage.local.set(keys).then(promise);
} catch (ex) {
  browser = chrome;
  localget = (keys, promise) => browser.storage.local.get(keys, promise);
  localset = (keys, promise) => browser.storage.local.set(keys, promise);
}
Sentry.init({
  dsn: 'https://91b83206aef54757af38f2e6a391f17f@o349958.ingest.sentry.io/5498617',
  integrations: [
    new Sentry.Integrations.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
  release: "santry-trace-extension@" + browser.runtime.getManifest().version,
});

let page = 0;

const ENV = {
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

function enableButton(identifier) {
  document.getElementById(identifier).classList.remove('disabled');
  document.getElementById(identifier).classList.add('enabled');
}

function disableButton(identifier) {
  document.getElementById(identifier).classList.remove('enabled');
  document.getElementById(identifier).classList.add('disabled');
}

function updateButtons() {
  if (transactions.length > 10 * (page + 1)) {
    enableButton("nextButton");
  } else {
    disableButton("nextButton");
  }
  if (page > 0) {
    enableButton("prevButton");
  } else {
    disableButton("prevButton");
  }
}

function loadContent(transactions) {
  const content = document.getElementById("popup-content");
  innerHTML = "";
  for (const element of transactions.slice(10 * page, 10 * (page + 1))) {
    const env = element.environment;
    const timestamp = element.timestamp * 1000.0;
    const start = encodeURIComponent((new Date(timestamp - (24*60*60*1000))).toISOString());
    const end = encodeURIComponent((new Date(timestamp + (60*60*1000))).toISOString());
    const root_url = element.isValid ? ENV.valid.root_url : ENV.dev.root_url
    let url;
    if (element?.exception) {
      url = `${root_url}organizations/${element.organization}/discover/${element.project}:${element.event_id}/`
      innerHTML += `<tr><td><div><a href="${url}" target="_blank">${element?.exception?.values[0]?.type}</a></div></td><td><div>Error</div></td><td><div>${env}</div></td><td><div>${new Date(timestamp).toLocaleTimeString()}</div></td></tr>`;
    } else {
      url = `${root_url}organizations/${element.organization}/performance/trace/${element.trace_id}/?start=${start}&end=${end}`
      innerHTML += `<tr><td><div><a href="${url}" target="_blank">${element.transaction}</a></div></td><td><div>Transaction</div></td><td><div>${env}</div></td><td><div>${new Date(timestamp).toLocaleTimeString()}</div></td></tr>`;
    }
  }
  content.innerHTML = innerHTML;
}

function onOpen() {
  const transaction = Sentry.startTransaction({ name: "loadContent" , description: "onOpen"});
  const getSpan = transaction.startChild({ op: "localget" }); 
  localget(["recentTransactions"], function(data) {
    if (data.recentTransactions === undefined) {
      data.recentTransactions = [];
    }
    getSpan.setTag("transactions.length", data.recentTransactions.length);
    getSpan.finish()
    loadContent(data.recentTransactions);
    transaction.finish()
  });
  localget(["transactions"], function(data) {
    transactions = data.transactions;
    updateButtons();
  });
}
onOpen();
document.getElementById("clear-traces").onclick = function clearTrace() {
  page = 0;
  localset({"transactions": [], "recentTransactions": []}, function () {
    browser.runtime.sendMessage({"length": 0});
    onOpen();
  });
}
document.getElementById("nextButton").onclick = function nextPage() {
  if (transactions.length > 10 * (page + 1)) {
    page += 1;
    loadContent(transactions, slug);
    updateButtons();
  }
}
document.getElementById("prevButton").onclick = function nextPage() {
  if (page > 0) {
    page -= 1;
    loadContent(transactions, slug);
    updateButtons();
  }
}
