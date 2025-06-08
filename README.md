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

