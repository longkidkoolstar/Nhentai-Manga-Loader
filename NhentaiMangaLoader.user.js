// ==UserScript==
// @name         Nhentai Manga Loader
// @namespace    http://www.nhentai.net
// @version      3.0
// @description  Loads nhentai manga chapters into one page in a long strip format with image scaling, click events, and a dark mode for reading.
// @match        *://nhentai.net/g/*/*
// @icon         https://clipground.com/images/nhentai-logo-5.png
// @grant        none
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

function createStatsWindow() {
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
    collapseButton.addEventListener('click', function() {
        contentContainer.style.display = contentContainer.style.display === 'none' ? 'block' : 'none';
        collapseButton.textContent = contentContainer.style.display === 'none' ? '<<' : '>>';
    });

    const contentContainer = document.createElement('div');
    contentContainer.className = 'ml-stats-content';

    const statsText = document.createElement('span');
    statsText.className = 'ml-stats-pages';
    statsText.textContent = `0/0 loaded`; // Initial stats

    const infoButton = document.createElement('i');
    infoButton.className = 'fa fa-question-circle ml-button ml-info-button'; // Changed icon
    infoButton.title = 'See userscript information and help';
    infoButton.addEventListener('click', function() {
        alert('This userscript loads manga pages in a single view. Click on an image to toggle size.');
    });

    const moreStatsButton = document.createElement('i');
    moreStatsButton.className = 'fa fa-chart-pie ml-button ml-more-stats-button'; // Changed icon
    moreStatsButton.title = 'See detailed page stats';
    moreStatsButton.addEventListener('click', function() {
        const statsBox = document.querySelector('.ml-floating-msg');
        statsBox.style.display = statsBox.style.display === 'block' ? 'none' : 'block';
    });

    const refreshButton = document.createElement('i');
    refreshButton.className = 'fa fa-sync-alt ml-button ml-manual-reload'; // Changed icon
    refreshButton.title = 'Click an image to reload it.';
    refreshButton.addEventListener('click', function() {
        reloadMode = !reloadMode; // Toggle reload mode
        refreshButton.style.color = reloadMode ? 'orange' : ''; // Change color to indicate state
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

    // Function to reload image on error
    function addErrorHandlingToImage(image, imgSrc) {
        image.onerror = function() {
            console.warn(`Failed to load image: ${imgSrc}. Retrying...`);
            image.src = imgSrc;
        };
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

    // Load all manga images with page separators and scaling
    function loadMangaImages() {
        hideElements();

        const mangaContainer = document.createElement('div');
        mangaContainer.id = 'manga-container';
        document.body.appendChild(mangaContainer);

        const exitButtonTop = createExitButton();
        mangaContainer.appendChild(exitButtonTop);

        totalPages = parseInt(document.querySelector('.num-pages').textContent.trim());
        totalImages = totalPages; // Update total images for stats
        const initialPage = parseInt(window.location.href.match(/\/g\/\d+\/(\d+)/)[1]);
        let currentPage = initialPage;

        // Helper to create the page container with images
        function createPageContainer(pageNumber, imgSrc) {
            const container = document.createElement('div');
            container.className = 'manga-page-container';

            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `Page ${pageNumber}`;

            addErrorHandlingToImage(img, imgSrc);
            container.appendChild(img);

            const counter = addPageCounter(pageNumber);
            container.appendChild(counter);

            addClickEventToImage(img);
            mangaContainer.appendChild(container);

            loadedPages++; // Increment loaded pages count
            updateStats(); // Update stats display

            observePageContainer(container);

            return container;
        }

        // Function to load a single page
        function loadPage(pageNumber, pageUrl) {
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

                    loadingImages--;
                    updateStats(); // Update loading images count

                    // Continue loading the next page if needed
                    if (pageNumber < totalPages && nextLink) {
                        loadPage(pageNumber + 1, nextLink);
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
                });
        }

        const firstImageElement = document.querySelector('#image-container > a > img');
        const firstImgSrc = firstImageElement.getAttribute('data-src') || firstImageElement.src;
        createPageContainer(currentPage, firstImgSrc);

        const firstImageLink = document.querySelector('#image-container > a').href;
        loadPage(currentPage + 1, firstImageLink);

        exitButtonTop.addEventListener('click', function() {
            window.location.reload();
        });
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
    createStatsWindow(); // Create the stats window

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
