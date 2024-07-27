/* HTTP/HTTPS status code*/
module.exports.SERVER_SUCCESS = 200;
module.exports.SERVER_BAD_REQUEST = 400;
module.exports.SERVER_UNAUTHORIZED = 401;
module.exports.SERVER_NOT_FOUND = 404;
module.exports.SERVER_INTERNAL_ERROR_CODE = 500;
module.exports.SERVER_REQUEST_TIMEOUT_CODE = 502;

/*Service error Errors*/

module.exports.DATA_NOT_FOUND = "Data not found";
module.exports.UNAUTHORIZED_ACCESS = "Unauthorized Access";

module.exports.ALL_AGENTS_FETCHED_SUCCESS = "Agent List fetched Successfully";
module.exports.ALL_AGENTS_FETCHED_FAILURE = "Agent List fetched failure";
module.exports.AGENTS_DELETE_SUCCESS = `Successfully removed agent.`;
module.exports.AGENTS_DELETE_FAILURE = `Failed to remove agent !`;

module.exports.ITEM_ADD_SUCCESS = "Successfully added item";
module.exports.ITEM_ADD_FAILED = "Failed to add item";
module.exports.ITEM_UPDATE_SUCCESS = "Successfully updated item";
module.exports.ITEM_ADD_UPDATE_FAILED = "Failed to add / update item";

module.exports.USER_REGISTER_SUCCESS = "New user registered Successfully";
module.exports.ALL_USERS_FETCHED_SUCCESS = "User List fetched Successfully";
module.exports.ALL_USERS_FETCHED_FAILURE = "User List fetched failure";
module.exports.USER_UPDATED_SUCCESS = "User updated Successfully";
module.exports.USER_UPDATED_FAILURE = "User updated failure";

module.exports.USERID_EMPTY = "User-Id is required";
module.exports.NAME_EMPTY = "User's name is required";
module.exports.EMAIL_EMPTY = "User's email can not be empty and should be valid";
module.exports.MOBILE_EMPTY = "User's contact number can not be empty and should be valid";
module.exports.USERTYPE_EMPTY = "User Type is required";
module.exports.COMPANY_EMPTY = "Company is required";
module.exports.ROLE_EMPTY = "Role is required";
module.exports.PASSWORD_EMPTY = "Password is required";

module.exports.MOBILE_ALREADY_REGISTERED = "Mobile already registered";
module.exports.SIGNUP_OTP_SEND_SUCCESS = "Sign up OTP sent successfully";
module.exports.SIGNUP_OTP_SEND_FAILED = "Sign up OTP sent failed";
module.exports.SIGNUP_MISSING_OTP = "Failed to Register. Mobile or OTP does not match";
module.exports.SIGNUP_OTP_INVALID = "Failed to Register. OTP Expired please try again";
module.exports.VALIDATE_SIGNUP_OTP_SUCCESS = "Successfully validated the sign up OTP";
module.exports.VALIDATE_SIGNUP_OTP_FAILURE = "Validation of sign up OTP Failed";
module.exports.SIGNUP_SUCCESS = "Successfully signed up";

module.exports.SIGNUP_FAILURE_EMAIL_MOBILE_EXISTS = "Email or Mobile already registered";

module.exports.SIGNUP_FAILURE_EMAIL_EXISTS = "Email already registered";

module.exports.SIGNUP_FAILURE = "Failed to Register. Email or Mobile already registered";

module.exports.SIGNIN_FAILURE_FOR_MOBILE = "It seems you are not Registered. Please Sign up."

module.exports.SIGNIN_FAILURE = "Failed to Sign In. Email or Password is incorrect";
module.exports.SIGNIN_MOBILE_FAILURE = "Failed to Sign In. Mobile or Password is incorrect";


module.exports.CHANGE_PASSWORD_INCORRECT_EMAIL_PASSWORD = "Failed to Change Password. Incorrect Email or Existing Password";
module.exports.CHANGE_PASSWORD_FAILURE = "Failed to Change Password";
module.exports.CHANGE_PASSWORD_SUCCESS = "Successfully Changed the Password";


