const importWalletScene = require("./importWalletScene");
const generateWalletSeedScene = require("./generateWalletSeedScene");
const chooseWalletNameScene = require("./chooseWalletNameScene");
const playAmountScene = require("./playAmountScene");

module.exports = {
  ...importWalletScene,
  ...generateWalletSeedScene,
  ...chooseWalletNameScene,
  ...playAmountScene,
};
