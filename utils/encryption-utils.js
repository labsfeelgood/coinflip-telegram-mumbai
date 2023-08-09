require("dotenv").config();
const crypto = require("crypto-js");

// AES encryption function
function encrypt(text) {
  return crypto.AES.encrypt(
    text,
    process.env.ETH_WALLET_TELEGRAM_BOT_TOKEN
  ).toString();
}

// AES decryption function
function decrypt(cipherText) {
  const bytes = crypto.AES.decrypt(
    cipherText,
    process.env.ETH_WALLET_TELEGRAM_BOT_TOKEN
  );

  return bytes.toString(crypto.enc.Utf8);
}

module.exports = {
  encrypt,
  decrypt,
};
