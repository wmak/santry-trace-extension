try {
  browser;
  cookiesGet = (details, promise) => browser.cookies.get(details).then(promise);
  localget = (keys, promise) => browser.storage.local.get(keys).then(promise);
  // Not supported in chrome
  browser.browserAction.setBadgeTextColor({color: "#ffffff"});
} catch (ex) {
  browser = chrome;
  cookiesGet = (details, promise) => browser.cookies.get(details, promise);
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

function updateBadge(length) {
  if (length == -1) {
    fetchAndUpdateBadge();
  } else if (length > 0) {
    browser.browserAction.setBadgeText({text: `${length}`});
  } else {
    browser.browserAction.setBadgeText({text: ""});
  }
}

function getProjects() {
  cookiesGet({name: "session", url: "https://sentry.io"}, res => {
    document.cookie = `session=${res.value}`;
    let organizationMap = {};
    let projectMap = {};
    fetch("https://sentry.io/api/0/projects/").then(res => {res.json().then(data => {
      data.forEach(project => {
        organizationMap[project.id] = project.organization.name.toLowerCase();
        projectMap[project.id] = project.slug.toLowerCase();
      });
      browser.storage.local.set({"organizationMap": organizationMap});
      browser.storage.local.set({"projectMap": projectMap});
    })});
  })
}
getProjects();

function fetchAndUpdateBadge() {
  localget("transactions", function(data) {
    if (data.transactions === undefined) {
      data.transactions = [];
    }
    transactions = data.transactions;
    updateBadge(data.transactions.length)
    browser.storage.local.set(data);
  });
}
fetchAndUpdateBadge();
browser.runtime.onMessage.addListener((length) => {
  updateBadge(length);
  transactions = [];
})

function isValidUrl(url, data) {
  return (data.prodRegex ? url.match(new RegExp(data.prodRegex)) : false) || (data.stagingRegex ? url.match(new RegExp(data.stagingRegex)) : false);
}

function getProjectFromURL(event) {
  const projects = new URL(event.url).pathname.match(/(\d+)/g);
  if (projects.length != 1) {
    // error
    return -1
  }
  const project = projects[0];
  if (project === "5498617") {
    // Don't listen to this extension's events
    return -1
  }
  return project
}

function decodeBody(event) {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(new Uint8Array(event.requestBody.raw[0].bytes));
}

function transactionListener(event) {
  const project = getProjectFromURL(event);
  if (project === -1) {
    return
  }
  const sentryEvent = JSON.parse(decodeBody(event).split("\n", 3)[2]);
  let newTraceId = sentryEvent?.contexts?.trace?.trace_id;
  localget(["organizationMap"], function(data) {
    const url = sentryEvent?.request?.url || "";
    const isValid = data.organizationMap[project] && newTraceId;
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
          organization: data.organizationMap[project],
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
  const project = getProjectFromURL(event);
  if (project === -1) {
    return
  }
  const sentryEvent = JSON.parse(decodeBody(event));
  let newEventId = sentryEvent?.event_id;
  localget(["organizationMap", "projectMap"], function(data) {
    const url = sentryEvent?.request?.url || "";
    const isValid = data.organizationMap[project] && newEventId;
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
          organization: data.organizationMap[project],
          project: data.projectMap[project],
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
