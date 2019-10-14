var tabStatsService = (function TabStatsService() {
  return {
    key: "tab_stats",
    event_queue: [],
    processing_queue: [],
    timeout: undefined,
    initTabStats: function() {
      var tabStats = {};
      tabStats[this.key] = {};
      return tabStats;
    },
    newTabStats: function(tabId) {
      return {
        id: tabId,
        openedAt: Date.now()
      };
    },
    tabCreated: function(tab, tabStats, process) {
      var self = this;
      if (!this.timeout) {
        setTimeout(function() {
          self.processEvents();
        }, 10);
      }

      if (!process) {
        this.event_queue.push(["tabCreated", tab, tabStats]);
        return;
      }
      if (!tabStats[this.key]) {
        tabStats[this.key] = {};
      }
      if (!tabStats[this.key][tab.windowId]) {
        tabStats[this.key][tab.windowId] = {};
      }
      tabStats[this.key][tab.windowId][tab.id] = this.newTabStats(tab.id);
      chrome.storage.local.set(tabStats);
    },
    tabRemoved: function(tabId, removeInfo, tabStats, process) {
      var self = this;
      if (!this.timeout) {
        setTimeout(function() {
          self.processEvents();
        }, 10);
      }
      if (!process) {
        this.event_queue.push(["tabRemoved", tabId, removeInfo, tabStats]);
        return;
      }
      if (tabStats[this.key] && tabStats[this.key][removeInfo.windowId]) {
        delete tabStats[this.key][removeInfo.windowId][tabId];

        if (Object.keys(tabStats[this.key][removeInfo.windowId]).length === 0) {
          delete tabStats[this.key][removeInfo.windowId];
        }
        chrome.storage.local.set(tabStats);
      }
      return undefined;
    },
    tabUpdatedValid: function(tab, changeInfo) {
      return (
        changeInfo.status === "complete" && !tab.url.startsWith("chrome://")
      );
    },
    tabUpdated: function(tabId, tab, tabStats, process) {
      var self = this;
      if (!this.timeout) {
        setTimeout(function() {
          self.processEvents();
        }, 10);
      }
      if (!process) {
        this.event_queue.push(["tabUpdated", tabId, tab, tabStats]);
        return;
      }
      if (
        tabStats[this.key] &&
        tabStats[this.key][tab.windowId] &&
        tabStats[this.key][tab.windowId][tabId]
      ) {
        var tabStat = tabStats[this.key][tab.windowId][tabId];
        tabStat.lastLoadedAt = Date.now();
        chrome.storage.local.set(tabStats);
      }
      return undefined;
    },
    tabAttached: function(tabId, attachInfo, tabStats, process) {
      var self = this;
      if (!this.timeout) {
        setTimeout(function() {
          self.processEvents();
        }, 10);
      }
      if (!process) {
        this.event_queue.push(["tabAttached", tabId, attachInfo, tabStats]);
        return;
      }
      if (tabStats[this.key]) {
        if (!tabStats[this.key][attachInfo.newWindowId]) {
          tabStats[this.key][attachInfo.newWindowId] = {};
        }

        for (var windowId in Object.keys(tabStats[this.key])) {
          if (tabStats[this.key][windowId][tabId]) {
            tabStats[this.key][attachInfo.newWindowId][tabId] =
              tabStats[this.key][windowId][tabId];
            delete tabStats[this.key][windowId][tabId];
          }
        }

        chrome.storage.local.set(tabStats);
      }
      return undefined;
    },
    processEvents: function() {
      this.timeout = null;
      while (this.event_queue.length) {
        this.processing_queue.push(this.event_queue.pop());
      }

      while (this.processing_queue.length) {
        var event = this.processing_queue.shift();
        var functionName = event.shift();
        if (this[functionName]) {
          event.push(true);
          this[functionName].apply(this, event);
        }
      }
    }
  };
})();

chrome.runtime.onInstalled.addListener(function() {
  var tabStats = tabStatsService.initTabStats();

  chrome.windows.getAll({}, function(windows) {
    windows.map(function(window) {
      chrome.tabs.getAllInWindow(window.id, function(tabs) {
        tabs.map(function(tab) {
          tabStatsService.tabCreated(tab, tabStats);
        });
      });
    });
  });
});

chrome.tabs.onCreated.addListener(function(tab) {
  chrome.storage.local.get([key], function(tabStats) {
    tabStatsService.tabCreated(tab, tabStats);
  });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  chrome.storage.local.get([key], function(tabStats) {
    tabStatsService.tabRemoved(tabId, removeInfo, tabStats);
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tabStatsService.tabUpdatedValid(tab, changeInfo)) {
    chrome.storage.local.get([key], function(tabStats) {
      tabStatsService.tabUpdated(tabId, tab, tabStats);
    });
  }
});

chrome.tabs.onAttached.addListener(function(tabId, attachInfo) {
  chrome.storage.local.get([key], function(tabStats) {
    tabStatsService.tabAttached(tabId, attachInfo, tabStats);
  });
});
