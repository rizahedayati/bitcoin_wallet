import { css } from "@emotion/css";
import { useContext, useState } from "react";
import { AccountContext } from "../context";
import axios from "axios";
import { getTokenAddress } from "../wallet";
import utils from "../wallet/utils";
import constant from "../wallet/constant";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import { coinInfo } from "../wallet/coinInfo";
const bitcoin = require("bitcoinjs-lib");
const { ECPairFactory } = require("ecpair");
const bitcore = require("bitcore-lib");
import BasicTable from "./../components/table";
import Grid from "@mui/material/Grid";
import Button from '@mui/material/Button';

// var Insight = require('bitcore-explorers').Insight;
// var insight = new Insight('testnet');
// console.log(ecc);
const bip39 = require("bip39");
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);
var source = {
  public:
    "03457cf0ffeb716f149143b1d24e74c43676cc69c55929fa79e01f066f6bf6cab1",
  address: "muTvhGgVnp5fR4wiStT3QacNwGEzESUwnc",
  wif: "cNGcv3UzGDXePENxCYvpQfNAbdX1mEWMQEnoMTTkdJWd8KTDh1db",
};
export default function Home(props) {
  const [address, setAddress] = useState("");
  const [to, setDestAddress] = useState("myNEhxvdfuBCzYKH7Nb3KBBsPHv14RYnMt");
  const [amount, setAmount] = useState();
  const [fee, setFee] = useState();
  
  async function generateWallet() {
    //   console.log("fdhfd");
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

    let root = bip32.fromSeed(seed);

    let btc_network = {
      name: "bitcoin_testnet",
      symbol: "BTC_TESTNET",
      coinId: 1,
      derivationPath: `m/44'/1'/0'/0/0`,
      networkInfo: {
        messagePrefix: "\x18Bitcoin Signed Message:\n",
        bech32: "tb",
        bip32: { public: 70617039, private: 70615956 },
        pubKeyHash: 111,
        scriptHash: 196,
        wif: 239,
      },
    };

    let node = root.derivePath(btc_network.derivationPath);
    setAddress(
      bitcoin.payments.p2pkh({
        pubkey: node.publicKey,
        network: btc_network.networkInfo,
      }).address
    );

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

  async function sendMoney2() {
    var source = {
      public:
        "03457cf0ffeb716f149143b1d24e74c43676cc69c55929fa79e01f066f6bf6cab1",
      address: "muTvhGgVnp5fR4wiStT3QacNwGEzESUwnc",
      wif: "cNGcv3UzGDXePENxCYvpQfNAbdX1mEWMQEnoMTTkdJWd8KTDh1db",
      dest: to,
    };
    let btc_network = {
      name: "bitcoin_testnet",
      symbol: "BTC_TESTNET",
      coinId: 1,
      derivationPath: `m/44'/1'/0'/0/0`,
      networkInfo: {
        messagePrefix: "\x18Bitcoin Signed Message:\n",
        bech32: "tb",
        bip32: { public: 70617039, private: 70615956 },
        pubKeyHash: 111,
        scriptHash: 196,
        wif: 239,
      },
    };
    const response = await axios.get(
      ` https://sochain.com/api/v2/get_tx_unspent/BTCTEST/${source.address}`
    );
    console.log("response", response);
    // let privateKey ="148918ada40ba0415c4b6eb14981403f494dd40c17502f04213fd0175930eb43";
    const satoshiToSend = amount * 100000000;
    let fee = 0;
    let inputCount = 0;
    let outputCount = 2;

    const transaction = new bitcore.Transaction();
    let totalAmountAvailable = 0;

    let inputs = [];
    let utxos = response.data.data.txs;

    for (const element of utxos) {
      let utxo = {};
      utxo.satoshis = Math.floor(Number(element.value) * 100000000); //value
      utxo.script = element.script_hex; //tx_hash
      utxo.address = response.data.data.address;
      utxo.txId = element.txid;
      utxo.outputIndex = element.output_no;
      totalAmountAvailable += utxo.satoshis;
      inputCount += 1;
      inputs.push(utxo);
    }

    console.log("inputs", inputs);

    let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
    // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

    fee = transactionSize * 20;

    console.log(totalAmountAvailable, satoshiToSend, fee);
    if (totalAmountAvailable - satoshiToSend - fee < 0) {
      throw new Error("Balance is too low for this transaction");
    }

    //Set transaction input
    transaction.from(inputs);

    // set the recieving address and the amount to send
    transaction.to(source.dest, satoshiToSend);

    // Set change address - Address to receive the left over funds after transfer
    transaction.change(source.address);

    //manually set transaction fees: 20 satoshis per byte
    transaction.fee(fee);

    // Sign transaction with your private key
    console.log(
      "ECPair.fromWIF(source.wif, btc_network.networkInfo).privateKey",
      ECPair.fromWIF(source.wif, btc_network.networkInfo).privateKey
    );
    transaction.sign(
      ECPair.fromWIF(source.wif, btc_network.networkInfo).privateKey
    );

    // serialize Transactions
    const serializedTX = transaction.serialize();
    // Send transaction
    const result = await axios({
      method: "POST",
      url: `https://sochain.com/api/v2/send_tx/BTCTEST`,
      data: {
        tx_hex: serializedTX,
      },
    });
    return result.data.data;
  }

  async function sendMoney() {
    console.log(amount, to, fee);
    // send transaction

    var source = {
      public:
        "03457cf0ffeb716f149143b1d24e74c43676cc69c55929fa79e01f066f6bf6cab1",
      address: "muTvhGgVnp5fR4wiStT3QacNwGEzESUwnc",
      wif: "cNGcv3UzGDXePENxCYvpQfNAbdX1mEWMQEnoMTTkdJWd8KTDh1db",
      dest: to,
    };
    let btc_network = {
      name: "bitcoin_testnet",
      symbol: "BTC_TESTNET",
      coinId: 1,
      derivationPath: `m/44'/1'/0'/0/0`,
      networkInfo: {
        messagePrefix: "\x18Bitcoin Signed Message:\n",
        bech32: "tb",
        bip32: { public: 70617039, private: 70615956 },
        pubKeyHash: 111,
        scriptHash: 196,
        wif: 239,
      },
    };
    const satoshiToSend = Number(amount);

    var key = ECPair.fromWIF(source.wif, btc_network.networkInfo);

    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/test3/addrs/${source.address}?unspentOnly=true&confirmations=6`
    );

    console.log("response", response);

    let price_per_byte;

    if (Number(fee) > 0) {
      price_per_byte = Number(fee);
    } else {
      const gasResult = await axios.get(
        `https://bitcoinfees.earn.com/api/v1/fees/recommended`
      );

      price_per_byte = gasResult.data.halfHourFee;
    }

    let result = response.data;
    console.log(result, "result");
    let balance = result.balance;

    var tx = new bitcoin.TransactionBuilder(btc_network.networkInfo);
    console.log(tx,"tx");
    let txs = result.txrefs;

    let totalFee = (txs.length * 148 + 2 * 34 + 10) * price_per_byte; //1 is the no of outputs
    console.log("totalFee",totalFee);

    if (balance - satoshiToSend-totalFee > 0 && txs) {
      txs.forEach(function (txn) {
        tx.addInput(txn.tx_hash, txn.tx_output_n);
      });

      tx.addOutput(source.dest, satoshiToSend);
      tx.addOutput(source.address, balance - satoshiToSend-totalFee);

      let txn_no = txs.length;
      console.log(txn_no);
      while (txn_no > 0) {
        tx.sign(txn_no - 1, key);
        txn_no--;
      }
      // tx.__TX.confirmations = 6;
      // tx.__TX.double_spend = true;
      tx.__TX.change_address = source.address;
      console.log("tx",tx);

      let tx_hex = tx.build().toHex();

      console.log("tx_hex",tx_hex);

      axios
        .post("https://api.blockcypher.com/v1/btc/test3/txs/push", {
          tx: tx_hex
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
            <Button onClick={generateWallet} variant="contained" style={{marginTop:"10px",marginBottom:"20px"}}>Generate</Button>
            {/* <button
              className={buttonStyle}
              type="button"
              onClick={generateWallet}
            >
              Generate
            </button> */}

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
            <Button onClick={sendMoney} variant="contained" style={{marginTop:"10px",marginBottom:"20px"}}>Send</Button>

            {/* <button className={buttonStyle} type="button" onClick={sendMoney2}>
              Send
            </button> */}
          </div>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={12}>
          <div className={grayContainer}>
            <BasicTable address={source.address}/>
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

const container = css`
  display: flex;
  justify-content: center;
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
