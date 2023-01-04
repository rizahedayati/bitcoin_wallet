import { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import axios from "axios";
import { css } from "@emotion/css";

import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData("Frozen yoghurt", 159, 6.0, 24, 4.0),
  createData("Ice cream sandwich", 237, 9.0, 37, 4.3),
  createData("Eclair", 262, 16.0, 24, 6.0),
  createData("Cupcake", 305, 3.7, 67, 4.3),
  createData("Gingerbread", 356, 16.0, 49, 3.9),
];

export default function BasicTable(props) {
  const [transactionList, setTransactionList] = useState({});
  const [txs, setTxs] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(async () => {

    axios.get(
        `https://api.blockcypher.com/v1/btc/test3/addrs/${props.address}/full?limit=50`
      )
      .then(function(result) {
        setTransactionList(result.data);
        setTxs(result.data.txs);
        setBalance(result.data.balance);
      })
      .catch(function(error) {
        console.log(error);
      });
    // const result = await axios(
    //   `https://api.blockcypher.com/v1/btc/test3/addrs/${props.address}/full?limit=50`
    // );

    // if (result) {
    //   setTransactionList(result.data);
    //   setTxs(result.data.txs);
    //   setBalance(result.data.balance);
    // }
  });

  return (
    <>
      <h2 className={description}>{`total Balance : ${
        transactionList && Number(balance) / 100000000
      }`}</h2>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>tx id</TableCell>
              <TableCell>status</TableCell>
              <TableCell>date</TableCell>
              <TableCell>from</TableCell>
              <TableCell>amount</TableCell>
              <TableCell>utl</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {txs.length != 0 &&
              txs.map((row, i) => (
                <TableRow
                  key={i}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.hash}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {row.confirmations >= 6
                      ? `confirmed(${row.confirmations})`
                      : `pending(${row.confirmations})`}
                  </TableCell>
                  <TableCell>{row.received}</TableCell>
                  <TableCell>{transactionList.address}</TableCell>
                  <TableCell>{Number(row.total) / 100000000}</TableCell>
                  <TableCell>
                    <a
                      className={linkStyle}
                      href={`https://live.blockcypher.com/btc-testnet/tx/${row.hash}/`}
                      target="_blank"
                    >
                      view on explorer
                    </a>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

const description = css`
  margin: 20px;
  color: #999999;
`;

const linkStyle = css`
  color: blue;
  text-decoration: underline;
`;
