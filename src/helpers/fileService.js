const axios = require("axios");
const FormData = require('form-data');
const fs = require("fs");
const path = require('path');
const logger = require("../logger/logger.js");

class FileService {

  constructor() {
    this.storageService = process.env.MS_STORAGE_SERVICE_URL;
    this.uploadUrl = `/upload`;
  }

  async uploadFileToCloud(fileToUpload, fileName){
    try {

      logger.info("FileService.uploadFileToCloud() : ", fileToUpload);
      const url = `${this.storageService}${this.uploadUrl}`;
      logger.info ("FileService.uploadFileToCloud() : Uploading File via : ", url);

      var data = new FormData();
      let ext = path.extname(fileToUpload.name);
      logger.info ("ext = ", ext);

      let contentType = null;
      if (ext == ".jpg" || ".jpeg")
      {
        contentType = "image/jpeg";
      }
      else if (ext == ".png"){
        contentType = "image/png";
      }
      else {
        logger.info ("Unsupported media type");
        return null ;
      }
      data.append('file', fileToUpload.data, {contentType: contentType, filename: fileName});
      data.append('filePath', process.env.STORAGE_MEDIA_PATH);
      /*var newFile = fs.createReadStream(filePath);
      newFile.on('end', function() {
        const form_data = new FormData();
        form_data.append("file", newFile, FULL_FILE);*/
        const request_config = {
          method: "post",
          url: url,
          headers: {
            ...data.getHeaders()
          },
          data: data
        };
        logger.info ("Sending form data: ",  data )
        let response = await axios(request_config);
        return response.data;
    }
    catch(err){
      logger.error ("ERROR : FileService.uploadFileToCloud() :" , err);
      return null;
    }
  }
}


module.exports = new FileService();
