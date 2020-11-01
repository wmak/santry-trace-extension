Sentry.init({
  dsn: 'https://91b83206aef54757af38f2e6a391f17f@o349958.ingest.sentry.io/5498617',
  integrations: [
    new Sentry.Integrations.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
  release: "santry-trace-extension@" + browser.runtime.getManifest().version,
});
try {
  browser;
  localget = (keys, promise) => browser.storage.local.get(keys).then(promise);
} catch (ex) {
  browser = chrome;
  localget = (keys, promise) => browser.storage.local.get(keys, promise);
}
const slug = document.getElementById("slug");
const prodRegex = document.getElementById("prodRegex");
const stagingRegex = document.getElementById("stagingRegex");
slug.addEventListener('change', (event) => {
  browser.storage.local.set({"slug": event.target.value})
});
prodRegex.addEventListener('change', (event) => {
  browser.storage.local.set({"prodRegex": event.target.value})
});
stagingRegex.addEventListener('change', (event) => {
  browser.storage.local.set({"stagingRegex": event.target.value})
});
localget(["slug", "prodRegex", "stagingRegex"], function(data) {
  slug.value = data?.slug || null;
  prodRegex.value = data?.prodRegex || null;
  stagingRegex.value = data?.stagingRegex || null;
});
