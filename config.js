const CHAIN = {
  rpcUrl: "https://rpc-mumbai.maticvigil.com",
  explorerUrl: "https://mumbai.polygonscan.com",
  name: "Polygon Mumbai Testnet",
  currency: "MATIC",
  cbActionKey: "polygon-mumbai-testnet",
};

const TOKEN_ABI = [
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount)",
  "function symbol() external view returns (string)",
  "function balanceOf(address account) external view returns (uint256)",
];

module.exports = {
  CHAIN,
  TOKEN_ABI,
};
