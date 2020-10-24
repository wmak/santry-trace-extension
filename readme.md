# Santry-trace-extension
A little addon that tracks all your local/prod traces, only compatible with firefox for now
Will keep up to 50 traces

## Preview
<img width="700" alt="preview" src="https://i.imgur.com/IKOZy1k.png">

## To Install

### For Firefox
1. Go to about:debugging#/runtime/this-firefox
2. Click *Load Temporary Add-on*
3. Select the `manifest.json` from this repo
4. Right click the icon in the browser, click Manage Extension
5. Go to Preferences
6. Enter your specific options, for example:
<img width="700" alt="firefox-options" src="https://i.imgur.com/3KuVvlH.png">

### For Chrome
1. Go to chrome://extensions/
2. Enable Developer Mode by clicking the toggle switch next to Developer mode.
3. Click *Load Unpacked*
4. Select the `manifest.json` from this repo
5. Go to Details
6. Click *Extension Options*
7. Enter your specific options, for example:
<img width="700" alt="chrome-options" src="https://i.imgur.com/2uj4EMC.png">

## To Update
1. Go back to about:debugging#/runtime/this-firefox or chrome://extensions/
2. Click reload
