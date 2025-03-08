# Nhentai Manga Loader

## Overview
The **Nhentai Manga Loader** is a userscript designed to enhance your reading experience on the [Nhentai](https://www.nhentai.net) website. It allows you to load manga chapters into a single page displayed in a long strip format. This script features image scaling, click events for zooming images, and a convenient dark mode for comfortable reading.

## Features
- **Seamless Viewing**: Load all manga pages in a continuous strip without interruptions.
- **Image Scaling**: Click on images to toggle between full size and scaled views.
- **Navigation**: Easy page counter and exit button for quick access to navigation.
- **Custom Styles**: Designed with a clean and visually appealing layout.
- **Continue Reading**: Automatically saves your reading progress and provides a convenient list of all manga you've started reading, allowing you to easily pick up where you left off.

## How It Works
1. **Custom Styles**: The script injects a custom CSS stylesheet to style the manga viewer, ensuring images take full width and appear with no borders or shadows for a seamless look.
2. **Page Counter**: A counter displays the current page number beneath each image for easy tracking.
3. **Image Loading**: The script recursively fetches images from each page of the manga, dynamically loading them into the viewer.
4. **Exit Button**: An exit button allows you to return to the standard Nhentai interface, refreshing the page to restore the original layout.
5. **Continue Reading**: The script saves your reading progress locally and generates a list of all manga you've started reading. This list is accessible via a special "Continue Reading" page, which displays the title, current page, and total pages of each manga, along with a link to continue reading from where you left off.

## Usage
To use this script:
1. Install it via a userscript manager (like Tampermonkey or Violentmonkey).
2. Navigate to any manga page on Nhentai.
3. Click the "Load Manga" button to begin loading all pages in the new format.
4. To access the "Continue Reading" feature, navigate to the `/continue_reading` page on Nhentai, where you'll find a list of all manga you've started reading, along with links to continue reading from where you left off.

Enjoy a streamlined and immersive manga reading experience with the Nhentai Manga Loader!