// ==UserScript==
// @name         Nhentai Manga Loader
// @namespace    http://www.nhentai.net
// @version      4.1
// @description  Loads nhentai manga chapters into one page in a long strip format with image scaling, click events, and a dark mode for reading.
// @match        *://nhentai.net/g/*/*
// @icon         https://clipground.com/images/nhentai-logo-5.png
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @license      MIT
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    let loadedPages = 0; // Track loaded pages
    let totalPages = 0; // Track total pages
    let loadingImages = 0; // Track loading images
    let totalImages = 0; // Track total images

    // Helper to create custom style sheets for elements
    function addCustomStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            #manga-container {
                max-width: 100vw;
                margin: 0 auto;
                padding: 0;
            }
            .manga-page-container {
                position: relative;
                display: block;
                margin: 0;
            }
            .manga-page-container img {
                max-width: 100%;
                display: block;
                margin: 3px auto;
                border-radius: 0;
                transition: all 0.3s ease;
                box-shadow: none;
            }
            .ml-counter {
                background-color: #222;
                color: white;
                border-radius: 10px;
                width: 40px;
                margin-left: auto;
                margin-right: auto;
                margin-top: -8.8px;
                padding-left: 5px;
                padding-right: 5px;
                border: 1px solid white;
                z-index: 100;
                position: relative;
                font-size: 9px;
                font-family: 'Open Sans', sans-serif;
                top: 4px;
            }
            .exit-btn {
                background-color: #e74c3c;
                color: white;
                padding: 5px 10px;
                font-size: 14px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                margin: 10px auto;
                display: block;
                text-align: center;
            }
            .exit-btn:hover {
                background-color: #c0392b;
            }
            .exit-btn:active {
                background-color: #a93226;
            }
            .ml-stats {
                position: fixed;
                bottom: 10px;
                right: 10px;
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                border-radius: 8px;
                padding: 3px;
                z-index: 1000;
                font-family: 'Open Sans', sans-serif;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }
            .ml-stats-content {
                display: flex;
                align-items: center;
                cursor: pointer;
            }
            .ml-button {
                cursor: pointer;
                margin-left: 5px;
            }
            .ml-box {
                display: none;
                background-color: #333;
                color: white;
                padding: 10px;
                border-radius: 5px;
                margin-top: 5px;
                width: 200px;
            }
        `;
        document.head.appendChild(style);
    }

//------------------------------------------------------------------------------**Remove this when transfer over to Nhentai+**------------------------------------------------------------------------------

let isPopupVisible = false; // Flag to track if the popup is visible

function showPopupForSavedPosition(message, onConfirm, options = {}) {
    const existingPopup = document.getElementById('popup');
    if (existingPopup) {
        document.body.removeChild(existingPopup);
    }

    const popup = document.createElement('div');
    popup.id = 'popup';
    popup.innerHTML = `
        <div class="popup-content" role="alert">
            <p>${message}</p>
            <button class="confirm-btn">${options.confirmText || 'Yes'}</button>
            <button class="cancel-btn">${options.cancelText || 'No'}</button>
        </div>
    `;
    document.body.appendChild(popup);

    // Set the popup visibility flag
    isPopupVisible = true; 

    // Add CSS styling for the popup
    const style = document.createElement('style');
    style.textContent = `
        #popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            border-radius: 5px;
            z-index: 9999;
            padding: 15px;
            max-width: 300px;
            text-align: center;
        }
        .popup-content {
            position: relative;
            padding: 10px;
        }
        .confirm-btn,
        .cancel-btn {
            margin-top: 10px;
            background: none;
            border: none;
            color: #fff;
            font-size: 18px;
            cursor: pointer;
            transition: color 0.3s, transform 0.3s;
            margin: 0 5px; /* Space between buttons */
        }
        .confirm-btn:hover,
        .cancel-btn:hover {
            color: #ff0000; /* Change color on hover */
            transform: scale(1.1); /* Slightly enlarge on hover */
        }
    `;
    document.head.appendChild(style);

    // Handle confirmation button click
    document.querySelector('.confirm-btn').addEventListener('click', function() {
        document.body.removeChild(popup);
        document.head.removeChild(style);
        isPopupVisible = false; // Reset the flag when popup is closed
        if (onConfirm) onConfirm(); // Call the onConfirm callback
    });

    // Handle cancel button click
    document.querySelector('.cancel-btn').addEventListener('click', function() {
        document.body.removeChild(popup);
        document.head.removeChild(style);
        isPopupVisible = false; // Reset the flag when popup is closed
    });

    // Auto-close feature based on options
    const duration = options.duration || 10000; // Default to 10 seconds if not specified
    setTimeout(() => {
        if (document.body.contains(popup)) {
            document.body.removeChild(popup);
            document.head.removeChild(style);
            isPopupVisible = false; // Reset the flag when auto-closed
        }
    }, duration); // Use the specified duration
}



//------------------------------------------------------------------------------**Remove this when transfer over to Nhentai+**------------------------------------------------------------------------------

// Function to extract manga ID from URL
function extractMangaId(url) {
    const match = url.match(/\/g\/(\d+)/);
    return match ? match[1] : null;
}

function getCurrentPage(entry) {
  const pageElements = document.querySelectorAll('.manga-page-container');
  for (let i = 0; i < pageElements.length; i++) {
    if (entry.target === pageElements[i]) {
      const imgElement = pageElements[i].querySelector('img');
      const altText = imgElement.alt;
      const pageNumber = parseInt(altText.replace('Page ', ''));
      return pageNumber;
    }
  }
  return 1; // Default to page 1 if no current page is found
}


    // Create the "Exit" button
    function createExitButton() {
        const button = document.createElement('button');
        button.textContent = 'Exit';
        button.className = 'exit-btn';
        return button;
    }

    // Add page counter below the image
    function addPageCounter(pageNumber) {
        const counter = document.createElement('div');
        counter.className = 'ml-counter';
        counter.textContent = `${pageNumber}`;
        return counter;
    }

    // Update stats display
    function updateStats() {
        const statsContainer = document.querySelector('.ml-stats-pages');
        if (statsContainer) {
            statsContainer.textContent = `${loadedPages}/${totalPages} loaded`;
        }
        const loadingContainer = document.querySelector('.ml-loading-images');
        if (loadingContainer) {
            loadingContainer.textContent = `${loadingImages} images loading`;
        }
        const totalImagesContainer = document.querySelector('.ml-total-images');
        if (totalImagesContainer) {
            totalImagesContainer.textContent = `${totalImages} images in chapter`;
        }
    }

// Declare reloadMode at the top level
let reloadMode = false; // Flag to track reload mode

async function createStatsWindow() {
    const statsWindow = document.createElement('div');
    statsWindow.className = 'ml-stats';

    // Use a wrapper to keep the button and content aligned
    const statsWrapper = document.createElement('div');
    statsWrapper.style.display = 'flex';
    statsWrapper.style.alignItems = 'center'; // Center vertically

    const collapseButton = document.createElement('span');
    collapseButton.className = 'ml-stats-collapse';
    collapseButton.title = 'Hide stats';
    collapseButton.textContent = '>>';
    collapseButton.style.cursor = 'pointer';
    collapseButton.style.marginRight = '10px'; // Space between button and content
    collapseButton.addEventListener('click', async function() {
        contentContainer.style.display = contentContainer.style.display === 'none' ? 'block' : 'none';
        collapseButton.textContent = contentContainer.style.display === 'none' ? '<<' : '>>';

        // Save the collapse state
        await GM.setValue('statsCollapsed', contentContainer.style.display === 'none');
    });

    const contentContainer = document.createElement('div');
    contentContainer.className = 'ml-stats-content';

    const statsText = document.createElement('span');
    statsText.className = 'ml-stats-pages';
    statsText.textContent = `0/0 loaded`; // Initial stats

    const infoButton = document.createElement('i');
    infoButton.className = 'fa fa-question-circle ml-button ml-info-button';
    infoButton.title = 'See userscript information and help';
    infoButton.addEventListener('click', function() {
        alert('This userscript loads manga pages in a single view. Click on an image to toggle size.');
    });

    const moreStatsButton = document.createElement('i');
    moreStatsButton.className = 'fa fa-chart-pie ml-button ml-more-stats-button';
    moreStatsButton.title = 'See detailed page stats';
    moreStatsButton.addEventListener('click', function() {
        const statsBox = document.querySelector('.ml-floating-msg');
        statsBox.style.display = statsBox.style.display === 'block' ? 'none' : 'block';
    });

    const refreshButton = document.createElement('i');
    refreshButton.className = 'fa fa-sync-alt ml-button ml-manual-reload';
    refreshButton.title = 'Click an image to reload it.';
    refreshButton.addEventListener('click', function() {
        reloadMode = !reloadMode;
        refreshButton.style.color = reloadMode ? 'orange' : '';
        console.log(`Reload mode is now ${reloadMode ? 'enabled' : 'disabled'}.`);
    });

    contentContainer.appendChild(statsText);
    contentContainer.appendChild(infoButton);
    contentContainer.appendChild(moreStatsButton);
    contentContainer.appendChild(refreshButton);

    statsWrapper.appendChild(collapseButton);
    statsWrapper.appendChild(contentContainer);
    statsWindow.appendChild(statsWrapper);

    const statsBox = document.createElement('pre');
    statsBox.className = 'ml-box ml-floating-msg';
    statsBox.innerHTML = `<strong>Stats:</strong><br><span class="ml-loading-images">0 images loading</span><br><span class="ml-total-images">536 images in chapter</span><br><span class="ml-loaded-pages">0 pages parsed</span>`;
    statsBox.style.display = 'none'; // Initially hidden
    statsWindow.appendChild(statsBox);

    // Check and set initial collapse state
    const collapsed = await GM.getValue('statsCollapsed', false);
    if (collapsed) {
        contentContainer.style.display = 'none';
        collapseButton.textContent = '<<'; // Change to indicate expanded state
    }

    // Add hover effect
    statsWindow.style.transition = 'opacity 0.3s';
    statsWindow.style.opacity = '0.6'; // Dimmed by default

    statsWindow.addEventListener('mouseenter', function() {
        statsWindow.style.opacity = '1'; // Fully visible on hover
    });

    statsWindow.addEventListener('mouseleave', function() {
        statsWindow.style.opacity = '0.6'; // Dim again on mouse leave
    });

    document.body.appendChild(statsWindow);
}



// Add the click event to images
function addClickEventToImage(image) {
    image.addEventListener('click', function() {
        if (reloadMode) {
            const imgSrc = image.dataset.src || image.src;
            image.src = ''; // Clear the src to trigger reload
            setTimeout(() => {
                image.src = imgSrc; // Retry loading after clearing
            }, 100); // Short delay to ensure proper reload
        }
    });
}



    // Function to hide specified elements
    function hideElements() {
        const elementsToHide = ['#image-container', '#content', 'nav'];
        elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

// Add this at the top level to track image loading status
const imageStatus = []; // Array to track the status of each image



function getCurrentVisiblePage() {
    const pageContainers = document.querySelectorAll('.manga-page-container');
    let visiblePage = 0; // Default to the first page
    const totalPages = pageContainers.length; // Get total number of pages

    pageContainers.forEach((container, index) => {
        const rect = container.getBoundingClientRect();
        const pageHeight = rect.bottom - rect.top;
        const visibleHeight = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
        const visiblePercentage = (visibleHeight / pageHeight) * 100;

        // If the page is more than 50% visible, mark it as the current page
        if (visiblePercentage >= 50) {
            visiblePage = index + 1; // Convert to 1-based index
        }

        // Special case: If the last page is partially visible, save it
        if (index + 1 === totalPages && visiblePercentage >= 10) {
            visiblePage = totalPages; // Consider the last page as visible if it's more than 10% visible
        }
    });

    return visiblePage; // Return the visible page number
}



// Add a scroll event listener to the manga container// 

function addScrollListener(mangaContainer, mangaId) {
    mangaContainer.addEventListener('scroll', async () => {
        // Only save the current page if the popup is not visible
        if (!isPopupVisible || freshloadedcache) {
            const currentPage = getCurrentVisiblePage();
            console.log(`Current visible page: ${currentPage}`);
            await saveCurrentPosition(mangaId, currentPage);
        }
    });
}



// Load all manga images with page separators and scaling
function loadMangaImages(mangaId) {
    hideElements();
    createStatsWindow(); // Create the stats window

    const mangaContainer = document.createElement('div');
    mangaContainer.id = 'manga-container';
    document.body.appendChild(mangaContainer);
    
    // Add the scroll listener for saving the current position immediately
    addScrollListener(mangaContainer, mangaId);
    

    const exitButtonTop = createExitButton();
    mangaContainer.appendChild(exitButtonTop);

    totalPages = parseInt(document.querySelector('.num-pages').textContent.trim());
    totalImages = totalPages; // Update total images for stats
    const initialPage = parseInt(window.location.href.match(/\/g\/\d+\/(\d+)/)[1]);
    let currentPage = initialPage;

    // Queue for tracking loading images
    const loadingQueue = [];
    const maxConcurrentLoads = /Mobi/.test(navigator.userAgent) ? 10 : 40; // Maximum number of concurrent image loads

    // Helper to create the page container with images
    function createPageContainer(pageNumber, imgSrc) {
        const container = document.createElement('div');
        container.className = 'manga-page-container';

        // Create the actual image element
        const img = document.createElement('img');
        img.src = ''; // Start with empty src to avoid loading it immediately
        img.dataset.src = imgSrc; // Store the actual src in data attribute
        img.alt = `Page ${pageNumber}`;

        // Add page counter below the image
        const pageCounter = addPageCounter(pageNumber);

        // Append the image and page counter
        container.appendChild(img);
        container.appendChild(pageCounter); // <-- Page number is shown here

          // Add exit button to the bottom of the last loaded page
    if (pageNumber === totalPages) {
        const exitButton = createExitButton();
        container.appendChild(exitButton);
        exitButton.addEventListener('click', () => {
            window.location.reload();
        })
    }

        // Track the image status
        imageStatus[pageNumber] = { src: imgSrc, loaded: false, attempts: 0 };

        // Error handling and event listeners
        addErrorHandlingToImage(img, imgSrc, pageNumber);
        addClickEventToImage(img);
        mangaContainer.appendChild(container);

        loadedPages++; // Increment loaded pages count
        updateStats(); // Update stats display

        observePageContainer(container); // Observe for lazy loading

        // Save scroll position as soon as page container is created
        const mangaId = extractMangaId(window.location.href);
        const currentPage = getCurrentVisiblePage(); // Get the current visible page number
        if (!isPopupVisible || freshloadedcache) {
            saveCurrentPosition(mangaId, currentPage);
        }
        

        // Start loading the actual image
        img.src = imgSrc; // Set the src to load the image

        // Mark as loaded on load
        img.onload = () => {
            imageStatus[pageNumber].loaded = true; // Mark as loaded
            loadingImages--; // Decrement loading images count
            updateStats(); // Update loading images count
        };

        return container;
    }


let freshloadedcache = false;

// Function to save image data to local storage
function saveImageToCache(pageNumber, imgSrc, nextLink, mangaId) {
    const cacheKey = `imagePage_${mangaId}_${pageNumber}`;
    const cacheData = { imgSrc, nextLink, timestamp: Date.now(), mangaId };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
}

// Function to get image data from local storage
function getImageFromCache(pageNumber, mangaId) {
   // console.log("freshloadedcache", freshloadedcache);
    freshloadedcache = true;
    setInterval(() => {
        //console.log("freshloadedcache", freshloadedcache);
        freshloadedcache = false;
    }, 3000)
    const cacheKey = `imagePage_${mangaId}_${pageNumber}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }
    return null;
}

