//React to the two buttons in the popup
document.addEventListener('DOMContentLoaded', function() {
    var link = document.getElementById('quickKeys');
    link.addEventListener('click', function() {
        chrome.tabs.create({'url': "chrome://extensions/shortcuts" } );
    });
});

document.addEventListener('DOMContentLoaded', function() {
    var link = document.getElementById('options');
    link.addEventListener('click', function() {
        chrome.tabs.create({'url': "/options.html" } );
    });
})



//Save Pixel of Full Screen
var totalWidth = null;
var totalHeight = null;
var totalTop = null;
var dimensions = 0;

$(function() {
    Mousetrap.bind('p', function(){
        chrome.windows.getCurrent(function(win){
            chrome.storage.sync.set({'pixelsW': win.width});
            totalWidth = win.width;
            dimensions++;
        });
        chrome.windows.getCurrent(function(win){
            chrome.storage.sync.set({'pixelsH': win.height});
            totalHeight = win.height;
            dimensions++;
        });
        chrome.windows.getCurrent(function(win){
            chrome.storage.sync.set({'pixelsT': win.top});
            totalTop = win.top;
            dimensions++;
        });
        chrome.storage.sync.set({'dim': dimensions});

        chrome.storage.sync.get('dim', function(win){
            if (win.dim >= 3) {
                $('div.active').text("Status: Active");
            } else {
                $('div.active').text("Status: Inactive - Press P");
            }
        })
    });
    chrome.storage.sync.get('pixelsW', function(win){
        totalWidth = win.pixelsW;
    })

    chrome.storage.sync.get('pixelsH', function(win){
        totalHeight = win.pixelsH;
    })
    chrome.storage.sync.get('pixelsT', function(win){
        totalTop = win.pixelsT;
    })
    chrome.storage.sync.get('dim', function(win){
        if (win.dim >= 3) {
            $('div.active').text("Status: Active :)");
        } else {
            $('div.active').text("Status: Inactive - Press P");
        }
    })
});



//Take one tab out to new window and halves screens

var tab_Id = null;
var curr_Id = null;
var all_tabs = [];
var size = 0;
var incog = false;

