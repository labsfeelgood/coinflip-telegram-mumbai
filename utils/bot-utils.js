const { Markup } = require("telegraf");
const {
  formatBalance,
  getBalance,
  getMaxBet,
  getPauseStatus,
} = require("./account-utils");
const { CHAIN } = require("../config");

// get wallet total balance
async function getWalletTotalBalance(walletAddress, selectedChainObjKey = "") {
  let totalWalletBalanceInEth = "";
  const totalWalletBalance = {};

  for (const chainKey in CHAIN) {
    if (selectedChainObjKey && selectedChainObjKey !== chainKey) {
      continue;
    }

    const walletBalanceInEth = await getBalance(
      CHAIN[chainKey].rpcUrl,
      walletAddress
    );
    totalWalletBalance[CHAIN[chainKey].currency] = walletBalanceInEth;

    if (totalWalletBalanceInEth === "") {
      totalWalletBalanceInEth += `${formatBalance(walletBalanceInEth)} ${
        CHAIN[chainKey].currency
      }`;
    } else {
      totalWalletBalanceInEth += ` | ${formatBalance(walletBalanceInEth)} ${
        CHAIN[chainKey].currency
      }`;
    }
  }

  return { totalWalletBalanceInEth, totalWalletBalance };
}

// get selected wallet html
async function getSelectedWalletHtml(
  selectedWallet,
  prefixWithMessage = "",
  selectedChainObjKey = ""
) {
  const { totalWalletBalanceInEth } = await getWalletTotalBalance(
    selectedWallet.address,
    selectedChainObjKey
  );

  if (prefixWithMessage === "") {
    prefixWithMessage = `Selected Chain: ${CHAIN[selectedChainObjKey].name}\n\nSelected Wallet\n\n`;
  }

  return `${prefixWithMessage}Wallet <b>${
    selectedWallet.name
  }</b>:\nAddress: ${makeItClickable(
    selectedWallet.address
  )}\n${totalWalletBalanceInEth}`;
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

async function walletsList(wallets, selectedChainObjKey = "") {
  let htmlMessage = "";
  const totalBalance = {};

  for (const wallet of wallets) {
    try {
      const { totalWalletBalanceInEth, totalWalletBalance } =
        await getWalletTotalBalance(wallet.address, selectedChainObjKey);

      for (const chainCurrency in totalWalletBalance) {
        totalBalance[chainCurrency] = formatBalance(
          totalWalletBalance[chainCurrency] + (totalBalance[chainCurrency] ?? 0)
        );
      }

      htmlMessage += `Wallet <b>${wallet.name}</b>:\nAddress: ${makeItClickable(
        wallet.address
      )}\n<b>${totalWalletBalanceInEth}</b>\n\n`;
    } catch (error) {
      console.log("walletsList-error", error);
    }
  }

  const balance = Object.keys(totalBalance).reduce((acc, currCurrency) => {
    if (acc === "") {
      return `${totalBalance[currCurrency]} ${currCurrency}`;
    } else {
      return (acc += ` | ${totalBalance[currCurrency]} ${currCurrency}`);
    }
  }, "");

  return { htmlMessage, balance };
}

// show Menu commands
async function menuCommand(ctx, wallets) {
  const processingReply = await ctx.reply("processing...");
  let htmlMessage = "👛 Balances (Combined):\n";

  if (wallets && wallets.length) {
    const { balance, htmlMessage: _htmlMessage } = await walletsList(wallets);
    htmlMessage += `<b>${balance}</b>\n\n${_htmlMessage}`;
  } else {
    let nullTotalBalance = "";

    for (const chainKey in CHAIN) {
      if (nullTotalBalance === "") {
        nullTotalBalance += `0.000 ${CHAIN[chainKey].currency}`;
      } else {
        nullTotalBalance += ` | 0.000 ${CHAIN[chainKey].currency}`;
      }
    }

    htmlMessage += `<b>${nullTotalBalance}</b>`;
  }

  const walletsButton = createCallBackBtn("Wallets", "wallets");
  const playButton = createCallBackBtn("Play", "play");
  const inlineKeyboard = [[walletsButton, playButton]];

  ctx.deleteMessage(processingReply.message_id);
  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

// show Play commands
async function playCommand(ctx, wallets) {
  let htmlMessage = "";
  const inlineKeyboard = [];
  const processingReply = await ctx.reply("processing...");
  const MAX_BET = await getMaxBet();
  const pauseStatus = await getPauseStatus();

  const backToMainMenu = createCallBackBtn(
    "⬅️ Back to Main Menu",
    "back-to-main-menu"
  );

  if (pauseStatus) {
    htmlMessage =
      "<b>⚠️ Under Construction. Not taking any new Bets at the moment.</b>";

    inlineKeyboard.push([backToMainMenu]);
  } else if (Number(MAX_BET) === 0) {
    htmlMessage =
      "<b>⚠️ There is no balance in the contract at the moment. No betting.</b>";

    inlineKeyboard.push([backToMainMenu]);
  } else if (wallets && wallets.length) {
    const { htmlMessage: _htmlMessage } = await walletsList(wallets);
    htmlMessage = `Please select a wallet to play:\n\n${_htmlMessage}`;

    const walletsBtns = wallets.map((wallet) => {
      return createCallBackBtn(wallet.name, `play-wallet-${wallet.name}`);
    });

    inlineKeyboard.push(walletsBtns, [backToMainMenu]);
  } else {
    htmlMessage =
      "<b>⚠️ There are no active wallets associated with your account.</b>\n\nTo play, you need at least one active wallet.";

    const goToWalletsMenu = createCallBackBtn(
      "⬆️ Go to Wallets Menu",
      "wallets"
    );

    inlineKeyboard.push([goToWalletsMenu]);
  }

  ctx.deleteMessage(processingReply.message_id);
  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

// show dynamic play wallet action
async function dynamicPlayWalletAction(ctx, wallet) {
  let htmlMessage = await getSelectedWalletHtml(
    wallet,
    "Selected wallet for play:\n\n"
  );

  htmlMessage = `${htmlMessage}\n\n\n\nℹ️ Press one of the buttons below to choose a coin.`;

  const headsBtn = createCallBackBtn("🤯 Heads", "heads-coin");
  const tailsBtn = createCallBackBtn("🦘 Tails", "tails-coin");
  const backToPlayMenu = createCallBackBtn("⬅️ Back to Play Menu", "play");

  const inlineKeyboard = [[headsBtn, tailsBtn], [backToPlayMenu]];
  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

// show Wallets commands
async function walletsCommand(ctx, wallets) {
  let htmlMessage = "";
  const processingReply = await ctx.reply("processing...");

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

    inlineKeyboard.push([deleteWalletBtn]);

    const { htmlMessage: _htmlMessage } = await walletsList(wallets);
    htmlMessage += `${_htmlMessage}`;
  } else {
    htmlMessage =
      "<b>⚠️ There are no active wallets associated with your account.</b>\n\nYou can either link an already existing wallet or create a new wallet seed from the menu below.";
  }

  inlineKeyboard.push([backToMenuBtn]);

  ctx.deleteMessage(processingReply.message_id);
  replyWithHTMLAndInlineKeyboard(ctx, htmlMessage, inlineKeyboard);
}

// delete wallet warning message
const deleteWalletWarningMsg =
  "⚠️ Warning ⚠️\nDeleting a wallet is irreversible.\n\nIf you do not have your private keys backed up, please transfer out all funds from your wallet.\n\nIf a wallet is deleted and you do not have your private keys, you will lose access to your funds.";

// show delete wallet action
async function btnDeleteWalletAction(ctx, wallets) {
  const processingReply = await ctx.reply("processing...");

  const { htmlMessage: _htmlMessage } = await walletsList(wallets);
  const htmlMessage = `Please select a wallet to delete:\n\n${_htmlMessage}\n\n${deleteWalletWarningMsg}`;

  const walletsBtns = wallets.map((wallet) => {
    return createCallBackBtn(wallet.name, `delete-wallet-${wallet.name}`);
  });
  const backToMenuBtn = createCallBackBtn(
    "⬅️ Back to Menu",
    "back-to-main-menu"
  );
  const inlineKeyboard = [walletsBtns, [backToMenuBtn]];

  ctx.deleteMessage(processingReply.message_id);
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
  const cancelDeleteBtn = createCallBackBtn("❌ Cancel", "back-to-main-menu");

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
  playCommand,
  menuCommand,
  btnDeleteWalletAction,
  dynamicDeleteWalletAction,
  dynamicPlayWalletAction,
};
