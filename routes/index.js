var express = require("express");
var router = express.Router();

const {
  listRecords,
  findByLocationAndSize,
  findByVendorAndLocation,
} = require("../controllers");

router.get("/", (req, res) => {
  return res.status(200).json({
    status: 200,
    message: "Welcome to the best API",
  });
});
router.get("/getRecords", listRecords);
router.get(
  "/getPriceByLocationAndSize/:location/:size/price",
  findByLocationAndSize
);
router.get(
  "/getPriceByVendorAndLocation/:vendor/:location/price",
  findByVendorAndLocation
);

module.exports = router;
