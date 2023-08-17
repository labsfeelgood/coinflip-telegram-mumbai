const CHAIN = {
  "mumbai-testnet": {
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    explorerUrl: "https://mumbai.polygonscan.com",
    name: "Polygon Mumbai Testnet",
    currency: "MATIC (Mumbai)",
    cbActionKey: "polygon-mumbai-testnet",
  },
};

const TOKEN_ABI = [
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount)",
  "function symbol() external view returns (string)",
  "function balanceOf(address account) external view returns (uint256)",
];

const COIN_FLIP_CONTRACT = "0x6EE8bBb9661235CE9d09F261B1D05f72C6795c83";

module.exports = {
  CHAIN,
  TOKEN_ABI,
  COIN_FLIP_CONTRACT,
};
