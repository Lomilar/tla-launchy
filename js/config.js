// shim for old-style Base64 lib
function toBase64(text) {
    if (CryptoJS && CryptoJS.enc.Base64)
        return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Latin1.parse(text));
    else
        return Base64.encode(text);
}

var config = {
    "identityProviderName": "keycloak-server"
}
