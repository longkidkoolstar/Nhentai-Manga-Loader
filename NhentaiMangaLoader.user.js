// ==UserScript==
// @name         Nhentai Manga Loader
// @namespace    http://www.nhentai.net
// @version      2.2
// @description  Loads nhentai manga chapters into one page in a long strip format with image scaling, click events, and a dark mode for reading.
// @match        *://nhentai.net/g/*/*
// @grant        none
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // Helper to create custom style sheets for elements
    function addCustomStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            body {
                background-color: #1a1a1a !important; /* Darker background */
                color: #ddd;
                margin: 0;
                font-family: Arial, sans-serif;
            }
            #manga-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .manga-page-container {
                display: block;
                text-align: center;
                margin: 20px 0;
            }
            .manga-page-container img {
                max-width: 100%;
                height: auto;
                margin: 10px 0;
                display: block;
                border-radius: 5px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }
            .manga-page-container img.full-size {
                max-width: none;
                width: auto;
                height: auto;
            }
            .ml-counter {
                background-color: #222;
                color: white;
                border-radius: 10px;
                padding: 5px 10px;
                border: 1px solid white;
                display: inline-block;
                margin-top: 10px;
                font-size: 14px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            }
            .load-manga-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #3498db;
                color: white;
                padding: 15px 30px;
                font-size: 18px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                transition: background-color 0.3s ease;
                z-index: 1000;
            }
            .load-manga-btn:hover {
                background-color: #2980b9;
            }
            .load-manga-btn:active {
                background-color: #1f6391;
            }
        `;
        document.head.appendChild(style);
    }

    // Create the "Load Manga" button
    function createLoadMangaButton() {
        const button = document.createElement('button');
        button.textContent = 'Load Manga';
        button.className = 'load-manga-btn';
        document.body.appendChild(button);
        return button;
    }

    // Add page counter below the image
    function addPageCounter(pageNumber) {
        const counter = document.createElement('div');
        counter.className = 'ml-counter';
        counter.textContent = `Page ${pageNumber}`;
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
            if (pageNumber > totalPages) return;

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
    }

    // Apply custom styles to the page
    addCustomStyles();

    // Add the "Load Manga" button
    const loadMangaButton = createLoadMangaButton();

    // Add event listener to the button to load images when clicked
    loadMangaButton.addEventListener('click', function() {
        loadMangaImages();
        loadMangaButton.remove();
    });
})();