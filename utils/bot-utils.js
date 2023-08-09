const { Markup } = require("telegraf");
const { formatBalance, getBalance } = require("./account-utils");
const { CHAIN } = require("../config");

// get selected wallet html
async function getSelectedWalletHtml(selectedWallet, prefixWithMessage = "") {
  const walletBalanceInEth = await getBalance(
    CHAIN.rpcUrl,
    selectedWallet.address
  );

  if (prefixWithMessage === "") {
    prefixWithMessage = `Selected Chain: ${CHAIN.name}\n\nSelected Wallet\n\n`;
  }

  return `${prefixWithMessage}Wallet <b>${
    selectedWallet.name
  }</b>:\nAddress: ${makeItClickable(selectedWallet.address)}\n${formatBalance(
    walletBalanceInEth
  )} ${CHAIN.currency}`;
}

// get wallet by name
function getWalletByName(ctx, walletName) {
  return ctx.session.wallets.find((_wallet) => _wallet.name === walletName);
}

// make it clickable
function makeItClickable(text) {
  return `<code>${text}</code>`;
}

// replyWithHTML and inlineKeyboards
function replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard) {
  ctx.replyWithHTML(htmlMessage, {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
}

// create callback button
function createCallBackBtn(btnLabel, cbActionCommand) {
  return Markup.button.callback(btnLabel, cbActionCommand);
}

async function walletsList(wallets) {
  let htmlMessage = "";
  let balance = 0;

  for (const wallet of wallets) {
    try {
      const walletBalanceInEth = await getBalance(CHAIN.rpcUrl, wallet.address);

      balance += walletBalanceInEth;
      htmlMessage += `Wallet <b>${wallet.name}</b>:\nAddress: ${makeItClickable(
        wallet.address
      )}\n<b>${formatBalance(walletBalanceInEth)} ${CHAIN.currency}</b>\n\n`;
    } catch (error) {
      console.log("walletsList-error", error);
    }
  }

  return { htmlMessage, balance };
}

// show Menu commands
async function menuCommand(ctx, wallets) {
  let htmlMessage = "👛 Balances (Combined):\n";

  if (wallets && wallets.length) {
    const { balance, htmlMessage: _htmlMessage } = await walletsList(wallets);
    htmlMessage += `<b>${formatBalance(balance)} ${
      CHAIN.currency
    }</b>\n\n${_htmlMessage}`;
  } else {
    htmlMessage += `<b>0.000 ${CHAIN.currency}</b>`;
  }

  const walletsButton = createCallBackBtn("Wallets", "wallets");
  const inlineKeyboard = [[walletsButton]];
  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

// show Wallets commands
async function walletsCommand(ctx, wallets) {
  let htmlMessage = "";

  const importWalletBtn = createCallBackBtn(
    "🔌 Import an Existing Wallet",
    "import-existing-wallet"
  );
  const generateWalletBtn = createCallBackBtn(
    "✍️ Generate a new Wallet Seed",
    "generate-wallet-seed"
  );
  const backToMenuBtn = createCallBackBtn(
    "⬅️ Back to Main Menu",
    "back-to-main-menu"
  );

  const inlineKeyboard = [[importWalletBtn], [generateWalletBtn]];

  if (wallets && wallets.length) {
    const deleteWalletBtn = createCallBackBtn(
      "❌ Delete Wallet",
      "btn-delete-wallet"
    );
    const testnetChainBtn = createCallBackBtn(
      `🔌 ${CHAIN.name}`,
      CHAIN.cbActionKey
    );

    inlineKeyboard.push([deleteWalletBtn], [testnetChainBtn]);
    const { htmlMessage: _htmlMessage } = await walletsList(wallets);
    htmlMessage += `${_htmlMessage}\n👇 Pick a chain we're interacting with:`;
  } else {
    htmlMessage =
      "<b>⚠️ There are no active wallets associated with your account.</b>\n\nYou can either link an already existing wallet or create a new wallet seed from the menu below.";
  }

  inlineKeyboard.push([backToMenuBtn]);

  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

// show chain action
async function chainAction(ctx, wallets) {
  const { htmlMessage: _htmlMessage } = await walletsList(wallets);
  const htmlMessage = `Select Wallet:\n\n${_htmlMessage}`;

  const walletsBtns = wallets.map((wallet) => {
    return createCallBackBtn(wallet.name, `wallet-${wallet.name}`);
  });
  const backToWalletsBtn = createCallBackBtn(
    "⬅️ Back to Wallets",
    "back-to-wallets"
  );
  const inlineKeyboard = [walletsBtns, [backToWalletsBtn]];

  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

// show dynamic wallet action
async function dynamicWalletAction(ctx, wallet) {
  const htmlMessage = await getSelectedWalletHtml(wallet);

  const sendCoinBtn = createCallBackBtn(
    `📤 Send ${CHAIN.currency}`,
    "send-coin"
  );
  const sendTokenBtn = createCallBackBtn(`📤 Send Token`, "send-token");
  const backToWalletsBtn = createCallBackBtn(
    "⬅️ Back to Selection",
    "back-to-wallets"
  );

  const inlineKeyboard = [[sendCoinBtn, sendTokenBtn], [backToWalletsBtn]];
  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

// delete wallet warning message
const deleteWalletWarningMsg =
  "⚠️ Warning ⚠️\nDeleting a wallet is irreversible.\n\nIf you do not have your private keys backed up, please transfer out all funds from your wallet.\n\nIf a wallet is deleted and you do not have your private keys, you will lose access to your funds.";

// show delete wallet action
async function btnDeleteWalletAction(ctx, wallets) {
  const { htmlMessage: _htmlMessage } = await walletsList(wallets);
  const htmlMessage = `Please select a wallet to delete:\n\n${_htmlMessage}\n\n\n\n${deleteWalletWarningMsg}`;

  const walletsBtns = wallets.map((wallet) => {
    return createCallBackBtn(wallet.name, `delete-wallet-${wallet.name}`);
  });
  const backToMenuBtn = createCallBackBtn(
    "⬅️ Back to Menu",
    "back-to-main-menu"
  );
  const inlineKeyboard = [walletsBtns, [backToMenuBtn]];

  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

// show dynamic delete wallet action
async function dynamicDeleteWalletAction(ctx, wallet) {
  let htmlMessage = await getSelectedWalletHtml(
    wallet,
    "Selected wallet for deletion:\n\n"
  );

  htmlMessage = `${htmlMessage}\n\n\n\nℹ️ Press one of the buttons below to confirm or cancel deletion of the wallet.\n\n${deleteWalletWarningMsg}`;

  const confirmDeleteBtn = createCallBackBtn(
    "✅ Confirm Delete",
    "confirm-delete-wallet"
  );
  const cancelDeleteBtn = createCallBackBtn(
    "❌ Cancel",
    "cancel-delete-wallet"
  );

  const inlineKeyboard = [[confirmDeleteBtn, cancelDeleteBtn]];
  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

module.exports = {
  getSelectedWalletHtml,
  getWalletByName,
  makeItClickable,
  replyWithHTMLAndInlineKeyboard,
  createCallBackBtn,
  walletsCommand,
  menuCommand,
  chainAction,
  dynamicWalletAction,
  btnDeleteWalletAction,
  dynamicDeleteWalletAction
};


/**
 
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
 */