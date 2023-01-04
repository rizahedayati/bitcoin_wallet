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

    // let btc_network = {
    //   name: "bitcoin_testnet",
    //   symbol: "BTC_TESTNET",
    //   coinId: 1,
    //   derivationPath: `m/44'/1'/0'/0/0`,
    //   networkInfo: {
    //     messagePrefix: "\x18Bitcoin Signed Message:\n",
    //     bech32: "tb",
    //     bip32: { public: 70617039, private: 70615956 },
    //     pubKeyHash: 111,
    //     scriptHash: 196,
    //     wif: 239,
    //   },
    // };

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

    console.log("node.toWIF()",node.toWIF());


    // var addressFake = {
    //   public:
    //     node.publicKey.toString("hex"),
    //   address: bitcoin.payments.p2pkh({
    //     pubkey: node.publicKey,
    //     network: btc_network.networkInfo,
    //   }).address,
    //   wif: node.toWIF(),
    //   dest: to,
    // };

    // console.log(addressFake);
  }

  async function sendMoney() {
   
   
    const satoshiToSend = Number(amount);
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

    console.log("price_per_byte",price_per_byte);

   

    var tx = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
    console.log(tx, "tx");
    let txs = result.txrefs;
    console.log(txs);

    let totalFee = (txs.length * 148 + 2 * 34 + 10) * 2; //1 is the no of outputs
    console.log("totalFee", totalFee);

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
      // tx.__TX.confirmations = 6;
      // tx.__TX.double_spend = true;
      tx.__TX.change_address = source.address;
      console.log("tx", tx);

      let tx_hex = tx.build().toHex();

      console.log("tx_hex", tx_hex);

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
            <p className={description}>
              click the genrate button and get some testnet fauset
            </p>
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
