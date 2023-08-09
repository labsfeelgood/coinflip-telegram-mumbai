const { Scenes } = require("telegraf");
const { ethers } = require("ethers");
const { getSelectedWalletHtml, getWalletByName } = require("../utils");
const { sendCoinAmountScene } = require("./sendCoinAmountScene");
const { CHAIN } = require("../config");

const sendCoinReceiverScene = "sendCoinReceiverScene";
const sendCoinReceiverStep = new Scenes.BaseScene(sendCoinReceiverScene);

sendCoinReceiverStep.enter(async (ctx) => {
  const wallet = getWalletByName(ctx, ctx.session.selectedWalletName);
  const selectedWalletHtml = await getSelectedWalletHtml(
    wallet,
    "",
    ctx.session.selectedChainObjKey
  );

  const htmlMessage = `📤 Send ${
    CHAIN[ctx.session.selectedChainObjKey].currency
  }\n\n${selectedWalletHtml}\n\nWho are we sending to?\n\nPlease reply with the receiving address.`;
  ctx.replyWithHTML(htmlMessage);
});

sendCoinReceiverStep.on("text", (ctx) => {
  const recieverAddress = ctx.message.text;
  if (ethers.utils.isAddress(recieverAddress)) {
    ctx.session.recieverAddress = recieverAddress;
    ctx.scene.enter(sendCoinAmountScene);
  } else {
    delete ctx.session.selectedChainObjKey;
    delete ctx.session.selectedWalletName;

    ctx.reply("Invalid reciever address");
    ctx.scene.leave();
  }
});

module.exports = {
  sendCoinReceiverScene,
  sendCoinReceiverStep,
};
