require("dotenv").config();
const { Telegraf, Scenes, session } = require("telegraf");
const { BOT_NAME } = require("./config");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const {
  walletsCommand,
  playCommand,
  historyCommand,
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
  // pendingTxStep,
} = require("./scenes");

app.use(express.json());
const bot = new Telegraf(process.env.COINFLIP_TELEGRAM_BOT_TOKEN);
app.use(bot.webhookCallback("/secret-path"));
bot.telegram.setWebhook(
  "https://arbitrum-draco-flip-telegram-bot.onrender.com/secret-path"
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const stage = new Scenes.Stage([
  importWalletStep,
  chooseWalletNameStep,
  generateWalletSeedStep,
  playAmountStep,
  // pendingTxStep,
]);

bot.use(session());
bot.use(stage.middleware());

// commands

bot.command("start", (ctx) => {
  const mdMessage = `Welcome to ${BOT_NAME}\\!\n\nTo begin setting up and using ${BOT_NAME}, submit the /menu command`;
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

bot.command("info", (ctx) => {
  ctx.reply(
    "The game employs Chainlink VRF to obtain a random number and determine the game outcome. A fee of 25% of the bet amount is charged for participating in the game."
  );
});

bot.command("history", async (ctx) => {
  await historyCommand(ctx);
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

bot.action("history", async (ctx) => {
  ctx.deleteMessage();
  await historyCommand(ctx);
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

// bot.launch();

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
