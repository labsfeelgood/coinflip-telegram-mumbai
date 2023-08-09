const { Scenes } = require("telegraf");
const {
  getSelectedWalletHtml,
  getWalletByName,
  getERC20TokenSymbol,
} = require("../utils");
const { sendTokenReceiverScene } = require("./sendTokenReceiverScene");

const sendTokenAddressScene = "sendTokenAddressScene";
const sendTokenAddressStep = new Scenes.BaseScene(sendTokenAddressScene);

sendTokenAddressStep.enter(async (ctx) => {
  const wallet = getWalletByName(ctx, ctx.session.selectedWalletName);
  const selectedWalletHtml = await getSelectedWalletHtml(
    wallet,
    "",
    ctx.session.selectedChainObjKey
  );

  const htmlMessage = `📤 Send Token\n\n${selectedWalletHtml}\n\nWhich token are we sending?\n\nPlease reply with the contract address of the token.`;
  ctx.replyWithHTML(htmlMessage);
});

sendTokenAddressStep.on("text", async (ctx) => {
  try {
    const tokenAddress = ctx.message.text;
    const tokenSymbol = await getERC20TokenSymbol(
      tokenAddress,
      ctx.session.selectedChainObjKey
    );

    ctx.session.tokenSymbol = tokenSymbol;
    ctx.session.tokenAddress = tokenAddress;
    ctx.scene.enter(sendTokenReceiverScene);
  } catch (error) {
    delete ctx.session.selectedChainObjKey;
    delete ctx.session.selectedWalletName;

    ctx.reply("Invalid token address");
    ctx.scene.leave();
  }
});

module.exports = {
  sendTokenAddressScene,
  sendTokenAddressStep,
};