// Add a delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Track if the app is online or offline
let isOnline = navigator.onLine;

// Add event listeners to detect connection state changes
window.addEventListener('offline', () => {
    console.warn('You are offline. Pausing image loading.');
    isOnline = false;
});

window.addEventListener('online', () => {
    console.log('Back online. Resuming image loading.');
    isOnline = true;
    if (loadingQueue.length > 0) {
        processQueue(); // Resume processing the queue
    } else {
        // If queue is empty, manually trigger the next page load
        loadNextBatchOfImages(); // Load the next set of images if queue is empty
    }
});

// Load a single page with error handling, retry logic, and caching
async function loadPage(pageNumber, pageUrl, retryCount = 0) {
    if (loadingImages >= maxConcurrentLoads || !isOnline) {
        return; // Exit if we're at max concurrent loads or offline
    }

    loadingImages++;
    updateStats(); // Update loading images count

    const mangaId = extractMangaId(pageUrl);
    if (!mangaId) {
        console.error(`Could not extract manga ID from URL: ${pageUrl}`);
        loadingImages--;
        updateStats();
        handleFailedImage(pageNumber);
        return;
    }

    // Check cache first
    const cachedImage = getImageFromCache(pageNumber, mangaId);
    if (cachedImage && cachedImage.mangaId === mangaId) {
        console.log(`Loading page ${pageNumber} from cache for manga ${mangaId}`);
        const pageContainer = createPageContainer(pageNumber, cachedImage.imgSrc);
        imageStatus[pageNumber].loaded = true; // Mark as loaded
        
        // Ensure position is saved for cached pages
        const currentPage = pageNumber;
        saveCurrentPosition(mangaId, currentPage); // Save the position for cached pages
        
        

        loadingImages--;
        updateStats(); // Update loading images count

        // Pre-fetch the next page if it's not the last page
        if (pageNumber < totalPages && cachedImage.nextLink) {
            loadingQueue.push({ pageNumber: pageNumber + 1, pageUrl: cachedImage.nextLink });
            processQueue(); // Check the queue
        }
        return;
    }

    try {
        const response = await fetch(pageUrl);

        if (response.status === 429) {
            if (retryCount < maxRetries) {
                console.warn(`Rate limit exceeded for page ${pageNumber}. Retrying in ${retryDelay} ms...`);
                await delay(retryDelay); // Wait before retrying
                loadPage(pageNumber, pageUrl, retryCount + 1); // Retry loading the same page
                return;
            } else {
                console.error(`Failed to load page ${pageNumber} after ${maxRetries} attempts.`);
                loadingImages--;
                updateStats(); // Update loading images count
                handleFailedImage(pageNumber); // Handle failed image loading
                return;
            }
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const imgElement = doc.querySelector('#image-container > a > img');
        const nextLink = doc.querySelector('#image-container > a').href;
        const imgSrc = imgElement.getAttribute('data-src') || imgElement.src;

        // Save to cache
        saveImageToCache(pageNumber, imgSrc, nextLink, mangaId);

        const pageContainer = createPageContainer(pageNumber, imgSrc);
        imageStatus[pageNumber].loaded = true; // Mark as loaded

        loadingImages--;
        updateStats(); // Update loading images count

        // Pre-fetch the next page once the current one loads
        if (pageNumber < totalPages && nextLink) {
            loadingQueue.push({ pageNumber: pageNumber + 1, pageUrl: nextLink });
            processQueue(); // Check the queue
        }
    } catch (err) {
        loadingImages--;
        console.error(err);
        updateStats(); // Update loading images count
        handleFailedImage(pageNumber); // Handle failed image loading
    }
}

// In your processing queue, ensure a delay ONLY after 429 status
async function processQueue() {
    while (loadingQueue.length > 0 && loadingImages < maxConcurrentLoads && isOnline) {
        const { pageNumber, pageUrl } = loadingQueue.shift(); // Get the next page to load
        loadPage(pageNumber, pageUrl); // Load it
    }
}

// Manually trigger the next batch of images if needed
function loadNextBatchOfImages() {
    if (loadingQueue.length === 0 && isOnline) {
        const nextPageNumber = getNextPageNumber(); // Logic to get the next page number
        const nextPageUrl = getNextPageUrl(nextPageNumber); // Logic to get the next page URL

        if (nextPageUrl) {
            loadingQueue.push({ pageNumber: nextPageNumber, pageUrl: nextPageUrl });
            processQueue(); // Resume loading
        }
    }
}

// Configuration for retry logic
const maxRetries = 5; // Maximum number of retries for rate limit
const retryDelay = 5000; // Delay in milliseconds before retrying only on 429 status





    // Handle failed image loading attempts
    function handleFailedImage(pageNumber) {
        if (imageStatus[pageNumber]) {
            imageStatus[pageNumber].attempts++;
            if (imageStatus[pageNumber].attempts <= 3) { // Retry up to 3 times
                console.warn(`Retrying to load image for page ${pageNumber}...`);
                loadPage(pageNumber, document.querySelector(`#image-container > a`).href); // Reattempt loading the same page
            } else {
                console.error(`Failed to load image for page ${pageNumber} after 3 attempts.`);
            }
        }
    }



const firstImageElement = document.querySelector('#image-container > a > img');
const firstImgSrc = firstImageElement.getAttribute('data-src') || firstImageElement.src;
createPageContainer(currentPage, firstImgSrc);

const firstImageLink = document.querySelector('#image-container > a').href;
loadingQueue.push({ pageNumber: currentPage + 1, pageUrl: firstImageLink }); // Add to queue
processQueue(); // Start processing the queue

// Observe all image containers for lazy loading
observeAndPreloadImages(); // <-- Add this here to track and lazy-load images

exitButtonTop.addEventListener('click', function() {
    window.location.reload();
});
}

