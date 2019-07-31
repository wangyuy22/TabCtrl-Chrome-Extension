
var totalWidth = 0;
var totalHeight = 0;

//Checking for if a tab has been detached
chrome.tabs.onDetached.addListener(function (tabId, {oldWindowId, oldPosition}){

  //Getting the normal width and height of window
  chrome.storage.sync.get('pixelsW', function(w){
    totalWidth = w.pixelsW;
  });
    chrome.storage.sync.get('pixelsH', function(h){
      totalHeight = h.pixelsH;
  });

/*
*Within 5 seconds of detaching, check if undo command has been triggered, if so the detached tab returns to old window, and the size returns to the normal size
*/
 chrome.tabs.update(tabId, {active: true});
  var pastTime = Date.now();
  if (Date.now() - pastTime < 5000) {
    chrome.commands.onCommand.addListener(function(command) {
      if (command === 'undo-move-tab') {
        chrome.tabs.move(tabId, {windowId: oldWindowId, index: oldPosition}, function() {
          chrome.windows.getCurrent(function (win) {
                chrome.windows.update(win.id, {left: 0, width: totalWidth, top: 0, height: totalHeight});
              })
        });
      }
    });
  }
});



//Reorder Tabs
chrome.commands.onCommand.addListener(function(command) {
  chrome.tabs.query({currentWindow: true, pinned: true}, function(p) {
    let first = 0;
    p.sort((a, b) => { return a.index < b.index; });
    first = p.length;
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      tabs.sort((a, b) => { return a.index < b.index; });
      let curr = tabs.findIndex((tab) => { return tab.active; });
      chrome.tabs.query({currentWindow: true, highlighted: true}, function(t) {
        //If there is only 1 tab highlighted
        if (t.length < 2) {
          let last = tabs.length - 1;
          let i = -1;
          if (command === 'move-tab-right' || command === 'move-tab-left') {
            if (command === 'move-tab-left') {
              if (curr === first && first != 0) {
                i = last;
              } else if (curr > first) {
                i = curr - 1
              } else if (curr === 0) {
                i = first - 1;
              } else if (curr < first) {
                i = curr -1;
              }
            } else if (command === 'move-tab-right') {
              if (curr === last && first != 0) {
                i = first;
              } else if (curr >= first && curr < last) {
                i = curr + 1;
              } else if (curr === last) {
                i = 0;
              } else if (curr < first - 1) {
                i = curr + 1;
              } else if (curr === first - 1) {
                i = 0;
              }
            }
            chrome.tabs.move(tabs[curr].id, { 'index': i });
          }
        //If there are more than one tab highlighted
        } else {
          chrome.tabs.query({currentWindow: true, highlighted: true}, function(t) {
            let last = tabs.length - 1;
            let i = -1;
            t.sort((a, b) => {
              if (a.index < b.index) {
                return -1;
              } else if (a.index > b.index) {
                return 1;
              } else {
                return 0;
              }
            });
            var tabIds = [];
            for (var a = 0; a < t.length; a++) {
              tabIds.push(t[a].id);
            }
            if (command === 'move-tab-left') {
              for (var j = 0; j < t.length; j++) {
                var c = t[j].index;
                if (c == first) {
                  chrome.tabs.move(tabIds, {index: -1});
                  break;
                } else if (c > first) {
                  chrome.tabs.move(t[j].id, {index: c-1});
                }
              }
            } else if (command === 'move-tab-right') {
              for (var j = t.length-1; j >= 0; j--) {
                var c = t[j].index;
                if (c == last) {
                  chrome.tabs.move(tabIds, {index: 0});
                  break;
                } else if (c < last) {
                  chrome.tabs.move(t[j].id, {index: c+1});
                }
              } 
            }  
          });
        } 
      })
    });
  });
});

