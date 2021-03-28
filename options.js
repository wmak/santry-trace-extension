try {
  browser;
  localget = (keys, promise) => browser.storage.local.get(keys).then(promise);
} catch (ex) {
  browser = chrome;
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
document.getElementById("refresh-auth").onclick = function refreshAuth() {
  browser.runtime.sendMessage({"refresh": true});
}
function loadList() {
  localget(["organizationMap", "projectMap"], function(data) {
    const content = document.getElementById("options-content");
    innerHTML = "";
    for (const element in data.projectMap) {
      innerHTML += `<tr><td><a href="https://sentry.io/organizations/${data.organizationMap[element]}/performance/?project=-1" target="_blank">${data.organizationMap[element]}</a></td><td><a href="https://sentry.io/organizations/${data.organizationMap[element]}/performance/?project=${element}/" target="_blank">${data.projectMap[element]}</a></td></tr>`;
    }
    content.innerHTML = innerHTML;
  });
}
loadList();
browser.runtime.onMessage.addListener((data) => {
  if (data.hasOwnProperty("projectLoaded")) loadList();
});
