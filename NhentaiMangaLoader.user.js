// ==UserScript==
// @name         Nhentai Manga Loader
// @namespace    http://www.nhentai.net
// @version      3.2
// @description  Loads nhentai manga chapters into one page in a long strip format with image scaling, click events, and a dark mode for reading.
// @match        *://nhentai.net/g/*/*
// @icon         https://clipground.com/images/nhentai-logo-5.png
// @grant GM.getValue
// @grant GM.setValue
// @grant GM.deleteValue
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
                padding: 10px;
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
            const imgSrc = image.dataset.src || image.src; // Get the source from data-src or src
            image.src = ''; // Clear the src to trigger reload
            image.src = imgSrc; // Set it again to reload
            console.log(`Reloading image: ${imgSrc}`);
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

// Load all manga images with page separators and scaling
function loadMangaImages() {
    hideElements();
    createStatsWindow(); // Create the stats window

    const mangaContainer = document.createElement('div');
    mangaContainer.id = 'manga-container';
    document.body.appendChild(mangaContainer);

    const exitButtonTop = createExitButton();
    mangaContainer.appendChild(exitButtonTop);

    totalPages = parseInt(document.querySelector('.num-pages').textContent.trim());
    totalImages = totalPages; // Update total images for stats
    const initialPage = parseInt(window.location.href.match(/\/g\/\d+\/(\d+)/)[1]);
    let currentPage = initialPage;

    // Queue for tracking loading images
    const loadingQueue = [];
    const maxConcurrentLoads = 50; // Maximum number of concurrent image loads

    // Helper to create the page container with images
    function createPageContainer(pageNumber, imgSrc) {
        const container = document.createElement('div');
        container.className = 'manga-page-container';
    
        // Create the placeholder image
        const placeholder = document.createElement('img');
        placeholder.src = 'path/to/placeholder.jpg'; // URL of your low-res or blurred placeholder
        placeholder.alt = `Loading page ${pageNumber}`;
        placeholder.className = 'placeholder-image'; // Optional: add CSS for styling
    
        // Create the actual image element
        const img = document.createElement('img');
        img.src = ''; // Start with empty src to avoid loading it immediately
        img.dataset.src = imgSrc; // Store the actual src in data attribute
        img.alt = `Page ${pageNumber}`;
    
        // Append the placeholder and the image
        container.appendChild(placeholder);
        container.appendChild(img);
    
        // Track the image status
        imageStatus[pageNumber] = { src: imgSrc, loaded: false, attempts: 0 };
    
        // Error handling and event listeners
        addErrorHandlingToImage(img, imgSrc, pageNumber);
        addClickEventToImage(img);
        mangaContainer.appendChild(container);
    
        loadedPages++; // Increment loaded pages count
        updateStats(); // Update stats display
    
        observePageContainer(container); // Observe for lazy loading
    
        // Start loading the actual image
        img.src = imgSrc; // Set the src to load the image
    
        // Replace the placeholder with the actual image on load
        img.onload = () => {
            placeholder.style.display = 'none'; // Hide placeholder
            img.style.display = 'block'; // Show the actual image
            imageStatus[pageNumber].loaded = true; // Mark as loaded
            loadingImages--; // Decrement loading images count
            updateStats(); // Update loading images count
        };
    
        return container;
    }
    

    // Function to load a single page
    function loadPage(pageNumber, pageUrl) {
        if (loadingImages >= maxConcurrentLoads) {
            return; // Exit if we're at max concurrent loads
        }

        loadingImages++;
        updateStats(); // Update loading images count

        fetch(pageUrl)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const imgElement = doc.querySelector('#image-container > a > img');
                const nextLink = doc.querySelector('#image-container > a').href;
                const imgSrc = imgElement.getAttribute('data-src') || imgElement.src;

                const pageContainer = createPageContainer(pageNumber, imgSrc);
                imageStatus[pageNumber].loaded = true; // Mark as loaded

                loadingImages--;
                updateStats(); // Update loading images count

                // Continue loading the next page if needed
                if (pageNumber < totalPages && nextLink) {
                    loadingQueue.push({ pageNumber: pageNumber + 1, pageUrl: nextLink });
                    processQueue(); // Check the queue
                } else {
                    const exitButtonBottom = createExitButton();
                    mangaContainer.appendChild(exitButtonBottom);
                    exitButtonBottom.addEventListener('click', function() {
                        window.location.reload();
                    });
                }
            })
            .catch(err => {
                loadingImages--;
                console.error(err);
                updateStats(); // Update loading images count
                handleFailedImage(pageNumber); // Handle failed image loading
            });
    }

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

    // Function to process the loading queue
    function processQueue() {
        while (loadingQueue.length > 0 && loadingImages < maxConcurrentLoads) {
            const { pageNumber, pageUrl } = loadingQueue.shift(); // Get the next page to load
            loadPage(pageNumber, pageUrl); // Load it
        }
    }

    const firstImageElement = document.querySelector('#image-container > a > img');
    const firstImgSrc = firstImageElement.getAttribute('data-src') || firstImageElement.src;
    createPageContainer(currentPage, firstImgSrc);

    const firstImageLink = document.querySelector('#image-container > a').href;
    loadingQueue.push({ pageNumber: currentPage + 1, pageUrl: firstImageLink }); // Add to queue
    processQueue(); // Start processing the queue

    exitButtonTop.addEventListener('click', function() {
        window.location.reload();
    });
}

// Modify the error handling function
function addErrorHandlingToImage(image, imgSrc, pageNumber) {
    image.onerror = function() {
        console.warn(`Failed to load image: ${imgSrc} on page ${pageNumber}. Retrying...`);
        handleFailedImage(pageNumber); // Call the handle failed image function
    };
}


    // Create an IntersectionObserver to prioritize loading images that are in or near the viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const imgElement = entry.target.querySelector('img');
                if (imgElement && imgElement.dataset.src) {
                    imgElement.src = imgElement.dataset.src;
                    observer.unobserve(entry.target);
                }
            }
        });
    }, {
        rootMargin: '200px 0px',
        threshold: 0.1
    });

    // Use the observer when images are created
    function observePageContainer(container) {
        observer.observe(container);
    }
    
    addCustomStyles();


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

        loadMangaButton.addEventListener('click', function() {
            loadMangaImages();
            loadMangaButton.remove();
        });
    }
})();
