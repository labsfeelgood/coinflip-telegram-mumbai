const { Scenes } = require("telegraf");
const { chooseWalletNameScene } = require("./chooseWalletNameScene");
const { generateAccount } = require("../utils");

const importWalletScene = "importWalletScene";
const importWalletStep = new Scenes.BaseScene(importWalletScene);

importWalletStep.enter((ctx) =>
  ctx.reply(
    "Please provide either the private key of the wallet you wish to import or a 12-word mnemonic phrase."
  )
);

importWalletStep.on("text", (ctx) => {
  const phrase = ctx.message.text;
  ctx.deleteMessage();

  try {
    const wallet = generateAccount(phrase);
    ctx.session.newWallet = wallet;
    ctx.scene.enter(chooseWalletNameScene);
  } catch (error) {
    if (error.message.trim().includes("invalid hexlify value")) {
      ctx.reply(
        "😔 This does not appear to be a valid private key / mnemonic phrase. Please try again."
      );
    }
  }

  ctx.scene.leave();
});

module.exports = {
  importWalletScene,
  importWalletStep,
};
