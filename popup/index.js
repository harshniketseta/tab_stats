var key = "tab_stats";
function reloadData(tab, tabStats) {
  if (
    tab &&
    tabStats[key][tab.windowId] &&
    tabStats[key][tab.windowId][tab.id]
  ) {
    var now = moment();
    var tabStat = tabStats[key][tab.windowId][tab.id];

    var body = ["<tr>"];
    if (tabStat.lastLoadedAt) {
      body.push("<td>");
      body.push(
        "loaded " +
          moment.duration(now.diff(moment(tabStat.lastLoadedAt))).humanize()
      );
      body.push("</td>");
      body.push("</tr>");
      body.push("<tr>");
    }
    body.push("<td>");
    body.push(
      "opened " +
        moment.duration(now.diff(moment(tabStat.openedAt))).humanize() +
        " ago"
    );
    body.push("</td>");
    body.push("</tr>");

    var tableBody = document.querySelector("table > tbody");
    tableBody.innerHTML = body.join("");
  }
}

chrome.storage.local.get([key], function(tabStats) {
  if (tabStats[key]) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(
      tabs
    ) {
      reloadData(tabs[0], tabStats);
    });
  }
});
