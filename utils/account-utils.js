const { Wallet, ethers } = require("ethers");
const { encrypt } = require("./encryption-utils");

function generateAccount(seedPhrase = "", index = 0) {
  let wallet;

  // If the seed phrase is not provided, generate a random mnemonic
  if (seedPhrase === "") {
    seedPhrase = Wallet.createRandom().mnemonic.phrase;
  }

  // If the seed phrase does not contain spaces, it is likely a private key
  wallet = seedPhrase.includes(" ")
    ? Wallet.fromMnemonic(seedPhrase, `m/44'/60'/0'/0/${index}`)
    : new Wallet(seedPhrase);

  return {
    address: wallet.address,
    privateKey: encrypt(wallet.privateKey),
    mnemonic: encrypt(seedPhrase),
  };
}

async function getBalance(rpcUrl, address) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const balance = await provider.getBalance(address);
  return Number(formatEther(balance));
}

function formatBalance(value, decimalPlaces = 3) {
  const formattedBalance = +parseFloat(value).toFixed(decimalPlaces);

  if (formattedBalance < 0.001) {
    return +value;
  }

  return formattedBalance;
}

function formatEther(value) {
  return ethers.utils.formatEther(value ?? 0);
}

module.exports = {
  generateAccount,
  getBalance,
  formatBalance,
  formatEther,
};
