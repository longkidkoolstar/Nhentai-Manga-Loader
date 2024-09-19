// ==UserScript==
// @name         Nhentai Manga Loader
// @namespace    http://www.nhentai.net
// @version      2.6
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
            width: 100vw; /* Ensure image takes full width of screen */
            height: auto;
            display: block;
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

    // Function to hide specified elements
    function hideElements() {
        const elementsToHide = [
            '#image-container',
            '#content',
            'nav'
        ];

        elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    // Load all manga images with page separators and scaling
    function loadMangaImages() {
        hideElements(); // Hide elements when loading manga

        // Create a main container to hold all the images
        const mangaContainer = document.createElement('div');
        mangaContainer.id = 'manga-container';
        document.body.appendChild(mangaContainer);

        // Add "Exit" button above the first page
        const exitButtonTop = createExitButton();
        mangaContainer.appendChild(exitButtonTop);

        const totalPages = parseInt(document.querySelector('.num-pages').textContent.trim());
        const initialPage = parseInt(window.location.href.match(/\/g\/\d+\/(\d+)/)[1]); // Extract starting page from URL
        let currentPage = initialPage;

        // Helper to create the page container with images
        function createPageContainer(pageNumber, imgSrc) {
            const container = document.createElement('div');
            container.className = 'manga-page-container';

            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `Page ${pageNumber}`;
            container.appendChild(img);

            const counter = addPageCounter(pageNumber);
            container.appendChild(counter);

            addClickEventToImage(img);
            mangaContainer.appendChild(container);
        }

        // Recursive function to load pages
        function loadPage(pageNumber, pageUrl) {
            fetch(pageUrl)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const imgElement = doc.querySelector('#image-container > a > img');
                    const nextLink = doc.querySelector('#image-container > a').href;
                    const imgSrc = imgElement.getAttribute('data-src') || imgElement.src;

                    createPageContainer(pageNumber, imgSrc);

                    if (pageNumber < totalPages && nextLink) {
                        loadPage(pageNumber + 1, nextLink); // Load the next page with the correct URL
                    } else {
                        // Once the last page is loaded, add "Exit" button below the last page
                        const exitButtonBottom = createExitButton();
                        mangaContainer.appendChild(exitButtonBottom);

                        // Add event listener to the bottom "Exit" button
                        exitButtonBottom.addEventListener('click', function() {
                            window.location.reload();
                        });
                    }
                });
        }

        // Load the first image on the current page
        const firstImageElement = document.querySelector('#image-container > a > img');
        const firstImgSrc = firstImageElement.getAttribute('data-src') || firstImageElement.src;
        createPageContainer(currentPage, firstImgSrc);

        // Start loading subsequent images
        const firstImageLink = document.querySelector('#image-container > a').href;
        loadPage(currentPage + 1, firstImageLink);

        // Add event listener to the top "Exit" button
        exitButtonTop.addEventListener('click', function() {
            window.location.reload();
        });
    }

    // Apply custom styles to the page
    addCustomStyles();

    // Check if the "Find Similar" button already exists
    const findSimilarButtons = document.querySelectorAll('.find-similar');
    if (findSimilarButtons.length > 0) {
        console.log('Find Similar button already exists.');
    } else {
        // Add the "Load Manga" button
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
        // Add event listener to the "Load Manga" button
        loadMangaButton.addEventListener('click', function() {
            loadMangaImages();
            loadMangaButton.remove();
        });
    }

})();
