var popupModule = (function() {
  return {
    key: "tab_stats",
    getKey: function() {
      return this.key;
    },
    loadData: function(tabStats) {
      var self = this;
      if (tabStats[this.key]) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(
          tabs
        ) {
          self.doLoad(tabs[0], tabStats);
        });
      }
    },
    doLoad: function(tab, tabStats) {
      if (
        tab &&
        tabStats[this.key][tab.windowId] &&
        tabStats[this.key][tab.windowId][tab.id]
      ) {
        var now = moment();
        var tabStat = tabStats[this.key][tab.windowId][tab.id];

        var body = ["<tr>"];
        if (tabStat.lastLoadedAt) {
          body.push("<td>");
          body.push(
            "loaded " +
              moment
                .duration(now.diff(moment(tabStat.lastLoadedAt)))
                .humanize() +
              " ago"
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

        var tableBody = document.querySelector("table#stats > tbody");
        tableBody.innerHTML = body.join("");
      }
    },
    sortTabs: function(sortBy, order) {
      var self = this;
      chrome.tabs.query({ currentWindow: true, pinned: false }, function(tabs) {
        chrome.storage.local.get([self.key], function(tabStats) {
          var tabOrder = tabs.map(function(tab) {
            return tabStats[self.key][tab.windowId][tab.id];
          });

          tabOrder.sort(function(a, b) {
            if (a[sortBy] < b[sortBy]) {
              if (order === "asc") {
                return 1;
              } else {
                return -1;
              }
            } else if (a[sortBy] > b[sortBy]) {
              if (order === "asc") {
                return -1;
              } else {
                return 1;
              }
            } else {
              return 0;
            }
          });

          tabOrder.map(function(tabStat, index) {
            chrome.tabs.move(tabStat.id, { index: index });
          });
        });
      });
    }
  };
})();

chrome.storage.local.get([popupModule.getKey()], function(tabStats) {
  popupModule.loadData(tabStats);
});

var loadedAscButton = document.querySelector("button#loaded-asc");
loadedAscButton.addEventListener("click", function() {
  popupModule.sortTabs("lastLoadedAt", "asc");
});
var loadedDescButton = document.querySelector("button#loaded-desc");
loadedDescButton.addEventListener("click", function() {
  popupModule.sortTabs("lastLoadedAt", "desc");
});
var openedAscButton = document.querySelector("button#opened-asc");
openedAscButton.addEventListener("click", function() {
  popupModule.sortTabs("openedAt", "asc");
});
var openedDescButton = document.querySelector("button#opened-desc");
openedDescButton.addEventListener("click", function() {
  popupModule.sortTabs("openedAt", "desc");
});
