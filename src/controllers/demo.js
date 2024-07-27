const Demo = require("../models/demo");
const axios = require("axios").default;

const STATUS_CODE = require("../configs/errors");
const logger = require("../logger/logger.js");

class DemoController {
  async requestDemo(req, resp) {
    logger.info("DemoController.requestDemo()", req.body);

    try {
      const data = req.body;
      const inDemo = {
        mobile: data.mobile,
      };

      const demo = await new Demo(inDemo);

      await demo.save((err, demo) => {
        if (err) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.DEMO_REQUEST_FAILED,
          });
        }

        // Sending the Communication out
        const communictionServiceUrl = process.env.MS_COMMUNICATION_SERVICE_URL;
        const url = `${communictionServiceUrl}/demo/request`;
        // Send Demo Request Email
        axios
          .post(url, {
              email: process.env.MARKETING_EMAIL,
              mobile: inDemo.mobile,
          })
          .then(function (response) {
            logger.info("DemoController.requestDemo(): response", response);
          })
          .catch(function (error) {
            logger.error(
              "DemoController.requestDemo(): Failed to send demo booking email for mobile:",
              inDemo.mobile
            );
          });

        resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: false,
          message: STATUS_CODE.DEMO_REQUEST_SUCCESS,
        });
      });
    } catch (err) {
      logger.error("DemoController.requestDemo()", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.DEMO_REQUEST_FAILED,
      });
    }
  }
}

module.exports = new DemoController();
