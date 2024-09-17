// ==UserScript==
// @name         Nhentai Manga Loader
// @namespace    http://www.nhentai.net
// @version      1.3
// @description  Loads nhentai manga chapters into one page in a long strip format with a 'Load Manga' button, nicer UI, and proper scaling.
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
            .manga-separator {
                text-align: center;
                font-size: 18px;
                color: #666;
                margin: 30px 0;
                padding-top: 15px;
                border-top: 2px solid #ddd;
            }
            .manga-page-container {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
            }
            .manga-page-container img {
                max-width: 100%;
                height: auto;
                object-fit: contain;
                box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
                border-radius: 5px;
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

    // Load all manga images with page separators and scaling
    function loadMangaImages() {
        const totalPages = parseInt(document.querySelector('.num-pages').textContent.trim());
        let currentPage = 1;

        // Function to create the container and page separators
        function createPageContainer(pageNumber) {
            const container = document.createElement('div');
            container.className = 'manga-page-container';
            
            const separator = document.createElement('div');
            separator.className = 'manga-separator';
            separator.textContent = `Page ${pageNumber}`;
            
            document.body.appendChild(separator);  // Append the page separator
            return container;
        }

        // Function to load a specific page
        function loadPage(url) {
            return fetch(url)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const imgElement = doc.querySelector('#image-container > a > img');
                    const nextLink = doc.querySelector('#image-container > a').href;
                    const imgSrc = imgElement.getAttribute('data-src') || imgElement.src;

                    // Create and append the image to a new container with proper scaling
                    const pageContainer = createPageContainer(currentPage);
                    const newImage = document.createElement('img');
                    newImage.src = imgSrc;
                    newImage.alt = `Page ${currentPage}`;
                    pageContainer.appendChild(newImage);
                    document.body.appendChild(pageContainer);

                    currentPage++;

                    if (currentPage <= totalPages && nextLink) {
                        loadPage(nextLink); // Recursively load the next page
                    }
                });
        }

        // Start loading from the first page
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
        loadMangaButton.remove(); // Remove the button after it's clicked
    });
})();
