// ==UserScript==
// @name         Nhentai Manga Loader
// @namespace    http://www.nhentai.net
// @version      1.4
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
                background-color: black !important;  /* Change background to black */
            }
            .manga-separator {
                text-align: center;
                font-size: 18px;
                color: #ddd;
                margin: 30px 0;
                padding-top: 15px;
                border-top: 2px solid #444;
            }
            .manga-page-container {
                display: block;
                text-align: center;
                margin: 20px auto;
            }
            .manga-page-container img {
                max-width: 100%;
                height: auto;
                margin: 10px 0;
                display: block;
                border-radius: 5px;
                transition: all 0.3s ease;
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
                width: 30px;
                margin: -12px auto 10px;
                padding: 5px;
                border: 1px solid white;
                position: relative;
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

    // Load all manga images with page separators and scaling
    function loadMangaImages() {
        const totalPages = parseInt(document.querySelector('.num-pages').textContent.trim());
        let currentPage = 1;

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
            document.body.appendChild(container);
        }

        function loadPage(url) {
            return fetch(url)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const imgElement = doc.querySelector('#image-container > a > img');
                    const nextLink = doc.querySelector('#image-container > a').href;
                    const imgSrc = imgElement.getAttribute('data-src') || imgElement.src;

                    createPageContainer(currentPage, imgSrc);
                    currentPage++;

                    if (currentPage <= totalPages && nextLink) {
                        loadPage(nextLink);
                    }
                });
        }

        const firstImageLink = document.querySelector('#image-container > a').href;
        loadPage(firstImageLink);
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
