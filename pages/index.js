import { css } from "@emotion/css";
import { useState } from "react";
import axios from "axios";
import utils from "../wallet/utils";
import constant from "../wallet/constant";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
const bitcoin = require("bitcoinjs-lib");
const { ECPairFactory } = require("ecpair");
const bitcore = require("bitcore-lib");
import BasicTable from "./../components/table";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { source } from "../config";

const bip39 = require("bip39");
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

export default function Home(props) {
  const [address, setAddress] = useState("");
  const [to, setDestAddress] = useState("myNEhxvdfuBCzYKH7Nb3KBBsPHv14RYnMt");
  const [amount, setAmount] = useState();
  const [fee, setFee] = useState();

  async function generateWallet() {
    const language = constant.LANGUAGES.ENGLISH;
    const entropyLength = constant.ENTROPY_LENGTH.wordCount;
    const mnemonic = utils.generateMnemonic(language, entropyLength);

    let token = "BTC_TESTNET",
      network = "BTC_TESTNET";

    const coinNetwork = constant.COINS_NETWORKS[token];

    if (coinNetwork == undefined) {
      return "the coin dosnt exist";
    }

    if (!coinNetwork.includes(network)) {
      return `The ${token} dosnt have ${network} network in their list`;
    }

    let seed = bip39.mnemonicToSeedSync(mnemonic);

    let root = bip32.fromSeed(seed,bitcoin.networks.testnet);

    const masterNode = root.deriveHardened(44); // equiv to m/44'
    const xpub = masterNode.neutered().toBase58();
    const xprv = masterNode.toBase58();
    const node = bip32.fromBase58(xprv,bitcoin.networks.testnet);

    setAddress(
      bitcoin.payments.p2pkh({
        pubkey: node.publicKey,
        network:  bitcoin.networks.testnet,
      }).address
    );

  }

  async function sendMoney() {
    const satoshiToSend =  Math.floor(Number(amount) * 100000000);
    var key = ECPair.fromWIF(source.wif, bitcoin.networks.testnet);
    let price_per_byte;


    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/test3/addrs/${source.address}?unspentOnly=true&confirmations=6`
    );
    let result = response.data;
    let balance = result.balance;

    if (Number(fee) > 0) {
      price_per_byte = Number(fee);
    } else {
      const gasResult = await axios.get(
        `https://bitcoinfees.earn.com/api/v1/fees/recommended`
      );

      price_per_byte = gasResult.data.halfHourFee;
    }

    var tx = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
    let txs = result.txrefs;

    let totalFee = (txs.length * 148 + 2 * 34 + 10) * 2; //replace price_per_byte insted of 2

    if (balance - satoshiToSend - totalFee > 0 && txs) {
      txs.forEach(function (txn) {
        tx.addInput(txn.tx_hash, txn.tx_output_n);
      });

      tx.addOutput(to, satoshiToSend);
      tx.addOutput(source.address, balance - satoshiToSend - totalFee);

      let txn_no = txs.length;
      console.log(txn_no);
      while (txn_no > 0) {
        tx.sign(txn_no - 1, key);
        txn_no--;
      }
    
      let tx_hex = tx.build().toHex();

      axios
        .post("https://api.blockcypher.com/v1/btc/test3/txs/push", {
          tx: tx_hex,
        })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    } else {
      alert("incufficent fund");
    }
  }

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={5}>
          <div className={grayContainer}>
            <h2 className={title}>Create new wallet</h2>
            
            <Button
              onClick={generateWallet}
              variant="contained"
              style={{ marginTop: "10px", marginBottom: "20px" }}
            >
              Generate
            </Button>
         
            <p className={description}>{`wallet address : ${address}`}</p>
          </div>
        </Grid>
        <Grid item xs={7}>
          <div className={grayContainer}>
            <h2 className={title}>Send Money</h2>

            <input
              onChange={(e) => setDestAddress(e.target.value)}
              name="to"
              placeholder="to"
              value={to}
              className={inputStyle}
            />
            <Grid container>
              <Grid item xs={7}>
                <input
                  onChange={(e) => setAmount(e.target.value)}
                  name="amount"
                  placeholder="amount"
                  value={amount}
                  className={inputStyle}
                />
              </Grid>
              <Grid item xs={5}>
                <input
                  onChange={(e) => setFee(e.target.value)}
                  name="fee"
                  placeholder="fee"
                  value={fee}
                  className={inputStyle}
                />
              </Grid>
            </Grid>
            <Button
              onClick={sendMoney}
              variant="contained"
              style={{ marginTop: "10px", marginBottom: "20px" }}
            >
              Send
            </Button>

          
          </div>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={12}>
          <div className={grayContainer}>
            <BasicTable address={source.address} />
          </div>
        </Grid>
      </Grid>
    </>
  );
}

const grayContainer = css`
  background-color: #f5f5f5;
  padding: 25px;
  border-radius: 20px;
  margin: 40px;
`;
const description = css`
  margin: 0;
  color: #999999;
`;

const title = css`
  margin-left: 30px;
  font-weight: 500;
  margin: 0;
  margin-bottom: 10px;
`;

const buttonStyle = css`
  margin-top: 10px;
  margin-bottom: 10px;
  background-color: #fafafa;
  outline: none;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 18px;
  padding: 16px 70px;
  :hover {
    background-color: gray;
    color: white;
  }
`;

const inputStyle = css`
  width: 95%;
  padding: 12px 20px;
  margin: 10px 0;
  display: inline-block;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
`;
