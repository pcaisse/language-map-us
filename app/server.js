/**
 * Static file server for local dev/testing
 */
const express = require("express");
const app = express();
const port = process.env.PORT | 3000;
const path = require("path");

app.use(
  express.static(path.join(__dirname, "static"), {
    setHeaders: function (res, path) {
      if (path.endsWith(".pbf")) {
        res.setHeader("Content-Encoding", "gzip");
      }
    },
  })
);

app.listen(port, () => console.log(`Server listening on port: ${port}`));
