/**
 * Opens the Facebook OAuth popup and resolves with the access_token.
 * Relies on the Facebook JS SDK being loaded.
 */
export function initFacebookSDK() {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId:   import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie:  true,
        xfbml:   false,
        version: "v21.0",
      });
      resolve();
    };

    const script    = document.createElement("script");
    script.id       = "facebook-jssdk";
    script.src      = "https://connect.facebook.net/en_US/sdk.js";
    script.async    = true;
    script.defer    = true;
    document.head.appendChild(script);
  });
}

const FB_SCOPE = [
  "public_profile",
  "pages_show_list",
  "pages_messaging",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_manage_engagement",
  "pages_read_user_content",
  "instagram_basic",
  "instagram_manage_messages",
  "instagram_manage_comments",
  "instagram_manage_engagement",
  "whatsapp_business_management",
  "whatsapp_business_messaging",
].join(",");

/**
 * Trigger Facebook Login popup and return the access_token string.
 * @returns {Promise<string>} access_token
 */
export function loginWithFacebook() {
  return new Promise((resolve, reject) => {
    window.FB.login(
      (response) => {
        if (response.authResponse?.accessToken) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error("Facebook login was cancelled or failed."));
        }
      },
      { scope: FB_SCOPE }
    );
  });
}
