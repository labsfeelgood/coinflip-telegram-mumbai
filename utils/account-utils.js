const { Wallet, ethers } = require("ethers");
const { encrypt, decrypt } = require("./encryption-utils");
const { CHAIN, TOKEN_ABI } = require("../config");

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

async function sendToken(amount, to, privateKey) {
  const provider = new ethers.providers.JsonRpcProvider(CHAIN.rpcUrl);
  const wallet = new ethers.Wallet(decrypt(privateKey), provider);

  const tx = {
    to,
    value: ethers.utils.parseEther(amount.toString()),
  };
  const transaction = await wallet.sendTransaction(tx);

  const receipt = await transaction.wait();
  return { transaction, receipt };
}

async function sendERC20Token(tokenAddress, amount, to, privateKey) {
  const provider = new ethers.providers.JsonRpcProvider(CHAIN.rpcUrl);
  const wallet = new ethers.Wallet(decrypt(privateKey), provider);
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);

  const tokenDecimals = await tokenContract.decimals();
  const amountToSend = ethers.utils.parseUnits(amount, tokenDecimals);

  const transaction = await tokenContract.transfer(to, amountToSend);
  const receipt = await transaction.wait();
  return { transaction, receipt };
}

async function getERC20TokenSymbol(tokenAddress) {
  const provider = new ethers.providers.JsonRpcProvider(CHAIN.rpcUrl);
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  return await tokenContract.symbol();
}

async function getERC20TokenBalanceOf(tokenAddress, address) {
  const provider = new ethers.providers.JsonRpcProvider(CHAIN.rpcUrl);
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);

  const balance = await tokenContract.balanceOf(address);
  const tokenDecimals = await tokenContract.decimals();

  return formatBalance(ethers.utils.formatUnits(balance, tokenDecimals));
}

module.exports = {
  generateAccount,
  getBalance,
  formatBalance,
  formatEther,
  sendToken,
  sendERC20Token,
  getERC20TokenSymbol,
  getERC20TokenBalanceOf,
};
