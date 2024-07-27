const Feedback = require("../models/feedback");
const axios = require("axios").default;

const STATUS_CODE = require("../configs/errors");
const logger = require("../logger/logger.js");

class FeedbackController {
  async requestFeedback(req, resp) {
    logger.info("FeedbackController.requestFeedback()", req.body);

    try {
      const data = req.body.payload;
      const inFeedback = {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        designation: data.designation,
        feedback: data.feedback
      };

      const feedback = await new Feedback(inFeedback);

      await feedback.save((err, feedback) => {
        if (err) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.FEEDBACK_REQUEST_FAILED,
          });
        }

        // Sending the Communication out
        const communictionServiceUrl = process.env.MS_COMMUNICATION_SERVICE_URL;
        const url = `${communictionServiceUrl}/feedback/request`;
        // Send Feedback Request Email
        axios
          .post(url, {
              email: process.env.MARKETING_EMAIL,
              mobile: inFeedback.mobile,
          })
          .then(function (response) {
            logger.info("FeedbackController.requestFeedback(): response", response);
          })
          .catch(function (error) {
            logger.error(
              "FeedbackController.requestFeedback(): Failed to send feedback booking email for mobile:",
              inFeedback.mobile
            );
          });

        resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: false,
          message: STATUS_CODE.FEEDBAC_REQUEST_SUCCESS,
        });
      });
    } catch (err) {
      logger.error("FeedbackController.requestFeedback()", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.FEEDBAC_REQUEST_FAILED,
      });
    }
  }
}

module.exports = new FeedbackController();