module.exports.EXISTING_EMAIL = "An account with the email Id provided is already existing";
module.exports.EXISTING_MOBILE = "An account with the mobile number provided is already existing";

module.exports.SIGNIN_WITH_OTP_SUCCESS = "Signed in successfully with mobile OTP";
module.exports.SIGNIN_WITH_OTP_FAILURE = "Mobile or OTP is incorrect";

module.exports.SIGNIN_OTP_SEND_SUCCESS = "OTP Sent on mobile";
module.exports.SIGNIN_OTP_SEND_FAILED = "Failed to send OTP on mobile";
module.exports.USER_CHECK_FAILED = "Failed to check user";
module.exports.FAILED_TO_ADD_CRM_ID = "Failed to add crmlead id";
module.exports.SIGNIN_OTP_INVALID = "Failed to Sign In. Invalid mobile or OTP";
module.exports.SIGNIN_SUCCESS = "Successfully signed In";

module.exports.EMAIL_VERIFICATION_FAILED = "Email Verification Failed";
module.exports.INVALID_EMAIL="Invalid email"
module.exports.EMAIL_VERIFICATION_SUCCESS= "Email Verification Success";

module.exports.USERINFO_UPDATE_FAILURE = "Failed to update User Info";

module.exports.FAVOURITE_ADD_FAILED ="Failed to add favourite item";
module.exports.FAVIOURITE_REMOVE_FAILED ="Failed to remove favourite item";
module.exports.FAVOURITE_FETCH_FAILURE = "Failed to fetch Favourites";
module.exports.FAVOURITE_FETCH_NONE = "No record found to fetch Favourites";

module.exports.FAILED_TO_GET_TAGS = "Failed to get user tag"
module.exports.FAVIOURITE_DELETED_SUCCESS = "Successfully deleted faviourite item";
module.exports.USER_NOT_EXIST = "user not exists";
module.exports.SUPPLIER_ID_NOT_EXIST = "supplier id not exsists";
module.exports.DELETE_BY_SUPPLIER_ID = "successfully deleted item";
module.exports.DELETE_BY_TAG_AND_SUPPLIER_ID = "Successfully deleted tag";
module.exports.TAG_NOT_FOUND = "tag data is not correct"

module.exports.TAGS_FETCH_FAILURE = "Failed to fetch tags";
module.exports.TAGS_FETCH_SUCCESS = "Successfully fetch all tags";

module.exports.DEMO_REQUEST_FAILED ="Failed to book demo request";
module.exports.DEMO_REQUEST_SUCCESS = "Successfully booked demo request";

module.exports.FEEDBACK_REQUEST_FAILED ="Failed to send feedback";
module.exports.FEEDBACK_REQUEST_SUCCESS = "Successfully send feedback";

module.exports.RESET_PASSWORD_FAILED = "Reset password failed.";
module.exports.RESET_PASSWORD_SUCCESS = "Reset password success.";

module.exports.USER_UPDATE_IMAGE_NO_FILE_UPLOADED = "No file provided to upload.";
module.exports.USER_UPDATE_IMAGE_FAILED = "Failed to update Profile image.";
module.exports.USER_UPDATE_IMAGE_SUCCESS = "Successfully updated Profile image";

module.exports.UNIQUE_TAGS_FETCH_FAILURE = "Failed to fetch unique tags";
module.exports.UNIQUE_TAGS_FETCH_SUCCESS = "Successfully fetch all unique tags";

module.exports.TAG_ADDED_SUCCESS = "Successfully added new tag.";
module.exports.TAG_ADDED_FAILED = "Failed to add new tag.";
module.exports.TAG_ALREADY_EXIST = "This tag is already exist.";

module.exports.REACTIVATED_USER_SUCCESS = "Reactivated the user successfully.";
module.exports.REACTIVATED_USER_FAILED = "Failed to reactivated the user.";