// Pre-load next few images while user scrolls
function observeAndPreloadImages() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const imgElement = entry.target.querySelector('img');
          if (imgElement && imgElement.dataset.src) {
            imgElement.src = imgElement.dataset.src; // Load the image
            observer.unobserve(entry.target); // Stop observing after loading
  
            // Save the current position
            const mangaId = extractMangaId(window.location.href);
            const currentPage = getCurrentVisiblePage(entry); // Get the current page number
            if (!isPopupVisible || freshloadedcache) {
                saveCurrentPosition(mangaId, currentPage);
            }
          }
        }
      });
    }, {
      rootMargin: '300px 0px', // Load images 300px before they appear
      threshold: 0.1
    });
  
    // Observe each image container
    const imageContainers = document.querySelectorAll('.manga-page-container');
    imageContainers.forEach((container) => observer.observe(container));
  }

// Enhanced error handling with retries
function addErrorHandlingToImage(image, imgSrc, pageNumber) {
    image.onerror = function() {
        console.warn(`Failed to load image: ${imgSrc} on page ${pageNumber}. Retrying...`);
        
        // Retry logic for failed images
        if (!imageStatus[pageNumber].retryCount) {
            imageStatus[pageNumber].retryCount = 0;
        }

        // Retry up to 5 times for failed images
        if (imageStatus[pageNumber].retryCount < 5) {
            imageStatus[pageNumber].retryCount++;
            setTimeout(() => {
                image.src = ''; // Clear the src to force reload
                image.src = imgSrc; // Retry loading the image
            }, 1000); // Delay before retrying
        } else {
            console.error(`Failed to load image on page ${pageNumber} after multiple attempts.`);
            image.alt = `Failed to load page ${pageNumber}`; // Display error message after retries
        }
    };
}



    // Create an IntersectionObserver to prioritize loading images that are in or near the viewport
