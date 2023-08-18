const { Scenes } = require("telegraf");
const { ethers, Contract } = require("ethers");
const {
  getPendingGameId,
  getRefundDelay,
  replyWithHTMLAndInlineKeyboard,
  createCallBackBtn,
  decrypt,
  getWalletByName,
} = require("../utils");
const { COIN_FLIP_ABI, COIN_FLIP_CONTRACT, CHAIN } = require("../config");

const pendingTxScene = "pendingTxScene";
const pendingTxStep = new Scenes.BaseScene(pendingTxScene);

pendingTxStep.enter(async (ctx) => {
  const wallet = getWalletByName(ctx, ctx.session.selectedPlayWalletName);
  const { pendingNewFlip } = await getPendingGameId(wallet.address);
  const refundDelay = await getRefundDelay();
  const pendingBetTimestamp = pendingNewFlip.time;

  const provider = new ethers.providers.JsonRpcProvider(
    CHAIN["mumbai-testnet"].rpcUrl
  );
  const contractWallet = new ethers.Wallet(
    decrypt(wallet.privateKey),
    provider
  );
  const contract = new Contract(
    COIN_FLIP_CONTRACT,
    COIN_FLIP_ABI,
    contractWallet
  );

  let stillPending = true;

  contract.on("FlipCompleted", (player, didWin, isTail, amount, gameId) => {
    ctx.deleteMessage();

    if (
      pendingNewFlip.gameId.toString() === gameId.toString() &&
      player === wallet.address &&
      stillPending
    ) {
      ctx.replyWithHTML(
        `<b>You ${didWin ? "Win" : "Lost"}</b>${
          didWin
            ? `\nYou will get ${formatEther(amount.toString())} amount of ${
                CHAIN["mumbai-testnet"].currency
              } as a reward in your wallet`
            : ""
        }\n\nPlay again /play`
      );

      delete ctx.session.selectedPlayWalletName;
      ctx.scene.leave();
    }
  });

  const intervalId = setInterval(() => {
    if (pendingBetTimestamp) {
      const diffBtwDatesInSec = Math.floor(
        (new Date() - new Date(pendingBetTimestamp * 1000)) / 1000
      );

      if (diffBtwDatesInSec >= refundDelay) {
        clearInterval(intervalId);
        stillPending = false;

        const inlineKeyboard = [
          [createCallBackBtn("💸 Get Refund", "get-refund")],
        ];
        replyWithHTMLAndInlineKeyboard(
          ctx,
          `Oops!\nYou can get your refund back`,
          inlineKeyboard
        );
      }
    }

    clearInterval(intervalId);
  }, 1000);
});

module.exports = {
  pendingTxScene,
  pendingTxStep,
};
