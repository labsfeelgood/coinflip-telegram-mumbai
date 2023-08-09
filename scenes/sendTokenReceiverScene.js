const { Scenes } = require("telegraf");
const { ethers } = require("ethers");
const { getSelectedWalletHtml, getWalletByName } = require("../utils");
const { sendTokenAmountScene } = require("./sendTokenAmountScene");
const { CHAIN } = require("../config");

const sendTokenReceiverScene = "sendTokenReceiverScene";
const sendTokenReceiverStep = new Scenes.BaseScene(sendTokenReceiverScene);

sendTokenReceiverStep.enter(async (ctx) => {
  const wallet = getWalletByName(ctx, ctx.session.selectedWalletName);
  const selectedWalletHtml = await getSelectedWalletHtml(wallet);
  const htmlMessage = `📤 Send Token\n\n${selectedWalletHtml}\n\nWho are we sending to?\n\nPlease reply with the receiving address.`;
  ctx.replyWithHTML(htmlMessage);
});

sendTokenReceiverStep.on("text", (ctx) => {
  const recieverAddress = ctx.message.text;

  if (ethers.utils.isAddress(recieverAddress)) {
    ctx.session.recieverAddress = recieverAddress;
    ctx.scene.enter(sendTokenAmountScene);
  } else {
    delete ctx.session.selectedWalletName;
    delete ctx.session.tokenAddress;
    delete ctx.session.tokenSymbol;

    ctx.reply("Invalid reciever address");
    ctx.scene.leave();
  }
});

module.exports = {
  sendTokenReceiverScene,
  sendTokenReceiverStep,
};
