const CHAIN = {
  ethereum: {
    rpcUrl: "https://eth.drpc.org",
    explorerUrl: "https://etherscan.io",
    name: "Ethereum",
    currency: "ETH",
    cbActionKey: "ethereum-chain",
  },
  polygon: {
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    name: "Polygon",
    currency: "MATIC",
    cbActionKey: "polygon-chain",
  },
  bsc: {
    rpcUrl: "https://bsc.meowrpc.com",
    explorerUrl: "https://bscscan.com",
    name: "BSC",
    currency: "BNB",
    cbActionKey: "bsc-chain",
  },
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

module.exports = {
  CHAIN,
  TOKEN_ABI,
};
