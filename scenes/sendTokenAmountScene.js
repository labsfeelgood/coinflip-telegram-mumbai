const { Scenes } = require("telegraf");
const {
  sendERC20Token,
  getWalletByName,
  getERC20TokenBalanceOf,
  getBalance,
  formatBalance,
  makeItClickable,
} = require("../utils");
const { CHAIN } = require("../config");

const sendTokenAmountScene = "sendTokenAmountScene";
const sendTokenAmountStep = new Scenes.BaseScene(sendTokenAmountScene);

sendTokenAmountStep.enter(async (ctx) => {
  const wallet = getWalletByName(ctx, ctx.session.selectedWalletName);
  const selectedChainObjKey = ctx.session.selectedChainObjKey;
  const walletBalanceInEth = await getBalance(
    CHAIN[selectedChainObjKey].rpcUrl,
    wallet.address
  );

  const tokenBalance = await getERC20TokenBalanceOf(
    ctx.session.tokenAddress,
    wallet.address,
    selectedChainObjKey
  );

  const selectedWalletHtml = `Selected Chain: ${
    CHAIN[selectedChainObjKey].name
  }\n\nSelected Wallet\n\nWallet <b>${
    wallet.name
  }</b>:\nAddress: ${makeItClickable(wallet.address)}\n${formatBalance(
    walletBalanceInEth
  )} ${CHAIN[selectedChainObjKey].currency} | ${tokenBalance} ${
    ctx.session.tokenSymbol
  }`;

  const htmlMessage = `📤 Send Token\n\n${selectedWalletHtml}\n\nHow much are we sending?\n\nPlease reply with ${ctx.session.tokenSymbol} amount to send.`;
  ctx.replyWithHTML(htmlMessage);
});

sendTokenAmountStep.on("text", async (ctx) => {
  try {
    const sendAmount = ctx.message.text;
    const wallet = getWalletByName(ctx, ctx.session.selectedWalletName);
    const selectedChainObjKey = ctx.session.selectedChainObjKey;

    const pendingReply = await ctx.reply("pending...");
    try {
      const { transaction } = await sendERC20Token(
        ctx.session.tokenAddress,
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
  delete ctx.session.tokenAddress;
  delete ctx.session.tokenSymbol;

  ctx.scene.leave();
});

module.exports = {
  sendTokenAmountScene,
  sendTokenAmountStep,
};