Mousetrap.bind('d', function() {
    chrome.tabs.update({active: true}, function(t) {
        curr_Id = t.id;
        chrome.tabs.query({ highlighted: true, currentWindow: true }, function(tab) {
            if (tab[0].id !== curr_Id) {
                tab.sort((a, b) => { 
                    if (a.index < b.index) {
                        return -1;
                    } else if (a.index > b.index) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            } else {
                tab.sort((a, b) => { 
                    if (a.index < b.index) {
                        return 1;
                    } else if (a.index > b.index) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
            }
            tab_Id = tab[0].id;
            var i = 0;
            while (i < tab.length) {
                if (tab[i].id != tab_Id) {
                    all_tabs.push(tab[i].id);
                }
                i++;
            }
            size = all_tabs.length;
            chrome.windows.getCurrent(function(win) {
                currentW = win;
                incog = win.incognito;
                chrome.windows.update(win.id, {width: (totalWidth)/2 }, function() {
                    chrome.windows.create({left: (totalWidth)/2, focused: true, tabId: tab_Id, incognito: incog}, function(window) {
                        chrome.tabs.move(all_tabs, {"windowId": window.id, index: 0});
                    });
                });
            });
        });
    });
});

//Sort tabs in a given window by URL alphabetically
Mousetrap.bind('a', function() {
    chrome.tabs.query({currentWindow: true, pinned: false}, function(tabs) {
        tabs.sort((a, b) => { 
            if (a.url > b.url) {
                return -1;
            } else if (b.url < a.url) {
                return 1;
            } else {
                return 0;
            }
        });
        first = tabs[0].index;
        var i = 0;
        while (i < tabs.length) {
            //console.log(curr[i]);
            console.log(i);
            chrome.tabs.move(tabs[i].id, {index: tabs.length - 1 - i});
            i = i + 1;
        }
    });
});

//Sort tabs in a given window by title alphabetically
Mousetrap.bind('s', function() {
    chrome.tabs.query({currentWindow: true, pinned: false}, function(tabs) {
        tabs.sort((a, b) => { 
            if (a.title > b.title) {
                return -1;
            } else if (b.url < a.url) {
                return 1;
            } else {
                return 0;
            }
        });
        first = tabs[0].index;
        var i = 0;
        while (i < tabs.length) {
            //console.log(curr[i]);
            console.log(i);
            chrome.tabs.move(tabs[i].id, {index: tabs.length - 1 - i});
            i = i + 1;
        }
    });
});

//Group all incognito windows together
var tWindow = null;

Mousetrap.bind('w', function() {
    chrome.windows.create({incognito: true}, function(win) {
        tWindow = win;
        chrome.windows.getAll({"populate" : true}, function(windows) {
            var numWindows = windows.length;
            var tabPosition = 0;
            for (var i = 0; i < numWindows; i++) {
              var win = windows[i];
              if (tWindow.id != win.id && win.incognito) {
                var numTabs = win.tabs.length;
                for (var j = 0; j < numTabs; j++) {
                  var tab = win.tabs[j];
                  // Move the tab into the window that triggered the browser action.
                  chrome.tabs.move(tab.id,
                      {"windowId": tWindow.id, "index": tabPosition});
                  tabPosition++;
                }
                chrome.windows.update(tWindow.id, {left: 0, top: 0, width: totalWidth, height: totalHeight});
              }
            }
        });
    });
});



//Group all normal windows together
var targetWindow = null;
var tabPos = -1;

Mousetrap.bind('q', function() {
    chrome.windows.getCurrent(function(win){
        targetWindow = win;
        chrome.tabs.getAllInWindow(win.id, function(tabs){
            tabPos = tabs.length;
            chrome.windows.getAll({"populate" : true}, function(windows) {
                var numWindows = windows.length;
                var tabPosition = tabPos;
                for (var i = 0; i < numWindows; i++) {
                  var win = windows[i];
                  if (targetWindow.id != win.id && !win.incognito) {
                    var numTabs = win.tabs.length;
                    for (var j = 0; j < numTabs; j++) {
                      var tab = win.tabs[j];
                      // Move the tab into the window that triggered the browser action.
                      chrome.tabs.move(tab.id,{"windowId": targetWindow.id, "index": tabPosition});
                      tabPosition++;
                    }
                    chrome.windows.update(targetWindow.id, {left: 0, top: 0, width: totalWidth, height: totalHeight});
                  }
                }
            });
        });
    });
});

//Flip through all active normal windows
var curr = null;

Mousetrap.bind('f', function(){
    chrome.windows.getAll(function(allWin){
        chrome.windows.getCurrent(function(window) {
            curr = window;
            allWin.sort((a, b) => { 
                if (a.id < b.id) {
                    return -1;
                } else if (a.id > b.id) {
                    return 1;
                } else {
                    return 0;
                }
            });
            for (var i = 0; i < allWin.length; i++) {
                if (allWin[i].id === curr.id) {
                    if (i < allWin.length -1) {
                        chrome.windows.update(allWin[i+1].id, {focused:true});
                    }
                    else {
                        chrome.windows.update(allWin[0].id, {focused:true});
                    }
                }
            }
        })
    });
});


//max screen
Mousetrap.bind('z', function() {
    chrome.windows.getCurrent(function(win) {
        chrome.windows.update(win.id, {left: 0, width: totalWidth, top: 0, height: totalHeight});
    });
});

//complete fullscreen mode
Mousetrap.bind('x', function() {
    chrome.windows.getCurrent(function(win) {
        chrome.windows.update(win.id, {state: 'fullscreen'});
    });
});

//half left
Mousetrap.bind('left', function() {
    chrome.windows.getCurrent(function(win) {
        chrome.windows.update(win.id, {left: 0, width: Math.round((totalWidth)/2), height: totalHeight, top: 0});
    });
});

//half right
Mousetrap.bind('right', function() {
    chrome.windows.getCurrent(function(win) {
        chrome.windows.update(win.id, {left: Math.round((totalWidth)/2), width: Math.round((totalWidth)/2), height: totalHeight, top: 0});
    });
});

//half top
Mousetrap.bind('up', function() {
    chrome.windows.getCurrent(function(win) {
        chrome.windows.update(win.id, {top: totalTop, height: Math.round((totalHeight)/2), left: 0, width: totalWidth});
    })
});

//half bottom
Mousetrap.bind('down', function() {
    chrome.windows.getCurrent(function(win) {
        chrome.windows.update(win.id, {top:Math.round(totalTop + Math.round((totalHeight)/2)), height: Math.round((totalHeight)/2), left: 0, width: totalWidth});
    });
});

//highlight

var indH = [];
var minI = -1;
var maxI = -1;

Mousetrap.bind('alt+left', highlightLeft);
Mousetrap.bind('alt+right', highlightRight);

//Highlight left of the current tab
function highlightLeft() {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
        if (indH.length === 0) {
            chrome.tabs.query({active: true}, function(curr) {
                var count = curr[0].index;
                if (count > 0) {
                    indH.push(count, count-1);
                    maxI = count;
                    minI = count - 1;
                } else {
                    minI = 0;
                    maxI = 0;
                }
                chrome.tabs.highlight({tabs: indH});
            });
        } else {
            if (minI > 0) {
                indH.push(minI -1);
                minI--;
            }
            chrome.tabs.highlight({tabs: indH});
        } 
    });
};

var indH = [];
var minI = -1;
var maxI = -1;

//Highlight right of the current tab
function highlightRight() {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
        if (indH.length === 0) {
            chrome.tabs.query({active: true}, function(curr) {
                var count = curr[0].index;
                if (count < tabs.length - 1) {
                    indH.push(count, count+1);
                    maxI = count + 1;
                    minI = count;
                } else {
                    maxI = tabs.length - 1;
                    minI = maxI;
                }
                chrome.tabs.highlight({tabs: indH});
            });
        } else {
            if (maxI < tabs.length - 1) {
                indH.push(maxI + 1);
                maxI++;
            }
            chrome.tabs.highlight({tabs: indH});
        } 
    });
};

