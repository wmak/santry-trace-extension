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
  slug.value = data?.slug || "";
  prodRegex.value = data?.prodRegex || "";
  stagingRegex.value = data?.stagingRegex || "";
});
