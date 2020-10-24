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
browser.storage.local.get("slug").then(function(data) {
  slug.value = data?.slug || "";
});
browser.storage.local.get("prodRegex").then(function(data) {
  prodRegex.value = data?.prodRegex || "";
});
browser.storage.local.get("stagingRegex").then(function(data) {
  stagingRegex.value = data?.stagingRegex || "";
});
