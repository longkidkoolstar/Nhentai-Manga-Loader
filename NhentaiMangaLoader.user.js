// ==UserScript==
// @name         Nhentai Manga Loader
// @namespace    http://www.nhentai.net
// @version      2.7
// @description  Loads nhentai manga chapters into one page in a long strip format with image scaling, click events, and a dark mode for reading.
// @match        *://nhentai.net/g/*/*
// @icon         https://clipground.com/images/nhentai-logo-5.png
// @grant        none
// @license      MIT
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // Helper to create custom style sheets for elements
  // Helper to create custom style sheets for elements
function addCustomStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        #manga-container {
            max-width: 100vw; /* Full screen width */
            margin: 0 auto;
            padding: 0;
        }
        .manga-page-container {
            position: relative;
            display: block;
            margin: 0; /* No spacing between pages */
        }
        .manga-page-container img {
            max-width: 100%;
            display: block;
            margin: 3px auto;
            border-radius: 0; /* Remove rounding for seamless look */
            transition: all 0.3s ease;
            box-shadow: none; /* Remove shadow */
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

    // Function to toggle image size on click
    function addClickEventToImage(image) {
        image.addEventListener('click', function() {
            if (image.classList.contains('full-size')) {
                image.classList.remove('full-size');
            } else {
                image.classList.add('full-size');
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

        const totalPages = parseInt(document.querySelector('.num-pages').textContent.trim());
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

                       // Observe the container to load the image when in the viewport
                       observePageContainer(container);

            return container;
        }

        // Function to load a single page
        function loadPage(pageNumber, pageUrl, callback) {
            fetch(pageUrl)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const imgElement = doc.querySelector('#image-container > a > img');
                    const nextLink = doc.querySelector('#image-container > a').href;
                    const imgSrc = imgElement.getAttribute('data-src') || imgElement.src;

                    const pageContainer = createPageContainer(pageNumber, imgSrc);

                    if (callback) {
                        callback(pageContainer);
                    }

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
        rootMargin: '200px 0px', // Start loading when near the viewport
        threshold: 0.1 // Start loading when 10% of the image is visible
    });

    // Use the observer when images are created
    function observePageContainer(container) {
        console.log('Observing page container:', container);
        observer.observe(container);
        console.log('Observed page container');
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
