try {
  browser;
  localget = (keys, promise) => browser.storage.local.get(keys).then(promise);
  localset = (keys, promise) => browser.storage.local.set(keys).then(promise);
} catch (ex) {
  browser = chrome;
  localget = (keys, promise) => browser.storage.local.get(keys, promise);
  localset = (keys, promise) => browser.storage.local.set(keys, promise);
}

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

function formatDateParam(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00`
}

function enableButton(identifier) {
  document.getElementById(identifier).classList.remove('disabled');
  document.getElementById(identifier).classList.add('enabled');
}

function disableButton(identifier) {
  document.getElementById(identifier).classList.remove('enabled');
  document.getElementById(identifier).classList.add('disabled');
}

function updateButtons() {
  localget(["transactions"], function(data) {
    if (data.transactions.length > 10 * (page + 1)) {
      enableButton("nextButton");
    } else {
      disableButton("nextButton");
    }
    if (page > 0) {
      enableButton("prevButton");
    } else {
      disableButton("prevButton");
    }
  });
}

function loadContent() {
  localget(["transactions", "slug"], function(data) {
    const content = document.getElementById("popup-content");
    content.innerHTML = "";
    if (data.transactions === undefined) {
      data.transactions = [];
      localset(data);
    }
    for (const element of data.transactions.slice(10 * page, 10 * (page + 1))) {
      const env = element.environment;
      const timestamp = element.timestamp * 1000.0;
      const start = encodeURIComponent(formatDateParam(new Date(timestamp - (5*60*1000))));
      const end = encodeURIComponent(formatDateParam(new Date(timestamp + (5*60*1000))));
      const root_url = element.isValid ? ENV.valid.root_url : ENV.dev.root_url
      const url = `${root_url}organizations/${data.slug}/discover/results/?field=transaction&field=event.type&field=project&field=transaction.duration&field=timestamp&environment=${element.environment}&name=Traced+Transactions&query=trace%3A${element.contexts.trace.trace_id}&sort=-timestamp&start=${start}&end=${end}&interval=5s`
      content.innerHTML += `<tr><td><div><a href="${url}" target="_blank">${element.transaction}</a></div></td><td><div>${env}</div></td><td><div>${new Date(timestamp).toTimeString()}</div></td></tr>`;
    }
  });
}

function onOpen() {
  loadContent();
  updateButtons();
}
onOpen();
document.getElementById("clear-traces").onclick = function clearTrace() {
  page = 0;
  localset({"transactions": []}, function () {
    browser.runtime.sendMessage(0);
    onOpen();
  });
}
document.getElementById("nextButton").onclick = function nextPage() {
  localget(["transactions"], function(data) {
    if (data.transactions.length > 10 * (page + 1)) {
      page += 1;
      loadContent();
      updateButtons();
    }
  })
}
document.getElementById("prevButton").onclick = function nextPage() {
  if (page > 0) {
    page -= 1;
    loadContent();
    updateButtons();
  }
}
