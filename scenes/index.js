const importWalletScene = require("./importWalletScene");
const generateWalletSeedScene = require("./generateWalletSeedScene");
const chooseWalletNameScene = require("./chooseWalletNameScene");
const sendCoinReceiverScene = require("./sendCoinReceiverScene");
const sendCoinAmountScene = require("./sendCoinAmountScene");
const sendTokenAddressScene = require("./sendTokenAddressScene");
const sendTokenReceiverScene = require("./sendTokenReceiverScene");
const sendTokenAmountScene = require("./sendTokenAmountScene");

module.exports = {
  ...importWalletScene,
  ...generateWalletSeedScene,
  ...chooseWalletNameScene,
  ...sendCoinReceiverScene,
  ...sendCoinAmountScene,
  ...sendTokenAddressScene,
  ...sendTokenReceiverScene,
  ...sendTokenAmountScene,
};
