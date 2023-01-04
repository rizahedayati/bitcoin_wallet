// const utils = require("./utils");
// const constant = require("./constant");
// const Wallet = require("./wallet");

import Wallet from "./wallet";
import constant from "./constant";
import utils from "./utils";

/**
 * @dev create a hd wallet based on bip32,bip44
 * @param wordCount count of words: 12,15,18,21,24
 */
// export async function createWallet(wordCount) {
//   const language = constant.LANGUAGES.ENGLISH;
//   const entropyLength = constant.ENTROPY_LENGTH.wordCount;
//   const mnemonic = utils.generateMnemonic(language, entropyLength);
//   const addresses = [];

//   await new Promise(function (resolve, reject) {
//     constant.NETWORK.forEach(async (network) => {
//       const wallet = new Wallet(mnemonic, network);
//       addresses.push(await wallet.getNodeAddress());
//       if (addresses.length == constant.NETWORK.length) {
//         resolve();
//       }
//     });
//   });

//   return {
//     mnemonic: mnemonic,
//     addresses: addresses,
//   };
// }

// export async function getTokenNetworkAddress(token, wordCount) {
//   //this part is additinal
//   const language = constant.LANGUAGES.ENGLISH;
//   const entropyLength = constant.ENTROPY_LENGTH.wordCount;
//   const mnemonic = utils.generateMnemonic(language, entropyLength);
//   const addresses = [];

//   const coinNetwork = constant.COINS_NETWORKS[token];

//   await new Promise(function (resolve, reject) {
//     coinNetwork.forEach(async (network) => {
//       const wallet = new Wallet(mnemonic, network);
//       addresses.push(await wallet.getNodeAddress());
//       if (addresses.length == coinNetwork.length) {
//         resolve();
//       }
//     });
//   });

//   return {
//     addresses: addresses,
//   };
// }

// export function getTokenAddress(token, network, wordCount) {
//   //this part is additinal
//   const language = constant.LANGUAGES.ENGLISH;
//   const entropyLength = constant.ENTROPY_LENGTH.wordCount;
//   const mnemonic = utils.generateMnemonic(language, entropyLength);
//   let address;

//   const coinNetwork = constant.COINS_NETWORKS[token];

//   if (coinNetwork == undefined) {
//     return "the coin dosnt exist";
//   }

//   if (!coinNetwork.includes(network)) {
//     return `The ${token} dosnt have ${network} network in their list`;
//   }

//     const wallet = new Wallet(mnemonic, network);
//     address = wallet.getNodeAddress();
   
//   return address;
// }

// // async function main() {
// //   console.log("createWallet", await createWallet(24));
// //   // console.log("get token address", await getTokenAddress("MINA", "MINA", 24));
// // }

// // module.exports = {
// //   getTokenAddress,
// //   getTokenNetworkAddress,
// //   createWallet
// // };

// // main();




// async function sendMoney2() {
//   var source = {
//     public:
//       "03bfcaa35239062f6862366df13e6399130403c8d7c6b4ccb1daf380d27327db01",
//     address: "n4U6v3mTRjj4vKoz95ff1faUepwbPgYn1n",
//     wif: "cVtgMrKG43udysMyHLpqsU7vbdpVtnbEwfvyhfdhut9RcvLXr7xS",
//     dest: to,
//     // public:
//     //   "030a64bbe24aa07eaa90f8cab19af32738fa9ea0d9b8402b1bf7100652fbf43b36",
//     // address: "mtVZr9RH7GxQ9qyvs7LDNPvGYcevtq9ejR",
//     // wif: "L4TtuLAfM1vwYa5E6Q7jwFjVGh9Xn5urQjgw65nskpTPrzLP3U6p",
//     // dest: to,
//   };
//   let btc_network = {
//     name: "bitcoin_testnet",
//     symbol: "BTC_TESTNET",
//     coinId: 1,
//     derivationPath: `m/44'/1'/0'/0/0`,
//     networkInfo: {
//       messagePrefix: "\x18Bitcoin Signed Message:\n",
//       bech32: "tb",
//       bip32: { public: 70617039, private: 70615956 },
//       pubKeyHash: 111,
//       scriptHash: 196,
//       wif: 239,
//     },
//   };
//   const response = await axios.get(
//     ` https://sochain.com/api/v2/get_tx_unspent/BTCTEST/${source.address}`
//   );
//   console.log("response", response);
//   // let privateKey ="148918ada40ba0415c4b6eb14981403f494dd40c17502f04213fd0175930eb43";
//   const satoshiToSend = amount * 100000000;
//   let fee = 0;
//   let inputCount = 0;
//   let outputCount = 2;

//   const transaction = new bitcore.Transaction();
//   let totalAmountAvailable = 0;

//   let inputs = [];
//   let utxos = response.data.data.txs;

//   for (const element of utxos) {
//     let utxo = {};
//     utxo.satoshis = Math.floor(Number(element.value) * 100000000); //value
//     utxo.script = element.script_hex; //tx_hash
//     utxo.address = response.data.data.address;
//     utxo.txId = element.txid;
//     utxo.outputIndex = element.output_no;
//     totalAmountAvailable += utxo.satoshis;
//     inputCount += 1;
//     inputs.push(utxo);
//   }

//   console.log("inputs", inputs);

//   let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
//   // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

//   fee = transactionSize * 20;

//   console.log(totalAmountAvailable, satoshiToSend, fee);
//   if (totalAmountAvailable - satoshiToSend - fee < 0) {
//     throw new Error("Balance is too low for this transaction");
//   }

//   //Set transaction input
//   transaction.from(inputs);

//   // set the recieving address and the amount to send
//   transaction.to(source.dest, satoshiToSend);

//   // Set change address - Address to receive the left over funds after transfer
//   transaction.change(source.address);

//   //manually set transaction fees: 20 satoshis per byte
//   transaction.fee(fee);

//   // Sign transaction with your private key
//   console.log(
//     "ECPair.fromWIF(source.wif, btc_network.networkInfo).privateKey",
//     ECPair.fromWIF(source.wif, btc_network.networkInfo).privateKey
//   );
//   transaction.sign(
//     ECPair.fromWIF(source.wif, btc_network.networkInfo).privateKey
//   );

//   // serialize Transactions
//   const serializedTX = transaction.serialize();
//   // Send transaction
//   const result = await axios({
//     method: "POST",
//     url: `https://sochain.com/api/v2/send_tx/BTCTEST`,
//     data: {
//       tx_hex: serializedTX,
//     },
//   });
//   return result.data.data;
// }