// Create an IntersectionObserver to prioritize loading images that are in or near the viewport
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const imgElement = entry.target.querySelector('img');
            if (imgElement && imgElement.dataset.src) {
                imgElement.src = imgElement.dataset.src; // Load the image
                observer.unobserve(entry.target); // Stop observing after loading
                
                // Save the current scroll position as soon as the image starts loading
                const mangaId = extractMangaId(window.location.href);
                const currentPage = getCurrentVisiblePage(); // Get the current visible page number
                if (!isPopupVisible || freshloadedcache) {
                    saveCurrentPosition(mangaId, currentPage);
                }
            }
            
        }
    });
}, {
    rootMargin: '200px 0px', // Adjust for preloading images slightly outside the viewport
    threshold: 0.1 // Trigger loading when 10% of the image is in view
});

function observePageContainer(container) {
    observer.observe(container); // Observe each page container for lazy loading
}

    
    addCustomStyles();


// Compress data into a string format
function compressData(data) {
    return JSON.stringify(data);
}

// Decompress data from string format
function decompressData(data) {
    return JSON.parse(data);
}

async function storeData(mangaId, pageNum) {
  const existingData = await retrieveData(mangaId);
  const existingPageNum = existingData ? existingData.pageNum : 0;

  if (pageNum > existingPageNum) {
    const currentTime = Date.now();
    const data = { pageNum, lastAccessed: currentTime };
    const compressedData = compressData(data);
    await GM.setValue(mangaId, compressedData);

    // Manage storage size if it exceeds the limit
    await manageStorage();
  }
}

