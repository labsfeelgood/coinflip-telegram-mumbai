const { Scenes } = require("telegraf");
const { getSelectedWalletHtml, getWalletByName } = require("../utils");
const { CHAIN } = require("../config");

const playAmountScene = "playAmountScene";
const playAmountStep = new Scenes.BaseScene(playAmountScene);

playAmountStep.enter(async (ctx) => {
  const walletName = ctx.session.selectedPlayWalletName;
  const wallet = getWalletByName(ctx, walletName);

  let htmlMessage = await getSelectedWalletHtml(
    wallet,
    `Selected wallet to bet <b>${ctx.session.selectedCoin}</b>:\n\n`
  );

  htmlMessage += `\n\n\nHow much are we betting?\n\nPlease reply with ${CHAIN["mumbai-testnet"].currency} amount to bet.`;
  ctx.replyWithHTML(htmlMessage);
});

playAmountStep.on("text", async (ctx) => {});

module.exports = {
  playAmountScene,
  playAmountStep,
};
