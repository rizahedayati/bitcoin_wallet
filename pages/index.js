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
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
const bip39 = require("bip39");
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

export default function Home(props) {
  const [address, setAddress] = useState("");
  const [to, setDestAddress] = useState("myNEhxvdfuBCzYKH7Nb3KBBsPHv14RYnMt");
  const [amount, setAmount] = useState(0);
  const [fee, setFee] = useState(0);
  const [currentTx, setCurrentTx] = useState("");
  const [error, setError] = useState("");

  async function generateWallet() {
    const language = constant.LANGUAGES.ENGLISH;
    const entropyLength = constant.ENTROPY_LENGTH.wordCount;
    const mnemonic = utils.generateMnemonic(language, entropyLength);

    let seed = bip39.mnemonicToSeedSync(mnemonic);
    let root = bip32.fromSeed(seed, bitcoin.networks.testnet);

    const masterNode = root.deriveHardened(44); // equiv to m/44'
    const xpub = masterNode.neutered().toBase58();
    const xprv = masterNode.toBase58();
    const node = bip32.fromBase58(xprv, bitcoin.networks.testnet);

    setAddress(
      bitcoin.payments.p2pkh({
        pubkey: node.publicKey,
        network: bitcoin.networks.testnet,
      }).address
    );

    // let key = {
    //   address: address,
    //   mnemonic: mnemonic,
    //   pubickey: node.publicKey.toString("hex"),
    //   privateKey: node.privateKey.toString("hex"),
    //   wif: node.toWIF(),
    // };

    // fs.writeFileSync('./key.txt', `${key}"`)
  }

  async function sendMoney() {
    const satoshiToSend = Math.floor(Number(amount) * 100000000);
    var key = ECPair.fromWIF(source.wif, bitcoin.networks.testnet);
    let price_per_byte;

    if (satoshiToSend == 0) {
      setError("The amount must not be zero");
    } else {
      const response = await axios.get(
        `https://api.blockcypher.com/v1/btc/test3/addrs/${source.address}?unspentOnly=true`
      );
      let result = response.data;

      if (result.unconfirmed_n_tx == 0 && result.txrefs) {
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
              setCurrentTx(response.data.tx.hash);
            })
            .catch(function (error) {
              setError(error.message);
            });
        } else {
          setError("incufficent fund");
        }
      } else {
        setError(
          "you have an unconfirmed transaction please try after 10 minutes"
        );
      }
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

            <TextField
              required
              onChange={(e) => setDestAddress(e.target.value)}
              id="to"
              label="to"
              value={to}
              style={{ width: "96%", marginBottom: "27px", marginTop: "10px" }}
              size="small"
            />

            <Grid container justifyContent="space-between">
              <Grid item xs={7}>
                <TextField
                  required
                  onChange={(e) => setAmount(e.target.value)}
                  id="amount"
                  label="amount"
                  value={amount}
                  style={{ width: "90%", marginBottom: "27px" }}
                  size="small"
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  required
                  onChange={(e) => setFee(e.target.value)}
                  id="fee"
                  label="fee"
                  value={fee}
                  style={{ width: "90%", marginBottom: "27px" }}
                  size="small"
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

            {error && (
              <Grid container>
                <Grid item xs={12}>
                  <Alert severity="error"> {error}</Alert>
                </Grid>
              </Grid>
            )}
            {currentTx && (
              <Grid container>
                <Grid item xs={12}>
                  <Alert severity="success">
                    <Grid container justifyContent="space-between">
                      <Grid item xs={10}>
                        Sending money is done successfully
                      </Grid>
                      <Grid item xs={10}>
                        <a
                          className={linkStyle}
                          href={`https://live.blockcypher.com/btc-testnet/tx/${currentTx}/`}
                          target="_blank"
                        >
                          {`${currentTx}`}
                        </a>
                      </Grid>
                    </Grid>
                  </Alert>
                </Grid>
              </Grid>
            )}
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
const linkStyle = css`
  color: blue;
  text-decoration: underline;
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
