require("dotenv").config();
const { Telegraf, Scenes, session } = require("telegraf");

const {
  walletsCommand,
  playCommand,
  menuCommand,
  getWalletByName,
  btnDeleteWalletAction,
  dynamicDeleteWalletAction,
  dynamicPlayWalletAction,
} = require("./utils");

const {
  importWalletScene,
  importWalletStep,
  chooseWalletNameStep,
  generateWalletSeedScene,
  generateWalletSeedStep,
  playAmountScene,
  playAmountStep,
} = require("./scenes");

const bot = new Telegraf(process.env.COINFLIP_TELEGRAM_BOT_TOKEN);

const stage = new Scenes.Stage([
  importWalletStep,
  chooseWalletNameStep,
  generateWalletSeedStep,
  playAmountStep,
]);

bot.use(session());
bot.use(stage.middleware());

// commands

bot.command("start", (ctx) => {
  const mdMessage = `Welcome to DracoFlipBot\\!\n\nTo begin setting up and using DracoFlip, submit the /menu command`;
  ctx.replyWithMarkdownV2(mdMessage);
});

bot.command("menu", async (ctx) => {
  await menuCommand(ctx, ctx.session.wallets);
});

bot.command("play", async (ctx) => {
  await playCommand(ctx, ctx.session.wallets);
});

bot.command("wallets", async (ctx) => {
  await walletsCommand(ctx, ctx.session.wallets);
});

// menu actions

bot.action("play", async (ctx) => {
  ctx.deleteMessage();
  delete ctx.session.selectedPlayWalletName;
  await playCommand(ctx, ctx.session.wallets);
});

bot.action("wallets", async (ctx) => {
  ctx.deleteMessage();
  await walletsCommand(ctx, ctx.session.wallets);
});

// back buttons

bot.action("back-to-main-menu", async (ctx) => {
  ctx.deleteMessage();
  delete ctx.session.selectedDeleteWalletName;
  delete ctx.session.selectedPlayWalletName;
  await menuCommand(ctx, ctx.session.wallets);
});

// create wallet buttons

bot.action("import-existing-wallet", (ctx) => {
  ctx.scene.enter(importWalletScene);
});

bot.action("generate-wallet-seed", (ctx) => {
  ctx.scene.enter(generateWalletSeedScene);
});

// play buttons

bot.action(/^play-wallet-/, async (ctx) => {
  ctx.deleteMessage();
  const walletName = ctx.update.callback_query.data.split("-")[2];
  ctx.session.selectedPlayWalletName = walletName;
  const wallet = getWalletByName(ctx, walletName);
  await dynamicPlayWalletAction(ctx, wallet);
});

bot.action("heads-coin", (ctx) => {
  ctx.deleteMessage();
  ctx.session.selectedCoin = "Heads";
  ctx.scene.enter(playAmountScene);
});

bot.action("tails-coin", (ctx) => {
  ctx.deleteMessage();
  ctx.session.selectedCoin = "Tails";
  ctx.scene.enter(playAmountScene);
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
