const { Scenes } = require("telegraf");
const { makeItClickable } = require("../utils");

const chooseWalletNameScene = "chooseWalletNameScene";
const chooseWalletNameStep = new Scenes.BaseScene(chooseWalletNameScene);

chooseWalletNameStep.enter((ctx) =>
  ctx.reply("Choose a name for the newly generated wallet. (Max 8 characters)")
);

chooseWalletNameStep.on("text", (ctx) => {
  const walletName = ctx.message.text;

  if (walletName.length > 8) {
    ctx.reply("Wallet name must be less than or equal to 8 characters");
  } else {
    if (ctx.session.wallets && ctx.session.wallets.length === 6) {
      ctx.reply("Wallet limit reached");
    } else {
      ctx.deleteMessage();

      const newWallet = ctx.session.newWallet;
      newWallet.name = walletName;
      ctx.session.wallets = [...(ctx.session.wallets ?? []), newWallet];

      ctx.replyWithHTML(
        `✅ New wallet <b>${walletName}</b> was successfully imported & encrypted\n\nAddress:\n${makeItClickable(
          newWallet.address
        )}`
      );
    }
  }

  delete ctx.session.newWallet;
  ctx.scene.leave();
});

module.exports = {
  chooseWalletNameScene,
  chooseWalletNameStep,
};
