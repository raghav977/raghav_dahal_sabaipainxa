const router = require("express").Router();
const { fetchPdfs } = require("../controllers/scrapping.controller");

router.get("/fetch-pdfs", fetchPdfs);

module.exports = router;