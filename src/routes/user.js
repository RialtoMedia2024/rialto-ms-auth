const express = require("express");
const router = express.Router();

const favouriteController = require("../controllers/favourite");
const demoController = require("../controllers/demo");
const feedbackController = require("../controllers/feedback");
const allTags = require("../controllers/allglobaltags")

router.post("/favourite/additem", favouriteController.addEditItem);
router.post("/favourite/removeitem", favouriteController.removeTags);
router.get("/favourite/myitems", favouriteController.getMyFavourite);
router.get("/favourite/tags", favouriteController.getAllTags);

router.post("/addtoglobaltags",allTags.addToAllTags);
router.get("/getallglobaltags",allTags.getFromAllTags);
//router.post("/favourite/removetags", favouriteController.removeTags);

// router.post("/favourite/addedititem", favouriteController.addItem); // We are not using, this is an old api.
router.get("/favourite/itembytag", favouriteController.itemByTag);
router.get("/favourite/mytags", favouriteController.uniqueTags);

router.post("/demo/request", demoController.requestDemo);
router.post("/feedback", feedbackController.requestFeedback);


module.exports = router;