Mousetrap.bind('alt+down', unhighlightLeft);
Mousetrap.bind('alt+up', unhighlightRight);

//Unhighlight the rightmost highlighted tab
function unhighlightLeft() {
    chrome.tabs.query({active: true}, function(tab){
        chrome.tabs.update(tab[0].id, {highlighted: true}, function (){
            chrome.tabs.query({currentWindow: true, highlighted: true}, function(tabs) {
                if (tabs.length > 0) {
                    tabs.sort((a, b) => { 
                        if (a.index < b.index) {
                            return -1;
                        } else if (a.index > b.index) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    indH = indH.filter(function(value, index, arr) {
                        value !== tabs[tabs.length-1].id;
                    });
                    maxI = tabs[tabs.length-1-1];
                    chrome.tabs.update(tabs[tabs.length-1].id, {highlighted: false});
                }
            });
        });
    });
}

//Unhighligh the leftmost highlighted tab
function unhighlightRight() {
    chrome.tabs.query({active: true}, function(tab){
        chrome.tabs.update(tab[0].id, {highlighted: true}, function (){
            chrome.tabs.query({currentWindow: true, highlighted: true}, function(tabs) {
                if (tabs.length > 0) {
                    tabs.sort((a, b) => { 
                        if (a.index < b.index) {
                            return -1;
                        } else if (a.index > b.index) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });

                    indH = indH.filter(function(value, index, arr) {
                        value !== tabs[0].id;
                    });
                    minI = tabs[1];
                    chrome.tabs.update(tabs[0].id, {highlighted: false});
                }
            });
        });
    });
}

//Pin a tab
Mousetrap.bind('m', function() {
    chrome.tabs.query({highlighted: true}, function(curr){
        for (var i = 0; i < curr.length; i++) {
            chrome.tabs.update(curr[i].id, {pinned: true});
        }
    });
});

//Unpin a tab
Mousetrap.bind('n', function() {
    chrome.tabs.query({highlighted: true}, function(curr){
        for (var i = 0; i < curr.length; i++) {
            chrome.tabs.update(curr[i].id, {pinned: false});
        }
    });
});



