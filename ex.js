var createButton = function(text, action, styleStr) {
    var button = document.createElement('button');
    button.textContent = text;
    button.onclick = action;
    button.setAttribute('style', styleStr || '');
    return button;
  };
  
  var getViewer = function(prevChapter, nextChapter) {
    var viewerCss = toStyleStr({
      'background-color': 'black !important',
      'font': '0.813em monospace !important',
      'text-align': 'center',
    }, 'body'),
        imagesCss = toStyleStr({
          'margin-top': '10px',
          'margin-bottom': '10px',
          'transform-origin': 'top center'
        }, '.ml-images'),
        imageCss = toStyleStr({
          'max-width': '100%',
          'display': 'block',
          'margin': '3px auto'
        }, '.ml-images img'),
        counterCss = toStyleStr({
          'background-color': '#222',
          'color': 'white',
          'border-radius': '10px',
          'width': '30px',
          'margin-left': 'auto',
          'margin-right': 'auto',
          'margin-top': '-12px',
          'padding-left': '5px',
          'padding-right': '5px',
          'border': '1px solid white',
          'z-index': '100',
          'position': 'relative'
        }, '.ml-counter'),
        navCss = toStyleStr({
          'text-decoration': 'none',
          'color': 'white',
          'background-color': '#444',
          'padding': '3px 10px',
          'border-radius': '5px',
          'transition': '250ms'
        }, '.ml-chap-nav a'),
        navHoverCss = toStyleStr({
          'background-color': '#555'
        }, '.ml-chap-nav a:hover'),
        boxCss = toStyleStr({
          'position': 'fixed',
          'background-color': '#222',
          'color': 'white',
          'padding': '7px',
          'border-top-left-radius': '5px',
          'cursor': 'default'
        }, '.ml-box'),
        statsCss = toStyleStr({
          'bottom': '0',
          'right': '0',
          'opacity': '0.4',
          'transition': '250ms'
        }, '.ml-stats'),
        statsCollapseCss = toStyleStr({
          'color': 'orange',
          'cursor': 'pointer'
        }, '.ml-stats-collapse'),
        statsHoverCss = toStyleStr({
          'opacity': '1'
        }, '.ml-stats:hover'),
        floatingMsgCss = toStyleStr({
          'bottom': '30px',
          'right': '0',
          'border-bottom-left-radius': '5px',
          'text-align': 'left',
          'font': 'inherit',
          'max-width': '95%',
          'z-index': '101',
          'white-space': 'pre-wrap'
        }, '.ml-floating-msg'),
        floatingMsgAnchorCss = toStyleStr({
          'color': 'orange'
        }, '.ml-floating-msg a'),
        buttonCss = toStyleStr({
          'cursor': 'pointer'
        }, '.ml-button'),
        keySettingCss = toStyleStr({
          'width': '35px'
        }, '.ml-setting-key input'),
        autoloadSettingCss = toStyleStr({
          'vertical-align': 'middle'
        }, '.ml-setting-autoload');
    // clear all styles and scripts
    var title = document.title;
    document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">';
    document.title = title;
    document.body.className = '';
    document.body.style = '';
    // navigation
    var nav = '<div class="ml-chap-nav">' + (prevChapter ? '<a class="ml-chap-prev" href="' + prevChapter + '">Prev Chapter</a> ' : '') +
        '<a class="ml-exit" href="' + location.href + '" data-exit="true">Exit</a> ' +
        (nextChapter ? '<a class="ml-chap-next" href="' + nextChapter + '">Next Chapter</a>' : '') + '</div>';
    // message area
    var floatingMsg = '<pre class="ml-box ml-floating-msg"></pre>';
    // stats
    var stats = '<div class="ml-box ml-stats"><span title="hide stats" class="ml-stats-collapse">&gt;&gt;</span><span class="ml-stats-content"><span class="ml-stats-pages"></span> ' +
        '<i class="fa fa-info ml-button ml-info-button" title="See userscript information and help"></i> ' +
        '<i class="fa fa-bar-chart ml-button ml-more-stats-button" title="See page stats"></i> ' +
        '<i class="fa fa-cog ml-button ml-settings-button" title="Adjust userscript settings"></i> ' +
        '<i class="fa fa-refresh ml-button ml-manual-reload" title="Manually refresh next clicked image."></i></span></div>';
    // combine ui elements
    document.body.innerHTML = nav + '<div class="ml-images"></div>' + nav + floatingMsg + stats;
    // add main styles
    addStyle('main', true, viewerCss, imagesCss, imageCss, counterCss, navCss, navHoverCss, statsCss, statsCollapseCss, statsHoverCss, boxCss, floatingMsgCss, buttonCss, keySettingCss, autoloadSettingCss, floatingMsgAnchorCss);
    // add user styles
    var userCss = storeGet('ml-setting-css-profiles');
    var curProf = storeGet('ml-setting-css-current') || 'Default';
    if(userCss && userCss.length > 0) userCss = userCss.filter(function(p) { return p.name === curProf; });
    userCss = userCss && userCss.length > 0 ? userCss[0].css : (storeGet('ml-setting-css') || '');
    addStyle('user', true, userCss);
    // set up return UI object
    var UI = {
      images: getEl('.ml-images'),
      statsContent: getEl('.ml-stats-content'),
      statsPages: getEl('.ml-stats-pages'),
      statsCollapse: getEl('.ml-stats-collapse'),
      btnManualReload: getEl('.ml-manual-reload'),
      btnInfo: getEl('.ml-info-button'),
      btnMoreStats: getEl('.ml-more-stats-button'),
      floatingMsg: getEl('.ml-floating-msg'),
      btnNextChap: getEl('.ml-chap-next'),
      btnPrevChap: getEl('.ml-chap-prev'),
      btnExit: getEl('.ml-exit'),
      btnSettings: getEl('.ml-settings-button'),
      isTyping: false,
      ignore: false,
      moreStats: false,
      currentProfile: storeGet('ml-setting-css-current') || ''
    };
    // message func
    var messageId = null;
    var showFloatingMsg = function(msg, timeout, html) {
      clearTimeout(messageId);
      log(msg);
      if(html) {
        UI.floatingMsg.innerHTML = msg;
      } else {
        UI.floatingMsg.textContent = msg;
      }
      if(!msg) UI.moreStats = false;
      UI.floatingMsg.style.display = msg ? '' : 'none';
      if(timeout) {
        messageId = setTimeout(function() {
          showFloatingMsg('');
        }, timeout);
      }
    };
    var isMessageFloating = function() {
      return !!UI.floatingMsg.innerHTML;
    };
    // configure initial state
    UI.floatingMsg.style.display = 'none';
    // set up listeners
    document.addEventListener('click', function(evt) {
      if (evt.target.nodeName === 'A' && evt.button !== 2) {
        var shouldReload = evt.target.href.indexOf('#') !== -1 && evt.target.href.split('#')[0] === document.location.href.split('#')[0] && evt.button === 0;  // fix for batoto https weirdness
        if(evt.target.className.indexOf('ml-chap') !== -1) {
          log('next chapter will autoload');
          storeSet('autoload', 'yes');
          if(shouldReload) {
            evt.preventDefault();
            location.href = evt.target.href;
            location.reload(true);
          }
        } else if(evt.target.className.indexOf('ml-exit') !== -1) {
          log('exiting chapter, stop autoload');
          storeSet('autoload', 'no');
          if(shouldReload) {
            evt.preventDefault();
            location.reload(true);
          }
        }
      }
    });
    UI.btnMoreStats.addEventListener('click', function(evt) {
      if(isMessageFloating() && UI.lastFloat === evt.target) {
        showFloatingMsg('');
      } else {
        UI.lastFloat = evt.target;
        UI.moreStats = true;
        showFloatingMsg([
          '<strong>Stats:</strong>',
          pageStats.loadLimit + ' pages parsed',
          pageStats.numLoaded + ' images loaded',
          (pageStats.loadLimit - pageStats.numLoaded) + ' images loading',
          (pageStats.numPages || 'Unknown number of') + ' pages in chapter',
          (pageStats.curChap !== null && pageStats.numChaps !== null ? ((pageStats.curChap - 1) + '/' + pageStats.numChaps + ' chapters read ' + (((pageStats.curChap - 1) / pageStats.numChaps * 100).toFixed(2) + '%') + ' of series') : ''),
        ].join('<br>'), null, true);
      }
    });
    UI.btnManualReload.addEventListener('click', function(evt) {
      var imgClick = function(e) {
        var target = e.target;
        UI.images.removeEventListener('click', imgClick, false);
        UI.images.style.cursor = '';
        if(target.nodeName === 'IMG' && target.parentNode.className === 'ml-images') {
          showFloatingMsg('');
          if(!target.title) {
            showFloatingMsg('Reloading "' + target.src + '"', 3000);
            if(target.complete) target.onload = null;
            target.src = target.src + (target.src.indexOf('?') !== -1 ? '&' : '?') + new Date().getTime();
          }
        } else {
          showFloatingMsg('Cancelled manual reload...', 3000);
        }
      };
      showFloatingMsg('Left click the image you would like to reload.\nClick on the page margin to cancel.');
      UI.images.style.cursor = 'pointer';
      UI.images.addEventListener('click', imgClick, false);
    });
    UI.statsCollapse.addEventListener('click', function(evt) {
      var test = UI.statsCollapse.textContent === '>>';
      storeSet('ml-stats-collapsed', test);
      UI.statsContent.style.display = test ? 'none' : '';
      UI.statsCollapse.textContent = test ? '<<' : '>>';
    });
    // restore collapse state
    if(storeGet('ml-stats-collapsed')) UI.statsCollapse.click();
    UI.floatingMsg.addEventListener('focus', function(evt) {
      var target = evt.target;
      if(target.dataset.ignore) UI.ignore = true;
      if((target.nodeName === 'INPUT' && target.type === 'text') || target.nodeName === 'TEXTAREA') UI.isTyping = true;
    }, true);
    UI.floatingMsg.addEventListener('blur', function(evt) {
      var target = evt.target;
      if(target.dataset.ignore) UI.ignore = false;
      if((target.nodeName === 'INPUT' && target.type === 'text') || target.nodeName === 'TEXTAREA') UI.isTyping = false;
    }, true);
    UI.btnInfo.addEventListener('click', function(evt) {
      if(isMessageFloating() && UI.lastFloat === evt.target) {
        showFloatingMsg('');
      } else {
        UI.lastFloat = evt.target;
        showFloatingMsg([
          '<strong>Information:</strong>',
          '<strong>IMPORTANT:</strong> The script has been updated to exclude NSFW sites',
          'in order to gain access to that functionality you\'ll have to install the following addon script.',
          '<a href="https://sleazyfork.org/en/scripts/12657-manga-loader-nsfw" target="_blank">https://sleazyfork.org/en/scripts/12657-manga-loader-nsfw</a>',
          '',
          'New feature! You can now define custom CSS in the new settings panel (accessible through the gear icon at the bottom left).',
          'The CSS will be saved and reapplied each time the script loads. You can change the background color of the page,',
          'the width of the images and pretty much anything else.',
          '',
          'CSS feature has now been enhanced to support multiple profiles you can switch between.',
          '',
          '<strong>Default Keybindings:</strong>',
          'Z - previous chapter',
          'X - exit',
          'C - next chapter',
          'W - scroll up',
          'S - scroll down',
          '+ - zoom in',
          '- - zoom out',
          '0 - reset zoom',
          'Click the info button again to close this message.'
        ].join('<br>'), null, true);
      }
    });
    UI.btnSettings.addEventListener('click', function(evt) {
      if(isMessageFloating() && UI.lastFloat === evt.target) {
        showFloatingMsg('');
      } else {
        UI.lastFloat = evt.target;
        // start grid and first column
        var settings = '<table><tr><td>';
        // Custom CSS
        var cssProfiles = storeGet('ml-setting-css-profiles');
        if(!cssProfiles || cssProfiles.length === 0) {
          cssProfiles = [{name: 'Default', css: storeGet('ml-setting-css') || ''}];
          storeSet('ml-setting-css-profiles', cssProfiles);
        }
        cssProfiles.push({ name: 'New Profile...', addNew: true });
        var prof = cssProfiles.filter(function(p) { return p.name === UI.currentProfile; })[0] || cssProfiles[0];
        settings += 'CSS (custom css for Manga Loader):<br>' +
          '<select class="ml-setting-css-profile">' +
          cssProfiles.map(function(profile) { return '<option ' + (profile.name === prof.name ? 'selected' : '') + '>' + profile.name + '</option>'; }).join('') +
          '</select><button class="ml-setting-delete-profile">x</button><br>' +
          '<textarea style="width: 300px; height: 300px;" type="text" class="ml-setting-css">' + prof.css + '</textarea><br><br>';
        // start new column
        settings += '</td><td>';
        // Keybindings
        var keyTableHtml = Object.keys(UI.keys).map(function(action) {
          return '<tr><td>' + action + '</td><td><input data-ignore="true" data-key="' + action + '" type="text" value="' + UI.keys[action] + '"></td></tr>';
        }).join('');
        settings += 'Keybindings:<br><table class="ml-setting-key">' + keyTableHtml + '</table><br>';
        // Autoload
        settings += 'Auto-load: <input class="ml-setting-autoload" type="checkbox" ' + (storeGet('mAutoload') && 'checked' || '') + '><br><br>';
        // Load all or just N pages
        settings += "# of pages to load:<br>" +
          'Type "all" to load all<br>default is 10<br>' +
          '<input class="ml-setting-loadnum" size="3" type="text" value="' + (storeGet('mLoadNum') || 10) + '" /><br><br>';
        // close grid and column
        settings += '</td></tr></table>';
        // Save button
        settings += '<button class="ml-setting-save">Save</button> <button class="ml-setting-close">Close</button> <span class="ml-setting-save-flash"></span>';
        showFloatingMsg(settings, null, true);
        // handle keybinding detection
        getEl('.ml-setting-key').onkeydown = function(e) {
          var target = e.target;
          if(target.nodeName.toUpperCase() === 'INPUT') {
            e.preventDefault();
            e.stopPropagation();
            target.value = e.which || e.charCode || e.keyCode;
          }
        };
        // delete css profile
        getEl('.ml-setting-delete-profile', UI.floatingMsg).onclick = function(e) {
          if(['Default', 'New Profile...'].indexOf(prof.name) === -1) {
            if(confirm('Are you sure you want to delete profile "' + prof.name + '"?')) {
              var index = cssProfiles.indexOf(prof);
              cssProfiles.splice(index, 1);
              var sel = getEl('.ml-setting-css-profile');
              sel.remove(index);
              sel.selectedIndex = 0;
              sel.onchange({target: sel});
            }
          } else {
            alert('Cannot delete profile: "' + prof.name + '"');
          }
        };
        // change selected css profile
        getEl('.ml-setting-css-profile', UI.floatingMsg).onchange = function(e) {
          var cssBox = getEl('.ml-setting-css');
          prof.css = cssBox.value;
          prof = cssProfiles[e.target.selectedIndex];
          if(prof.addNew) {
            // enter new name
            var newName = '';
            while(!newName || cssProfiles.filter(function(p) { return p.name === newName; }).length > 0) {
              newName = prompt('Enter the name for the new profile (must be unique)');
              if(!newName) {
                e.target.selectedIndex = 0;
                e.target.onchange({target: e.target});
                return;
              }
            }
            // add new profile to array
            var last = cssProfiles.pop();
            cssProfiles.push({name: newName, css: ''}, last);
            prof = cssProfiles[cssProfiles.length - 2];
            // add new profile to select box
            var option = document.createElement('option');
            option.text = newName;
            e.target.add(option, e.target.options.length - 1);
            e.target.selectedIndex = e.target.options.length - 2;
          }
          cssBox.value = prof.css;
          UI.currentProfile = prof.name;
          addStyle('user', true, prof.css);
        };
        // handle save button
        getEl('.ml-setting-save', UI.floatingMsg).onclick = function() {
          // persist css
          var css = getEl('.ml-setting-css', UI.floatingMsg).value.trim();
          prof.css = css;
          addStyle('user', true, css);
          var last = cssProfiles.pop();
          storeSet('ml-setting-css-profiles', cssProfiles);
          cssProfiles.push(last);
          storeSet('ml-setting-css-current', UI.currentProfile);
          // keybindings
          getEls('.ml-setting-key input').forEach(function(input) {
            UI.keys[input.dataset.key] = parseInt(input.value);
          });
          storeSet('ml-setting-key', UI.keys);
          // autoload
          storeSet('mAutoload', getEl('.ml-setting-autoload').checked);
          // loadnum
          var loadnum = getEl('.ml-setting-loadnum').value;
          mLoadNum = getEl('.ml-setting-loadnum').value = loadnum.toLowerCase() === 'all' ? 'all' : (parseInt(loadnum) || 10);
          storeSet('mLoadNum', mLoadNum);
          // flash notify
          var flash = getEl('.ml-setting-save-flash');
          flash.textContent = 'Saved!';
          setTimeout(function() { flash.textContent = ''; }, 1000);
        };
        // handle close button
        getEl('.ml-setting-close', UI.floatingMsg).onclick = function() {
          showFloatingMsg('');
        };
      }
    });
    // zoom
    var lastZoom, originalZoom,newZoomPostion;
    var changeZoom = function(action, elem) {
      var ratioZoom = (document.documentElement.scrollTop || document.body.scrollTop)/(document.documentElement.scrollHeight || document.body.scrollHeight);
      var curImage = getCurrentImage();
      if(!lastZoom) {
        lastZoom = originalZoom = Math.round(curImage.clientWidth / window.innerWidth * 100);
      }
      var zoom = lastZoom;
      if(action === '+') zoom += 5;
      if(action === '-') zoom -= 5;
      if(action === '=') {
        lastZoom = originalZoom;
        addStyle('image-width', true, '');
        showFloatingMsg('reset zoom', 500);
        newZoomPostion =(document.documentElement.scrollHeight || document.body.scrollHeight)*ratioZoom;
        window.scroll(0, newZoomPostion);
        return;
      }
      zoom = Math.max(10, Math.min(zoom, 100));
      lastZoom = zoom;
      addStyle('image-width', true, toStyleStr({
        width: zoom + '%'
      }, '.ml-images img'));
      showFloatingMsg('zoom: ' + zoom + '%', 500);
      newZoomPostion =(document.documentElement.scrollHeight || document.body.scrollHeight)*ratioZoom;
      window.scroll(0, newZoomPostion);
    };
    var goToPage = function(toWhichPage) {
        var curId = getCurrentImage().id;
        var nextId = curId.split('-');
        switch (toWhichPage) {
            case 'next':
                nextId[2] = parseInt(nextId[2]) + 1;
                break;
            case 'previous':
                nextId[2] = parseInt(nextId[2]) - 1;
                break;
        }
        var nextPage = getEl('#' + nextId.join('-'));
        if (nextPage == null) {
            log(curId + " > " + nextId);
            log("Reached the end!");
        } else {
            nextPage.scrollIntoView();
        }
    }
    // keybindings
    UI.keys = {
      PREV_CHAP: 90, EXIT: 88, NEXT_CHAP: 67,
      SCROLL_UP: 87, SCROLL_DOWN: 83,
      ZOOM_IN: 187, ZOOM_OUT: 189, RESET_ZOOM: 48,
      PREV_PAGE: 37, NEXT_PAGE: 39,
    };
    // override defaults for firefox since different keycodes
    if(typeof InstallTrigger !== 'undefined') {
      UI.keys.ZOOM_IN = 61;
      UI.keys.ZOOM_OUT = 173;
      UI.keys.RESET_ZOOM = 48;
    }
    UI.scrollAmt = 50;
    // override the defaults with the user defined ones
    updateObj(UI.keys, storeGet('ml-setting-key') || {});
    UI._keys = {};
    Object.keys(UI.keys).forEach(function(action) {
      UI._keys[UI.keys[action]] = action;
    });
    window.addEventListener('keydown', function(evt) {
      // ignore keybindings when text input is focused
      if(UI.isTyping) {
        if(!UI.ignore) evt.stopPropagation();
        return;
      }
      var code = evt.which || evt.charCode || evt.keyCode;
      // stop propagation if key is registered
      if(code in UI.keys) evt.stopPropagation();
      // perform action
      switch(code) {
        case UI.keys.PREV_CHAP:
          if(UI.btnPrevChap) {
            UI.btnPrevChap.click();
          }
          break;
        case UI.keys.EXIT:
          UI.btnExit.click();
          break;
        case UI.keys.NEXT_CHAP:
          if(UI.btnNextChap) {
            UI.btnNextChap.click();
          }
          break;
        case UI.keys.SCROLL_UP:
          window.scrollBy(0, -UI.scrollAmt);
          break;
        case UI.keys.SCROLL_DOWN:
          window.scrollBy(0, UI.scrollAmt);
          break;
        case UI.keys.ZOOM_IN:
          changeZoom('+', UI.images);
          break;
        case UI.keys.ZOOM_OUT:
          changeZoom('-', UI.images);
          break;
        case UI.keys.RESET_ZOOM:
          changeZoom('=', UI.images);
          break;
        case UI.keys.NEXT_PAGE:
          goToPage('next');
          break;
        case UI.keys.PREV_PAGE:
            goToPage('previous');
            break;
      }
    }, true);
    return UI;
  };
  
  var getCurrentImage = function() {
    var image;
    getEls('.ml-images img').some(function(img) {
      image = img;
      return img.getBoundingClientRect().bottom > 200;
    });
    return image;
  };
  
  var getCounter = function(imgNum) {
    var counter = document.createElement('div');
    counter.classList.add('ml-counter');
    counter.textContent = imgNum;
    return counter;
  };
  
  var addImage = function(src, loc, imgNum, callback) {
    var image = new Image(),
        counter = getCounter(imgNum);
    image.onerror = function() {
      log('failed to load ' + src);
      image.onload = null;
      image.style.backgroundColor = 'white';
      image.style.cursor = 'pointer';
      image.title = 'Reload "' + src + '"?';
      image.src = IMAGES.refresh_large;
      image.onclick = function() {
        image.onload = callback;
        image.title = '';
        image.style.cursor = '';
        image.src = src;
      };
    };
    image.id = 'ml-pageid-' + imgNum;
    image.onload = callback;
    image.src = src;
    loc.appendChild(image);
    loc.appendChild(counter);
  };
  
  var loadManga = function(imp) {
    var ex = extractInfo.bind(imp),
        imgUrl = ex('img', imp.imgmod),
        nextUrl = ex('next'),
        numPages = ex('numpages'),
        curPage = ex('curpage', {
          type: 'index'
        }) || 1,
        nextChapter = ex('nextchap', {
          type: 'value',
          val: (imp.invchap && -1) || 1
        }),
        prevChapter = ex('prevchap', {
          type: 'value',
          val: (imp.invchap && 1) || -1
        }),
        xhr = new XMLHttpRequest(),
        d = document.implementation.createHTMLDocument(),
        addAndLoad = function(img, next) {
          if(!img) throw new Error('failed to retrieve img for page ' + curPage);
          updateStats();
          addImage(img, UI.images, curPage, function() {
            pagesLoaded += 1;
            updateStats();
          });
          if(!next && curPage < numPages) throw new Error('failed to retrieve next url for page ' + curPage);
          loadNextPage(next);
        },
        updateStats = function() {
          updateObj(pageStats, {
            numLoaded: pagesLoaded,
            loadLimit: curPage,
            numPages: numPages
          });
          if(UI.moreStats) {
            for(var i=2;i--;) UI.btnMoreStats.click();
          }
          UI.statsPages.textContent = ' ' + pagesLoaded + (numPages ? '/' + numPages : '') + ' loaded';
        },
        getPageInfo = function() {
          var page = d.body;
          d.body.innerHTML = xhr.response;
          try {
            // find image and link to next page
            addAndLoad(ex('img', imp.imgmod, page), ex('next', null, page));
          } catch (e) {
            if (xhr.status == 503 && retries > 0) {
              log('xhr status ' + xhr.status + ' retrieving ' + xhr.responseURL + ', ' + retries-- + ' retries remaining');
              window.setTimeout(function() {
                xhr.open('get', xhr.responseURL);
                xhr.send();
              }, 500);
            } else {
              log(e);
              log('error getting details from next page, assuming end of chapter.');
            }
          }
        },
        loadNextPage = function(url) {
          if (mLoadNum !== 'all' && count % mLoadNum === 0) {
            if (resumeUrl) {
              resumeUrl = null;
            } else {
              resumeUrl = url;
              log('waiting for user to scroll further before loading more images, loaded ' + count + ' pages so far, next url is ' + resumeUrl);
              return;
            }
          }
          if (numPages && curPage + 1 > numPages) {
            log('reached "numPages" ' + numPages + ', assuming end of chapter');
            return;
          }
          if (lastUrl === url) {
            log('last url (' + lastUrl + ') is the same as current (' + url + '), assuming end of chapter');
            return;
          }
          curPage += 1;
          count += 1;
          lastUrl = url;
          retries = 5;
          if (imp.pages) {
            imp.pages(url, curPage, addAndLoad, ex, getPageInfo);
          } else {
            var colonIdx = url.indexOf(':');
            if(colonIdx > -1) {
              url = location.protocol + url.slice(colonIdx + 1);
            }
            xhr.open('get', url);
            imp.beforexhr && imp.beforexhr(xhr);
            xhr.onload = getPageInfo;
            xhr.onerror = function() {
              log('failed to load page, aborting', 'error');
            };
            xhr.send();
          }
        },
        count = 1,
        pagesLoaded = curPage - 1,
        lastUrl, UI, resumeUrl, retries;
    if (!imgUrl || (!nextUrl && curPage < numPages)) {
      log('failed to retrieve ' + (!imgUrl ? 'image url' : 'next page url'), 'exit');
    }
  
    // gather chapter stats
    pageStats.curChap = ex('curchap', {
      type: 'index',
      invIdx: !!imp.invchap
    });
    pageStats.numChaps = ex('numchaps');
  
    // do some checks on the chapter urls
    nextChapter = (nextChapter && nextChapter.trim() === location.href + '#' ? null : nextChapter);
    prevChapter = (prevChapter && prevChapter.trim() === location.href + '#' ? null : prevChapter);
  
    UI = getViewer(prevChapter, nextChapter);
  
    UI.statsPages.textContent = ' 0/1 loaded, ' + numPages + ' total';
  
    if (mLoadNum !== 'all') {
      window.addEventListener('scroll', throttle(function(e) {
        if (!resumeUrl) return; // exit early if we don't have a position to resume at
        if(!UI.imageHeight) {
          UI.imageHeight = getEl('.ml-images img').clientHeight;
        }
        var scrollBottom = document.body.scrollHeight - ((document.body.scrollTop || document.documentElement.scrollTop) + window.innerHeight);
        if (scrollBottom < UI.imageHeight * 2) {
          log('user scroll nearing end, loading more images starting from ' + resumeUrl);
          loadNextPage(resumeUrl);
        }
      }, 100));
    }
  
    addAndLoad(imgUrl, nextUrl);
  
  };
  
  var waitAndLoad = function(imp) {
    isLoaded = true;
    if(imp.wait) {
      var waitType = typeof imp.wait;
      if(waitType === 'number') {
        setTimeout(loadManga.bind(null, imp), imp.wait || 0);
      } else {
        var isReady = waitType === 'function' ? imp.wait.bind(imp) : function() {
          return getEl(imp.wait);
        };
        var intervalId = setInterval(function() {
          if(isReady()) {
            log('Condition fulfilled, loading');
            clearInterval(intervalId);
            loadManga(imp);
          }
        }, 200);
      }
    } else {
      loadManga(imp);
    }
  };
  
  var MLoaderLoadImps = function(imps) {
    var success = imps.some(function(imp) {
      if (imp.match && (new RegExp(imp.match, 'i')).test(pageUrl)) {
        currentImpName = imp.name;
        if (W.BM_MODE || (autoload !== 'no' && (mAutoload || autoload))) {
          log('autoloading...');
          waitAndLoad(imp);
          return true;
        }
        // setup load hotkey
        var loadHotKey = function(e) {
          if(e.ctrlKey && e.keyCode == 188) { // ctrl + , (comma)
            e.preventDefault();
            btnLoad.click();
            window.removeEventListener('keydown', loadHotKey);
          }
        };
        window.addEventListener('keydown', loadHotKey);
        // append button to dom that will trigger the page load
        btnLoad = createButton('Load Manga', function(evt) {
          waitAndLoad(imp);
          this.remove();
        }, btnLoadCss);
        document.body.appendChild(btnLoad);
        return true;
      }
    });
  
    if (!success) {
      log('no implementation for ' + pageUrl, 'error');
    }
  };
  
  var pageUrl = window.location.href,
      btnLoadCss = toStyleStr({
        'position': 'fixed',
        'bottom': 0,
        'right': 0,
        'padding': '5px',
        'margin': '0 10px 10px 0',
        'z-index': '9999999999'
      }),
      currentImpName, btnLoad;
  
  // indicates whether UI loaded
  var isLoaded = false;
  // used when switching chapters
  var autoload = storeGet('autoload');
  // manually set by user in menu
  var mAutoload = storeGet('mAutoload') || false;
  // should we load less pages at a time?
  var mLoadNum = storeGet('mLoadNum') || 10;
  // holder for statistics
  var pageStats = {
    numPages: null, numLoaded: null, loadLimit: null, curChap: null, numChaps: null
  };
  
  // clear autoload
  storeDel('autoload');
  
  log('starting...');
  
  // extra check for settings (hack) on dumb firefox/scriptish, settings aren't udpated until document end
  W.document.addEventListener('DOMContentLoaded', function(e) {
    if(!isLoaded) return;
    // used when switching chapters
    autoload = storeGet('autoload');
    // manually set by user in menu
    mAutoload = storeGet('mAutoload') || false;
    // should we load less pages at a time?
    mLoadNum = storeGet('mLoadNum') || 10;
    if(autoload || mAutoload) {
      btnLoad.click();
    }
  });
  MLoaderLoadImps(implementations);
  