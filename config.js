const CHAIN = {
  "mumbai-testnet": {
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    explorerUrl: "https://mumbai.polygonscan.com",
    name: "Polygon Mumbai Testnet",
    currency: "MATIC (Mumbai)",
    cbActionKey: "polygon-mumbai-testnet",
  },
};

const BOT_NAME = "PsychoBot";
const COIN_FLIP_ABI = [
  "function flip(uint256 userBet, bool isTail)",
  "function pause() external view returns (bool)",
  "function minBet() external view returns (uint256)",
  "function maxBet() external view returns (uint256)",
];
const COIN_FLIP_CONTRACT = "0x88cd98c7428b0238237291f66D002eee180fC09a";

module.exports = {
  BOT_NAME,
  CHAIN,
  COIN_FLIP_ABI,
  COIN_FLIP_CONTRACT,
};
