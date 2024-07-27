const Favourite = require("../models/favourite");
const axios = require("axios").default;

const STATUS_CODE = require("../configs/errors");
const logger = require("../logger/logger.js");

class FavouriteController {
  // using async/await

  async addItem(req, resp) { // We're not using this API yet, replaced by addEditItem API
    logger.info("FavouriteController.addItem()", req.body);

    try {
      const data = req.body;
      const userId = req.headers['userid'];

      const inItem = {
        supplierId: data.supplierId,
        supplierName: data.supplierName,
      };

      Favourite.findOne({ userId }, (err, favourite) => {
        if (err) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            message: STATUS_CODE.FAVOURITE_ADD_FAILED,
          });
        }

        if (favourite) {
          favourite.addItem(inItem);
          favourite.save().then((oFavourite) => {
            logger.info("FavouriteController.addItem() saved", oFavourite);
            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              message: "",
              payload: {
                favourites: oFavourite.items,
              }
            });
          });
        } else {
          // Create Favourite with addition of item
          const inFavourite = {
            userId: userId,
            //items: [inItem],
            //total: inItem.total,
          };

          const favouriteN = new Favourite(inFavourite);
          favouriteN.addItem(inItem);

          favouriteN.save().then((oFavourite) => {
            logger.info("FavouriteController.addItem() saved new favourite", oFavourite);

            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              message: "",
              payload: {
                favourites: oFavourite.items,
              }
            });
          });
        }
      });
    } catch (err2) {
      logger.error(err2.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        message: STATUS_CODE.FAVOURITE_ADD_FAILED,
      });
    }
  }

  async removeItem(req, resp) {       // instead of this api we are using removeTag Api
    logger.info("FavouriteController.removeItem()", req.body);

    try {
      const data = req.body;
      const userId = req.headers['userid'];

      const inItem = {
        supplierName: data.supplierName,
      };

      Favourite.findOne({ userId }, (err, favourite) => {
        if (err) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.FAVIOURITE_REMOVE_FAILED,
          });
        }

        if (favourite) {
          favourite.deleteItem(inItem);
          favourite.save().then((oFavourite) => {
            logger.info("FavouriteController.removeItem() saved", oFavourite);
            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              message: "",
              payload: {
                favourites: oFavourite.items,
              }
            });
          });
        }

      });
    } catch (err2) {
      logger.error(err2.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        message: STATUS_CODE.FAVIOURITE_REMOVE_FAILED,
      });
    }

  }

  async getMyFavourite(req, resp) {
    try {
      logger.info("FavouriteController.getMyFavourite() Req Params", req.query);

      const userId = req.headers['userid'];

      logger.info("FavouriteController.getMyFavourite() :", userId);

      Favourite.findOne({ userId }, (err, favourite) => {
        //logger.info("FavouriteController.getMyFavourite()", favourite);
        if (err) {
          logger.error(" Failed to get favourites : ", err);
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.FAVOURITE_FETCH_FAILURE,
          });
        }

        if (!favourite) {
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.FAVOURITE_FETCH_NONE,
            payload: {
              favourites: [],
            }
          });
        }

        let favourites = favourite.items.filter(item => item.isDeleted == false);
        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: false,
          message: "",
          payload: {
            favourites: favourites,
          }
        });
      });
    } catch (err) {
      logger.error("getMyFavourite() " + err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.FAVOURITE_FETCH_FAILURE,
      });
    }
  }

  /* API TO ADD EDIT ITEM WITH TAGS */
  async addEditItem(req, resp) {
    logger.info("FavouriteController.addEditItem() :: req.body: ", req.body);

    const data = req.body;
    const userId = req.headers['userid'];
    logger.info("FavouriteController.addEditItem() :: userId: ", userId);

    try {
    
      const payloadItems = {
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        tags: data.tags ? data.tags : "Anonymous",
      };

      Favourite.findOne({ userId }, async (err, favourite) => {
        logger.info("FavouriteController.addEditItem() :: err", err, "favourite00: ", favourite);

        if (err) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            message: STATUS_CODE.FAVOURITE_ADD_FAILED,
          });
        }
        
        if (favourite) {

          let msg = STATUS_CODE.ITEM_ADD_SUCCESS;
          let isNewItem = true;
          let filterTagArr =[];
          favourite.items.forEach(function (item, i) { /* Updating the records (Item Schema) */            
            if (item.supplierId == payloadItems.supplierId) {
              favourite.items[i].supplierName = payloadItems.supplierName ? payloadItems.supplierName : favourite.items[i].supplierName;

              filterTagArr = favourite.items[i].tags.filter((str) => str.toLowerCase() === payloadItems.tags.toLowerCase())
              logger.info(`FavouriteController.addEditItem() :: itemFilter => filterTagArr: `, filterTagArr);
              if ( !filterTagArr || filterTagArr.length<1) {
                if(favourite.items[i].tags.length>=1 && payloadItems.tags!="Anonymous"){
                  favourite.items[i].tags.push(payloadItems.tags);
                }else if(favourite.items[i].tags.length<1){
                  favourite.items[i].tags.push(payloadItems.tags);
                }
              }           

              isNewItem = false;
              msg = STATUS_CODE.ITEM_UPDATE_SUCCESS;
            }
          });

          if (isNewItem) {
            /* Adding new records (Item Schema) */
            favourite.items.push(payloadItems);
          }
          logger.info("FavouriteController.addEditItem() :: favourite02: ", favourite);

          favourite.save()
          .then((oFavourite) => {
            logger.info("FavouriteController.addEditItem() :: saved", oFavourite);
            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              message: msg,
              payload: {
                favourites: oFavourite.items,
              }
            });
          })
          .catch((err1) => {
            logger.info("AwardController.addAward() :: err:", err1);
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              error: true,
              message: STATUS_CODE.ITEM_ADD_UPDATE_FAILED,
            });
          });

        } else {
          // Create Favourite with addition of item
          const inFavourite = {
            userId: userId,
            items: payloadItems
          };

          const favouriteN = new Favourite(inFavourite);

          favouriteN.save()
          .then((oFavourite) => {
            logger.info("FavouriteController.addItem() :: saved new favourite: ", oFavourite);

            return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
              error: false,
              message: "",
              payload: {
                  favourites: oFavourite.items,
              }
            });
          })
          .catch((err2) => {
            logger.info("AwardController.addAward() :: err2:", err2);
            return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
              error: true,
              message: STATUS_CODE.ITEM_ADD_FAILED,
            });
          });;

        }

      });

    } catch (err2) {
      logger.error(err2.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: true,
        message: STATUS_CODE.FAVOURITE_ADD_FAILED,
      });
    }
  }

  /* API TO FIND ITEMS BY TAG */
  async itemByTag(req, resp) {
    try {
      const { tag } = req.body;
      logger.info("FavouriteController.itembytag() :: req.body: ", req.body);

      const userId = req.headers['userid'];
      logger.info ("FavouriteController.itembytag() :: ",  userId);

      Favourite.findOne({ userId }, (err, favourite) => {
        //logger.info("FavouriteController.itembytag()", favourite);
        if (err) {
          logger.error ("FavouriteController.itembytag() :: Failed to get favourites : err: ", err);
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            error: true,
            message: STATUS_CODE.FAVOURITE_FETCH_FAILURE,
          });
        }

        if (!favourite){
          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: STATUS_CODE.FAVOURITE_FETCH_NONE,
            payload: {
                favourites: [],
            }
          });
        }

        let filterTagArr =[];
        let favourites = favourite.items.filter( (item, ind, arr) => {
          logger.info(`FavouriteController.itembytag() :: itemFilter => item: `, item,` ind: `, ind, ` arr:`, arr);

          filterTagArr = item.tags.filter((str) => str.toLowerCase() === tag.toLowerCase())
          logger.info(`FavouriteController.itembytag() :: itemFilter => filterTagArr: `, filterTagArr);
 

          if ( filterTagArr && filterTagArr.length>0) {
            return true;
          } else {
            return false;
          }
        });

        /*
        let favourites = favourite.items.filter( (item, ind, arr) => {
          logger.info(`FavouriteController.itembytag() :: itemFilter => item: `, item,` ind: `, ind);
                    
          if ( item.tags.includes(tag) ) {
            return true;
          } else {
            return false;
          }
        });
        */
        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: false,
          message: "",
          payload: {
              favourites: favourites,
          }
        });
      });
    } catch (err) {
      logger.error("FavouriteController.itembytag() :: err: ", err.message);
      return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
        error: true,
        message: STATUS_CODE.FAVOURITE_FETCH_FAILURE,
      });
    }
  }

  /**
   * Api to get all tags
   * @param {*} req 
   * @param {*} resp 
   * @returns 
   */
  async getAllTags(req, resp) {

    logger.info("FavouriteController.getAllTags()");
    try {
      const userId = req.headers['userid'];
      logger.info("FavouriteController.getAllTags() user-id", userId);

      Favourite.findOne({ userId }, (err, tags) => {

        if (err || !tags) {
          return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
            message: STATUS_CODE.TAGS_FETCH_FAILURE,
          });
        }

        logger.info("FavouriteController.getAllTags() tags[]", tags);

        let tag = tags.items.filter((item) => {
          if (item.tags.length > 0) {
            return true;
          } else {
            return false;
          }
        });
        return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
          error: false,
          message: STATUS_CODE.TAGS_FETCH_SUCCESS,
          payload: tag
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

  /**
   * Api to delete items
   * @param {*} req 
   * @param {*} resp 
   * @returns 
   */
  async removeTags(req, resp) {
    logger.info("FavouriteController.removeTags()", req.body);

    try {
      const payload = req.body;
      const userId = req.headers['userid'];
      const supplierId = payload.supplierId;
      const tag = payload.tag

      Favourite.findOne({ userId: userId }, (err, user) => {
        if (err || !user) {
          return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
            message: STATUS_CODE.USER_NOT_EXIST,
          });
        }

        logger.info(
          "FavouriteController.removeTags() userId=",
          user
        );

        let msg = STATUS_CODE.DELETE_BY_SUPPLIER_ID
        var itemFound = false;
        user.items.forEach(function (item, i) {

          if (user.items[i].supplierId == supplierId) {
            if (tag) {
              if (user.items[i].tags.length > 1) {
                msg = STATUS_CODE.TAG_NOT_FOUND

                user.items[i].tags.forEach(function (dTag, j) {
                  if (dTag == tag) {
                    user.items[i].tags.splice(j, 1);
                    msg = STATUS_CODE.DELETE_BY_TAG_AND_SUPPLIER_ID
                  }
                })
              }
              else {
                user.items.splice(i, 1);
              }
            }
            else {
              user.items.splice(i, 1);
            }

            itemFound = true;
          }
        });
        if (itemFound == false) {
          return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
            message: STATUS_CODE.SUPPLIER_ID_NOT_EXIST,
          });
        }
        user.save().then((oItem) => {

          return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
            error: false,
            message: msg,
            payload: {
              item: oItem
            },
          });

        });
      });
    } catch (err2) {
      logger.error(err2);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        message: STATUS_CODE.FAVIOURITE_REMOVE_FAILED,
      });
    }
  }

/**
 * Api to get all unique tag
 * @param {*} req 
 * @param {*} resp 
 * @returns 
 */
  async uniqueTags(req, resp) {

    logger.info("FavouriteController.uniqueTags()");
    try {
      const userId = req.headers['userid'];
      logger.info("FavouriteController.uniqueTags() user-id", userId);

      const tags = await Favourite.distinct('items.tags', { userId });

      if (!tags) {
        return resp.status(STATUS_CODE.SERVER_BAD_REQUEST).json({
          message: STATUS_CODE.UNIQUE_TAGS_FETCH_FAILURE,
        });
      }
      
      logger.info("FavouriteController.uniqueTags() uniquetags[]", tags);
      return resp.status(STATUS_CODE.SERVER_SUCCESS).json({
        error: false,
        message: STATUS_CODE.UNIQUE_TAGS_FETCH_SUCCESS,
        payload: tags
      });

    } catch (err) {
      logger.error(err.message);
      return resp.status(STATUS_CODE.SERVER_INTERNAL_ERROR_CODE).json({
        error: false,
        message: STATUS_CODE.UNIQUE_TAGS_FETCH_FAILURE
      });
    }
  }

}

module.exports = new FavouriteController();
