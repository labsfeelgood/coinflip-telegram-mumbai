require("dotenv").config();
const { Telegraf, Scenes, session } = require("telegraf");
const {
  walletsCommand,
  menuCommand,
  chainAction,
  dynamicWalletAction,
  getWalletByName,
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
  const mdMessage = `Welcome to EthWalletBot\\!\n\nTo begin setting up and using your EthWallet, submit the /menu command`;
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

bot.action("back-to-main-menu", async (ctx) => {
  ctx.deleteMessage();
  await menuCommand(ctx, ctx.session.wallets);
});

bot.action("import-existing-wallet", (ctx) => {
  ctx.scene.enter(importWalletScene);
});

bot.action("generate-wallet-seed", (ctx) => {
  ctx.scene.enter(generateWalletSeedScene);
});

bot.action(CHAIN.cbActionKey, async (ctx) => {
  ctx.deleteMessage();
  await chainAction(ctx, ctx.session.wallets);
});

bot.action("back-to-wallets", async (ctx) => {
  ctx.deleteMessage();
  delete ctx.session.selectedWalletName;
  await walletsCommand(ctx, ctx.session.wallets);
});

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

bot.launch();