// Retrieve data from Tampermonkey storage
async function retrieveData(mangaId) {
    const compressedData = await GM.getValue(mangaId, null);
    if (compressedData) {
        return decompressData(compressedData);
    }
    return null;
}

// Delete the least recently accessed data if the limit is reached
async function manageStorage() {
    const MAX_ENTRIES = 50;  // Limit to store 50 recent hentai
    const keys = await GM.listValues();
    if (keys.length > MAX_ENTRIES) {
        const entries = [];
        for (let key of keys) {
            const value = await GM.getValue(key);
            const data = decompressData(value);
            entries.push({ key, lastAccessed: data.lastAccessed });
        }

        // Sort by last accessed time, oldest first
        entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

        // Remove the oldest entries until we're under the limit
        const excess = entries.length - MAX_ENTRIES;
        for (let i = 0; i < excess; i++) {
            await GM.deleteValue(entries[i].key);
        }
    }
}

let isRestoringPosition = false; // Flag to prevent overwriting saved position



function getCurrentPageFromURL() {
    const match = window.location.pathname.match(/\/g\/\d+\/(\d+)\//);
    return match ? parseInt(match[1], 10) : 1; // Default to 1 if not found
}


async function loadSavedPosition(mangaId) {
    console.log(`Trying to load saved position for: ${mangaId}`);

    const savedData = await retrieveData(mangaId);
    console.log(`Saved data retrieved:`, savedData); // Log the retrieved data

const savedPage = savedData.pageNum;
if (savedPage && savedPage === totalPages) {
  await GM.deleteValue(mangaId);
  console.log(`Saved position deleted for ${mangaId} since it's equal to total pages.`);
  return;
}

    if (savedData) {
        const savedPage = savedData.pageNum;
        console.log(`Saved page is: ${savedPage}`); // Log the saved page number

        const currentPage = getCurrentPageFromURL(); // Get current page from URL
        console.log(`Current page is: ${currentPage}`); // Log the current page number

        // Only proceed if the saved page is different from the current one
        if (savedPage && savedPage !== currentPage) {
            console.log(`Restoring to saved page: ${savedPage}`);
            isRestoringPosition = true; // Set the flag before restoring the position

            const pageContainers = document.querySelectorAll('.manga-page-container');
            console.log(`Total page containers loaded: ${pageContainers.length}`); // Log how many pages are loaded

            if (pageContainers.length > 0) {
                // Directly scroll to the saved page
                scrollToSavedPage(pageContainers, savedPage);
            } else {
                console.log(`Waiting for pages to load...`);
                waitForPageContainers(savedPage); // Use a MutationObserver to wait for containers
            }
        } else {
            console.log(`Not restoring saved position for ${mangaId}. Current page is the same as saved page.`);
        }
    } else {
        console.log(`No saved position found for ${mangaId}.`);
    }
}

function waitForPageContainers(savedPageWithOffset) {
    const observer = new MutationObserver((mutations, obs) => {
        const pageContainers = document.querySelectorAll('.manga-page-container');
        if (pageContainers.length >= savedPageWithOffset) {
            console.log(`Page containers are now loaded: ${pageContainers.length}`);
            obs.disconnect(); // Stop observing once the pages are loaded
            scrollToSavedPage(pageContainers, savedPageWithOffset); // Scroll to the saved page
        }
    });

    // Observe changes in the DOM (specifically looking for added nodes)
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Queue for specific page loading
const specificPageQueue = [];


// Function to load a specific page
async function loadSpecificPage(pageNumber) {
    const mangaId = extractMangaId(window.location.href);
    const pageUrl = `/g/${mangaId}/${pageNumber}/`;

    // Check if the page is already loaded
    const loadedPageContainers = document.querySelectorAll('.manga-page-container');
    if (loadedPageContainers.length >= pageNumber) {
        console.log(`Page ${pageNumber} is already loaded.`);
        return; // Exit if the page is already loaded
    }

    console.log(`Requesting to load page ${pageNumber}. Adding to specific loading queue.`);
    specificPageQueue.push({ pageNumber, pageUrl });
    processSpecificPageQueue(); // Start processing the specific page queue
}


// Function to process the specific page loading queue
async function processSpecificPageQueue(maxConcurrentLoads) {
    while (specificPageQueue.length > 0 && loadingImages < maxConcurrentLoads) {
        const { pageNumber, pageUrl } = specificPageQueue.shift(); // Get the next page to load
        console.log(`Loading page ${pageNumber} from specific queue with URL: ${pageUrl}`);
        await loadPage(pageNumber, pageUrl); // Load the page
    }
}


async function scrollToSavedPage(pageContainers, savedPage, savedImgSrc) {
    const currentPage = getCurrentPageFromURL();
    const savedPageIndex = savedPage - currentPage - 1;

    console.log(`Current page: ${currentPage}, Adjusted index for saved page: ${savedPageIndex}`);
    
    // Check if the adjusted index is out of bounds
    if (savedPageIndex < 0 || savedPageIndex >= pageContainers.length) {
        console.warn(`Adjusted saved page index ${savedPageIndex} is out of bounds.`);
        console.log(`Page ${savedPage} is not loaded yet. Prioritizing its load.`);
        loadSpecificPage(savedPage); // Load the specific page
        return;
    }

    const savedPageElement = pageContainers[savedPageIndex];
    const img = savedPageElement.querySelector('img');

    if (img && img.complete) {
        console.log(`Image for page ${savedPage} loaded. Scrolling to it.`);
        savedPageElement.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.log(`Image for page ${savedPage} not loaded yet. Requesting to load this specific page.`);
        loadSpecificPage(savedPage);
    }
}



// Function to wait for the specific page to load using MutationObserver
function waitForPageToLoad(savedPage) {
    const observer = new MutationObserver((mutations, obs) => {
        const pageContainers = document.querySelectorAll('.manga-page-container');
        const savedPageIndex = savedPage - getCurrentPageFromURL() - 1;

        if (savedPageIndex >= 0 && savedPageIndex < pageContainers.length) {
            const savedPageElement = pageContainers[savedPageIndex];
            const img = savedPageElement.querySelector('img');

            // Check if the image is now loaded
            if (img && img.complete) {
                console.log(`Image for page ${savedPage} is now loaded. Scrolling to it.`);
                savedPageElement.scrollIntoView({ behavior: 'smooth' });
                isRestoringPosition = false; // Reset flag after scrolling
                obs.disconnect(); // Stop observing once the page is loaded
            }
        }
    });

    // Observe changes in the DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Optionally, you can set a timeout to stop observing after a certain time
    setTimeout(() => {
        obs.disconnect(); // Stop observing if the page does not load within the time limit
        console.warn(`Timed out waiting for page ${savedPage} to load.`);
    }, 5000); // 10 seconds timeout (adjust as needed)
}


// Function to prioritize loading a specific page
function prioritizeLoadingPage(savedPage) {
    const nextPageUrl = getNextPageUrl(savedPage); // Get the URL for the saved page
    if (nextPageUrl) {
        // Push the saved page to the front of the loading queue
        loadingQueue.unshift({ pageNumber: savedPage, pageUrl: nextPageUrl });
        processQueue(); // Start processing the queue to load the saved page
    } else {
        console.error(`No URL found for page ${savedPage}.`);
    }
}


function getNextPageUrl(pageNumber) {
    console.log(`Searching for URL for page ${pageNumber}`);
    const pageLink = document.querySelector(`#image-container a[href*='/g/'][href*='/${pageNumber}/']`);
    console.log(`Found page link: ${pageLink}`);
    if (pageLink) {
      return pageLink.href;
    } else {
      console.log(`No URL found for page ${pageNumber}`);
      return null;
    }
  }




// Save the current position, but only if we are not restoring the saved position
async function saveCurrentPosition(mangaId, currentPage) {
    const totalPages = document.querySelectorAll('.manga-page-container').length;

    // Check if the current page is actually visible in the viewport
    const pageContainer = document.querySelector(`.manga-page-container:nth-child(${currentPage})`);
    const rect = pageContainer.getBoundingClientRect();
    const tolerance = 50; // adjust this value as needed
    const isVisible = rect.top < window.innerHeight + tolerance && rect.bottom > -tolerance;

    // Only save the position if the page is visible
    if (!isVisible) {
        console.log(`Page ${currentPage} is not visible, skipping save.`);
        return; // Exit the function without saving the position
    }

    // If the current page is the second-to-last page, force-save the last page
    if (currentPage === totalPages - 1) {
        console.log(`You are on the second-to-last page. Saving the last page as the current position.`);
        currentPage = totalPages; // Hardcode it to save the last page
    }

    if (!isRestoringPosition) { // Only save if we are not restoring
        await storeData(mangaId, currentPage);
        console.log(`Position saved: Manga ID: ${mangaId}, Page: ${currentPage}`);
    }
}



// Periodically clean up storage
setInterval(manageStorage, 24 * 60 * 60 * 1000);  // Runs every 24 hours


    // Check if the image container has an image
    function isImageContainerVisible() {
        const imageContainer = document.querySelector('#image-container');
        return imageContainer && imageContainer.querySelector('img');
    }

    if (isImageContainerVisible()) {
        const loadMangaButton = document.createElement('button');
        loadMangaButton.textContent = 'Load Manga';
        loadMangaButton.className = 'load-manga-btn';
        loadMangaButton.style.position = 'fixed';
        loadMangaButton.style.bottom = '0';
        loadMangaButton.style.right = '0';
        loadMangaButton.style.padding = '5px';
        loadMangaButton.style.margin = '0 10px 10px 0';
        loadMangaButton.style.zIndex = '9999999999';
        document.body.appendChild(loadMangaButton);

     loadMangaButton.addEventListener('click', async function() {
       const mangaId = extractMangaId(window.location.href);
       if (mangaId) {
         loadMangaImages(); // Load the manga images first
     
         // Check if there's a saved position for the manga
         const savedPosition = await retrieveData(mangaId);
         if (savedPosition) {
           // Check if the saved position was deleted
           const savedPage = savedPosition.pageNum;
           if (savedPage && savedPage === totalPages) {
             await GM.deleteValue(mangaId);
             console.log(`Saved position deleted for ${mangaId} since it's equal to total pages.`);
           } else {
             // Show a popup asking the user if they want to load the saved position
             showPopupForSavedPosition("Do you want to load your last saved position?", async () => {
               await loadSavedPosition(mangaId);
             }, { 
               confirmText: 'Yes', // Custom confirmation text
               cancelText: 'No', // Custom cancellation text
               duration: 10000 // Optional duration for auto-close
             });
           }
         } else {
           // No saved position, proceed without prompting
           console.log('No saved position found for manga ID:', mangaId);
         }
       }
       loadMangaButton.remove();
     });
        
        
    }
})();
