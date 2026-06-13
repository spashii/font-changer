// Opens the onboarding page the first time the extension is installed.
const odxBgApi = globalThis.browser ?? globalThis.chrome;

odxBgApi.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    odxBgApi.tabs.create({ url: odxBgApi.runtime.getURL("src/onboarding.html") });
  }
});
