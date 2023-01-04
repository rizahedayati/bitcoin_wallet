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

export function getTokenAddress(token, network, wordCount) {
  //this part is additinal
  const language = constant.LANGUAGES.ENGLISH;
  const entropyLength = constant.ENTROPY_LENGTH.wordCount;
  const mnemonic = utils.generateMnemonic(language, entropyLength);
  let address;

  const coinNetwork = constant.COINS_NETWORKS[token];

  if (coinNetwork == undefined) {
    return "the coin dosnt exist";
  }

  if (!coinNetwork.includes(network)) {
    return `The ${token} dosnt have ${network} network in their list`;
  }

    const wallet = new Wallet(mnemonic, network);
    address = wallet.getNodeAddress();
   
  return address;
}

// async function main() {
//   console.log("createWallet", await createWallet(24));
//   // console.log("get token address", await getTokenAddress("MINA", "MINA", 24));
// }

// module.exports = {
//   getTokenAddress,
//   getTokenNetworkAddress,
//   createWallet
// };

// main();
