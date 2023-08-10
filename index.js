require("dotenv").config();
const { Telegraf, Scenes, session } = require("telegraf");
const {
  walletsCommand,
  menuCommand,
  chainAction,
  dynamicWalletAction,
  getWalletByName,
  btnDeleteWalletAction,
  dynamicDeleteWalletAction,
} = require("./utils");
const { CHAIN } = require("./config");

const {
  importWalletScene,
  importWalletStep,
  chooseWalletNameStep,
  generateWalletSeedScene,
  generateWalletSeedStep,
  sendCoinReceiverScene,
  sendCoinReceiverStep,
  sendCoinAmountStep,
  sendTokenAddressScene,
  sendTokenAddressStep,
  sendTokenReceiverStep,
  sendTokenAmountStep,
} = require("./scenes");

const bot = new Telegraf(process.env.ETH_WALLET_TELEGRAM_BOT_TOKEN);

const stage = new Scenes.Stage([
  importWalletStep,
  chooseWalletNameStep,
  generateWalletSeedStep,
  sendCoinReceiverStep,
  sendCoinAmountStep,
  sendTokenAmountStep,
  sendTokenReceiverStep,
  sendTokenAddressStep,
]);

bot.use(session());
bot.use(stage.middleware());

bot.command("start", (ctx) => {
  const mdMessage = `Welcome to DracoBot\\!\n\nTo begin setting up and using your EthWallet, submit the /menu command`;
  ctx.replyWithMarkdownV2(mdMessage);
});

bot.command("menu", async (ctx) => {
  await menuCommand(ctx, ctx.session.wallets);
});

bot.command("wallets", async (ctx) => {
  await walletsCommand(ctx, ctx.session.wallets);
});

bot.action("wallets", async (ctx) => {
  ctx.deleteMessage();
  await walletsCommand(ctx, ctx.session.wallets);
});

// back buttons

bot.action("back-to-main-menu", async (ctx) => {
  ctx.deleteMessage();
  delete ctx.session.selectedDeleteWalletName;
  await menuCommand(ctx, ctx.session.wallets);
});

bot.action("back-to-wallets", async (ctx) => {
  ctx.deleteMessage();
  delete ctx.session.selectedWalletName;
  delete ctx.session.selectedChainObjKey;
  await walletsCommand(ctx, ctx.session.wallets);
});

// create wallet buttons

bot.action("import-existing-wallet", (ctx) => {
  ctx.scene.enter(importWalletScene);
});

bot.action("generate-wallet-seed", (ctx) => {
  ctx.scene.enter(generateWalletSeedScene);
});

// chain buttons

bot.action(CHAIN["mumbai-testnet"].cbActionKey, async (ctx) => {
  ctx.deleteMessage();
  ctx.session.selectedChainObjKey = "mumbai-testnet";
  await chainAction(ctx, ctx.session.wallets);
});

bot.action(CHAIN["ethereum"].cbActionKey, async (ctx) => {
  ctx.deleteMessage();
  ctx.session.selectedChainObjKey = "ethereum";
  await chainAction(ctx, ctx.session.wallets);
});

bot.action(CHAIN["polygon"].cbActionKey, async (ctx) => {
  ctx.deleteMessage();
  ctx.session.selectedChainObjKey = "polygon";
  await chainAction(ctx, ctx.session.wallets);
});

bot.action(CHAIN["bsc"].cbActionKey, async (ctx) => {
  ctx.deleteMessage();
  ctx.session.selectedChainObjKey = "bsc";
  await chainAction(ctx, ctx.session.wallets);
});

// send buttons

bot.action(/^wallet-/, async (ctx) => {
  ctx.deleteMessage();
  const walletName = ctx.update.callback_query.data.split("-")[1];
  ctx.session.selectedWalletName = walletName;
  const wallet = getWalletByName(ctx, walletName);
  await dynamicWalletAction(ctx, wallet);
});

bot.action("send-coin", async (ctx) => {
  ctx.scene.enter(sendCoinReceiverScene);
});

bot.action("send-token", async (ctx) => {
  ctx.scene.enter(sendTokenAddressScene);
});

// delete buttons

bot.action("btn-delete-wallet", async (ctx) => {
  ctx.deleteMessage();
  await btnDeleteWalletAction(ctx, ctx.session.wallets);
});

bot.action(/^delete-wallet-/, async (ctx) => {
  ctx.deleteMessage();
  const walletName = ctx.update.callback_query.data.split("-")[2];
  ctx.session.selectedDeleteWalletName = walletName;
  const wallet = getWalletByName(ctx, walletName);
  await dynamicDeleteWalletAction(ctx, wallet);
});

bot.action("confirm-delete-wallet", async (ctx) => {
  ctx.deleteMessage();
  ctx.session.wallets = ctx.session.wallets.filter(
    (_wallet) => _wallet.name !== ctx.session.selectedDeleteWalletName
  );

  delete ctx.session.selectedDeleteWalletName;

  if (ctx.session.wallets.length) {
    await btnDeleteWalletAction(ctx, ctx.session.wallets);
  } else {
    await walletsCommand(ctx, ctx.session.wallets);
  }
});

bot.launch();
