const AllGlobalTags = require("../models/tagsContainer")

const STATUS_CODE = require("../configs/errors");
const logger = require("../logger/logger.js");

class AllGlobalTagsController {
  async addToAllTags(req, resp) {
    logger.info("AllGlobalTagsController.requestTags()", req.body);
    let tagAlreadyExist;
    const tag = req.body.tagName
    await AllGlobalTags.findOne({tagName:tag})
    .then((existTags)=> tagAlreadyExist = existTags)
    try {
      const tagName = req.body;
      if(!tagAlreadyExist){
        const allTags = await new AllGlobalTags(tagName);
        await allTags.save((err, allTags) => {
            if (err) {
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
                error: true,
                message: STATUS_CODE.TAG_ADDED_FAILED,
            });
            }
            resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.TAG_ADDED_SUCCESS,
            });
        });
    }else{
        return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.TAG_ALREADY_EXIST,
        });

    }
    } catch (err) {
      logger.error("AllGlobalTagsController.requestTags()", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.DEMO_REQUEST_FAILED,
      });
    }
  }


  async getFromAllTags(req, resp) {
    try {
      await AllGlobalTags.find((err, tags) => {
        if (err || !tags) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            message: STATUS_CODE.TAGS_FETCH_FAILURE,
          });
        }

        logger.info("AllGlobalTagsController.getAllTags() tags[]", tags);

        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: false,
          message: STATUS_CODE.TAGS_FETCH_SUCCESS,
          payload: tags
        });
      });

    } catch (err) {
      logger.error(err.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: false,
        message: STATUS_CODE.TAGS_FETCH_FAILURE
      });
    }
  }
}

module.exports = new AllGlobalTagsController();
