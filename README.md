# Checklist

This project provides a small React application used for presentation checklists.

## Development

Source files are split for easier maintenance:

- `style.css` - all CSS styles
- `feedback.js` - feedback generation utilities and preset data
- `app.jsx` - the React application code

`index.html` references these files directly during development.

## Build

Run the following command to inline the assets and produce a standalone file
for Google Apps Script:

```bash
node build.js
```

This will create `dist/Index.html`. Upload that file along with `main.gs` to
your Apps Script project.


---

## Easiest deployment approach

1. **Download the server script (`main.gs`)**

   * On your GitHub repository page, click the **Code** button and select **Download ZIP**, or navigate into the `main.gs` file and click **Raw**, then save the page as `main.gs` on your computer.

2. **Download the client HTML (`Index.html`) from Releases**

   * On the right-hand side of the repository page, click the **Releases** link (just under “About” or next to “Packages”).
   * Under the latest release, find and click **Assets** to expand the list, then click **Index.html** to download it to your computer.

3. **Create a new Google Apps Script project**

   * Go to the [Google Apps Script dashboard](https://script.google.com) in your browser and sign in if necessary.
   * Click **New project** in the top-left corner.

4. **Import `main.gs` into the script editor**

   * In the newly created project, you’ll see a default file named `Code.gs`. Open it, select all text, delete it, then open your downloaded `main.gs` in a text editor.
   * Copy the entire content of `main.gs` and paste it into the script editor.
   * Rename the file if you like by clicking the three-dot menu next to the filename and selecting **Rename**, though `main.gs` is fine.

5. **Add the `Index.html` file**

   * In the left sidebar of the script editor, click the **+** icon and choose **HTML** (this creates a new HTML file).
   * When prompted for a name, enter `Index` (case-sensitive).
   * Open your downloaded `Index.html` in a text editor, copy all its contents, then paste into the newly created `Index` file in Apps Script.

6. **Deploy as a Web App**

   * In the Apps Script editor, click the blue **Deploy** button in the upper-right corner and choose **New deployment**.
   * Under **Select type**, pick **Web app**.
   * Click **Deploy**.
   * When prompted, authorize if needed, then copy the **Web app URL** that’s displayed for future access.



https://github.com/user-attachments/assets/f7ef0605-80d7-462a-8f54-8eae8dd266a7

