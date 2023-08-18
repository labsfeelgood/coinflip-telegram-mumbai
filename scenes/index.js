const importWalletScene = require("./importWalletScene");
const generateWalletSeedScene = require("./generateWalletSeedScene");
const chooseWalletNameScene = require("./chooseWalletNameScene");
const playAmountScene = require("./playAmountScene");
const pendingTxScene = require("./pendingTxScene");

module.exports = {
  ...importWalletScene,
  ...generateWalletSeedScene,
  ...chooseWalletNameScene,
  ...playAmountScene,
  ...pendingTxScene,
};
