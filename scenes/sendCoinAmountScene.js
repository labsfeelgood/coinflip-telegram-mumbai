const { Scenes } = require("telegraf");
const {
  getSelectedWalletHtml,
  sendToken,
  getWalletByName,
} = require("../utils");
const { CHAIN } = require("../config");

const sendCoinAmountScene = "sendCoinAmountScene";
const sendCoinAmountStep = new Scenes.BaseScene(sendCoinAmountScene);

sendCoinAmountStep.enter(async (ctx) => {
  const wallet = getWalletByName(ctx, ctx.session.selectedWalletName);
  const selectedChainObjKey = ctx.session.selectedChainObjKey;

  const selectedWalletHtml = await getSelectedWalletHtml(
    wallet,
    "",
    selectedChainObjKey
  );

  const htmlMessage = `📤 Send ${CHAIN[selectedChainObjKey].currency}\n\n${selectedWalletHtml}\n\nHow much are we sending?\n\nPlease reply with ${CHAIN[selectedChainObjKey].currency} amount to send.`;
  ctx.replyWithHTML(htmlMessage);
});

sendCoinAmountStep.on("text", async (ctx) => {
  try {
    const sendAmount = Number.parseFloat(ctx.message.text);
    const wallet = getWalletByName(ctx, ctx.session.selectedWalletName);
    const selectedChainObjKey = ctx.session.selectedChainObjKey;

    const pendingReply = await ctx.reply("pending...");
    try {
      const { transaction } = await sendToken(
        sendAmount,
        ctx.session.recieverAddress,
        wallet.privateKey,
        selectedChainObjKey
      );

      ctx.deleteMessage(pendingReply.message_id);
      const pendingTxHashReply = await ctx.reply(
        `⏱️ Transaction Pending!\n\nTransaction hash:\n${CHAIN[selectedChainObjKey].explorerUrl}/tx/${transaction.hash}`
      );

      const receipt = await transaction.wait();
      ctx.deleteMessage(pendingTxHashReply.message_id);

      if (receipt.status === 1) {
        ctx.replyWithHTML(
          `✅ Transaction Confirmed!\n\nTransaction hash:\n${CHAIN[selectedChainObjKey].explorerUrl}/tx/${receipt.transactionHash}`
        );
      } else {
        ctx.replyWithHTML(`😔 Failed to send ${receipt}`);
      }
    } catch (error) {
      ctx.deleteMessage(pendingReply.message_id);
      ctx.replyWithHTML(error.message);
    }
  } catch (_) {
    ctx.replyWithHTML("⚠️ Incorrect send amount.");
  }

  delete ctx.session.selectedWalletName;
  delete ctx.session.selectedChainObjKey;
  delete ctx.session.recieverAddress;
  ctx.scene.leave();
});

module.exports = {
  sendCoinAmountScene,
  sendCoinAmountStep,
};
