/***************************************
 * 1. Define your contract details
 ***************************************/
// Deployed contract address on Sepolia
const CONTRACT_ADDRESS = "0x3ADcf820588509CD1D9c5B00d7A87cFbDD549422";

// Contract ABI
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "NotEnoughMoney",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransactionFailed",
    "type": "error"
  },
  {
    "stateMutability": "payable",
    "type": "fallback"
  },
  {
    "inputs": [],
    "name": "MINIMUM_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "funder",
        "type": "address"
      }
    ],
    "name": "addressToAmountFunded",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountFunded",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fund",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "funders",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "i_owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

// Global variables for provider, signer, and contract
let provider;
let signer;
let contract;

// Grab our HTML elements
const statusEl = document.getElementById("status");
const connectButton = document.getElementById("connectButton");

const fundSection = document.getElementById("fundSection");
const fundButton = document.getElementById("fundButton");
const amountToFund = document.getElementById("amountToFund");
const ownerAddressEl = document.getElementById("ownerAddress");

const withdrawSection = document.getElementById("withdrawSection");
const withdrawButton = document.getElementById("withdrawButton");
const contractBalanceEl = document.getElementById("contractBalance");

/************************************************
 * Connect the user's wallet & setup contract
 ***********************************************/
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Please install or enable it to continue.");
    return;
  }

  try {
    // Request account access from MetaMask
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Initialize ethers provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    // Get user address
    const userAddress = await signer.getAddress();
    console.log("Connected address:", userAddress);
    statusEl.innerText = "Connected: " + userAddress;

    // Instantiate the contract
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Show main sections (fund & withdraw)
    fundSection.style.display = "block";
    withdrawSection.style.display = "block";

    // Fetch and display contract owner
    const cOwner = await contract.i_owner();
    ownerAddressEl.innerText = cOwner;

    // Update contract balance
    await updateContractBalance();

  } catch (error) {
    console.error(error);
    statusEl.innerText = "Error connecting wallet";
  }
}

/************************************************
 * Fund the contract (calls fund())
 ***********************************************/
async function fundContract() {
  const valueInEth = amountToFund.value.trim();
  if (!valueInEth || isNaN(valueInEth) || Number(valueInEth) <= 0) {
    alert("Please enter a valid amount of ETH");
    return;
  }

  try {
    // Convert ETH to Wei
    const valueInWei = ethers.utils.parseEther(valueInEth);
    // Send transaction to fund()
    const txResponse = await contract.fund({ value: valueInWei });
    // Wait for tx to confirm
    const receipt = await txResponse.wait();

    alert(`Successfully funded! TX Hash: ${receipt.transactionHash}`);
    amountToFund.value = "";

    // Update balance after funding
    await updateContractBalance();
  } catch (err) {
    console.error(err);
    alert("Funding failed: " + (err.message || "Unknown error"));
  }
}

/************************************************
 * Withdraw funds (calls withdraw())
 ***********************************************/
async function withdrawFunds() {
  try {
    const txResponse = await contract.withdraw();
    const receipt = await txResponse.wait();
    alert(`Withdraw successful! TX Hash: ${receipt.transactionHash}`);

    // Update balance after withdrawal
    await updateContractBalance();
  } catch (err) {
    console.error(err);
    alert("Withdraw failed: " + (err.message || "Unknown error"));
  }
}

/************************************************
 * Update contract balance
 ***********************************************/
async function updateContractBalance() {
  const balanceWei = await provider.getBalance(CONTRACT_ADDRESS);
  const balanceEth = ethers.utils.formatEther(balanceWei);
  // Show up to 4 decimal places
  contractBalanceEl.textContent = parseFloat(balanceEth).toFixed(4);
}

/************************************************
 * Add event listeners
 ***********************************************/
connectButton.addEventListener("click", connectWallet);
fundButton.addEventListener("click", fundContract);
withdrawButton.addEventListener("click", withdrawFunds);
