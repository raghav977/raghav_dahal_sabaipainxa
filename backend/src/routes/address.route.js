
const router = require('express').Router();

const addressController = require('../controllers/address.controller');

router.get('/provinces', addressController.fetchProvinces);

router.get('/districts/:province_code', addressController.fetchDistrictsByProvince);

router.get('/municipals/:district_code', addressController.fetchMunicipalsByDistrict);


router.get('/locations', addressController.fetchLocation);
module.exports = router;