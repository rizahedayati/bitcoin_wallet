// const BIP32Factory = require("bip32");
// const ecc = require("tiny-secp256k1");
// const bip39 = require("bip39");
// const bitcoin = require("bitcoinjs-lib");
// var WAValidator = require("multicoin-address-validator");
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// import BIP32Factory from "bip32";
// import * as ecc from "tiny-secp256k1";
// // console.log(ecc);
import {bip39} from "bip39";

const BIP32Factory = require("bip32");
const ecc = require("tiny-secp256k1");
// const bip39 = require("bip39");
const bitcoin = require("bitcoinjs-lib");
// import bitcoin from "bitcoinjs-lib";

// const constant = require("./constant");
// const coinInfo = require("./coinInfo");
// const getAddress = require("./addresses");

import constant from "./constant";
import coinInfo from "./coinInfo";
import {getAddress} from "./addresses";


export default class Wallet {
  constructor(mnemonic, coin) {
    this.bip32 = BIP32Factory.default(ecc);
    this.mnemonic = mnemonic;
    this.purpose = constant.PURPOSE.BIP44;
    this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
    this.root = this.bip32.fromSeed(this.seed);

    this.coinInfo = coinInfo(coin);
    this.coinId = this.coinInfo.coinId;
    this.derivationPath = this.coinInfo.derivationPath;

    // get master and coinId node once initialized
    this.masterNode = this.getMasterNode();
  }

  getMasterNode = () => {
    const masterNode = this.root.deriveHardened(this.purpose); // equiv to m/44'
    const xpub = masterNode.neutered().toBase58();
    const xprv = masterNode.toBase58();

    return {
      masterNode,
      xpub: xpub,
      xpriv: xprv,
      derivationPath: `m/${this.purpose}'`,
    };
  };

  getNodeAddress =  () => {
    const node = this.root.derivePath(this.derivationPath);
    const symbol = this.coinInfo.symbol;
    const networkInfo = this.coinInfo.networkInfo
      ? this.coinInfo.networkInfo
      : {};
    const address = getAddress(
      symbol,
      node,
      this.seed,
      this.mnemonic,
      networkInfo
    );

    // const valid = WAValidator.validate(
    //   address,
    //   symbol == "BSC" ? "ETH" : symbol
    // );

    return {
      name: symbol,
      address: address,
      publicKey: keyPair.publicKey.toString("hex"),
      node
      // isValidAddress: valid,
    };
  };

  getNetworkAddresses = () => {};
}

// export {Wallet};
