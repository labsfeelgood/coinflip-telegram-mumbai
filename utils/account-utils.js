const { Wallet, ethers, Contract } = require("ethers");
const { encrypt, decrypt } = require("./encryption-utils");
const { COIN_FLIP_CONTRACT, COIN_FLIP_ABI, CHAIN } = require("../config");

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

async function flipWrite(amount, isTail, privateKey) {
  const provider = new ethers.providers.JsonRpcProvider(
    CHAIN["mumbai-testnet"].rpcUrl
  );
  const wallet = new ethers.Wallet(decrypt(privateKey), provider);

  const contract = new Contract(COIN_FLIP_CONTRACT, COIN_FLIP_ABI, wallet);
  const transaction = await contract.flip(
    ethers.utils.parseEther(amount),
    isTail
  );
  return { transaction };
}

function initializeGetter() {
  const provider = new ethers.providers.JsonRpcProvider(
    CHAIN["mumbai-testnet"].rpcUrl
  );

  const contract = new Contract(COIN_FLIP_CONTRACT, COIN_FLIP_ABI, provider);

  return {
    getMinBet: async function () {
      const data = await contract.minBet();
      return formatEther(data);
    },
    getMaxBet: async function () {
      const data = await contract.maxBet();
      return formatEther(data);
    },
    getPauseStatus: async function () {
      const data = await contract.pause();
      return data;
    },
  };
}

module.exports = {
  generateAccount,
  getBalance,
  formatBalance,
  formatEther,
  flipWrite,
  ...initializeGetter(),
};
