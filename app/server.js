/**
 * Dev server for local dev/testing
 */
const express = require("express");
const app = express();
const port = process.env.PORT | 3000;
const path = require("path");

app.use(express.static(path.join(__dirname, "static")));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => console.log(`Server listening on port: ${port}`));
