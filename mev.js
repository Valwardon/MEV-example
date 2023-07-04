const Web3 = require('web3');
const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.INFURA_WEBSOCKET_URL)); // Initialize web3 with WebSocket provider

const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // Uniswap Router address
const uniswapRouterABI = require('./uniswap_router_abi.json');
const uniswapRouterContract = new web3.eth.Contract(uniswapRouterABI, uniswapRouterAddress);

const privateKey = process.env.PRIVATE_KEY; // Private key for signing transactions
const maxGasCost = 1e18; // Maximum gas cost you are willing to pay

const gasPriceGwei = 10; // Set your desired gas price in Gwei

const estimateGasPrice = async () => {
  const gasPrice = await web3.eth.getGasPrice();
  return gasPrice;
};

const estimateGasCost = async (transaction) => {
  const gasEstimate = await transaction.estimateGas();
  const gasCost = gasEstimate * (await estimateGasPrice());
  return gasCost;
};

const executeArbitrageTrade = async (transaction) => {
  const gasCost = await estimateGasCost(transaction);

  // Check if the gas cost is profitable based on your criteria
  if (gasCost < maxGasCost) {
    const signedTx = await web3.eth.accounts.signTransaction(transaction, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Trade executed. Transaction Hash:', receipt.transactionHash);
  } else {
    console.log('Gas cost is too high. Skipping trade.');
  }
};

const tokenIn = '0x...'; // Address of the token you want to swap from
const tokenOut = '0x...'; // Address of the token you want to swap to
const amountIn = web3.utils.toWei('1'); // Amount of tokenIn to swap
const recipientAddress = '0x...'; // Address to receive the swapped tokens

const transaction = uniswapRouterContract.methods.swapExactTokensForTokens(
  amountIn,
  0, // Minimum amount of tokenOut you want to receive
  [tokenIn, tokenOut], // Path of tokens to swap
  recipientAddress, // Address to receive the swapped tokens
  Math.floor(Date.now() / 1000) + 300 // Deadline for the trade (5 minutes from now)
);

executeArbitrageTrade(transaction);

// Define the routes
app.get('/', async (req, res) => {
  try {
    const gasCost = await estimateGasCost(transaction);
    const gasPrice = await estimateGasPrice();
    const totalGasCost = gasCost + (gasPrice * transaction.encodeABI().length / 2);

    // Calculate potential profit
    const tokenInBalance = await getTokenBalance(tokenIn, recipientAddress);
    const tokenOutBalance = await getTokenBalance(tokenOut, recipientAddress);
    const tokenInAmount = web3.utils.fromWei(tokenInBalance);
    const tokenOutAmount = web3.utils.fromWei(tokenOutBalance);
    const currentPrice = tokenOutAmount / tokenInAmount;
    const expectedProfit = tokenOutAmount - tokenInAmount;
    const expectedProfitAfterFees = expectedProfit - web3.utils.fromWei(total
