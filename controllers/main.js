const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function readfile() {
  return fs.readFileSync(path.resolve("credentials.json"));
}

async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

async function listRecords(date) {
  const formattedDate = date.replace(/-/g, "/");

  const credentials = JSON.parse(readfile());
  const authClient = await authorize(credentials);
  const sheets = google.sheets({ version: "v4" });

  const request = {
    spreadsheetId: "1XaVChakZwUlv-ReKIVzpA2j0PRqmFA1qEGUeHerXJ0s",
    range: [formattedDate],
    majorDimension: "ROWS",
    auth: authClient,
  };

  try {
    const response = (await sheets.spreadsheets.values.get(request)).data;

    return response;
  } catch (error) {
    console.error(error);
  }
}

exports.listData = async (req, res) => {
  const { date } = req.params;
  const response = await listRecords(date);

  const filteredSpreadsheetData = response.values
    .slice(1)
    .filter((data) => data.length !== 0);

  const newSpreadsheetData = filteredSpreadsheetData.map((data, ind) => {
    const vendor = data[0];
    const type = data[1];
    const state = data[2];
    const city = data[3];
    const grade = data[4];
    const size = data[5];
    const price = data[6];
    const quantity = data[7];

    const obj = {
      vendor,
      type,
      state,
      city,
      grade,
      size,
      price,
      quantity,
    };

    return obj;
  });

  return res.status(200).json({
    status: 200,
    data: [...newSpreadsheetData],
  });
};

exports.findByLocationAndSize = async (req, res) => {
  const {date, location, size, sType } = req.params;

  if (!date || !location || !size || !sType) {
    return res.status(400).json({
      status: 400
    })
  }

  const response = await listRecords(date);

  const filteredSpreadsheetData = response.values
    .slice(1)
    .filter(
      (data) =>
        data.length !== 0 &&
        data[3].toString() === location.toString() &&
        data[6].toString() === sType.toString() &&
        parseFloat(data[5]) >= parseFloat(size)
    )
    .sort((a, b) => {
      const priceA = a[7];
      const priceB = b[7];

      if (!priceA || !priceB) {
        return -1;
      }

      return (
        parseFloat(priceA.slice(1).replace(/[,]/g, "")) -
        parseFloat(priceB.slice(1).replace(/[,]/g, ""))
      );
    });

  const newSpreadsheetData = filteredSpreadsheetData.map((data) => {
       const vendor = data[0];
       const type = data[1];
       const state = data[2];
       const city = data[3];
       const grade = data[4];
       const size = data[5];
       const sType = data[6];
       const price = data[7];
       const quantity = data[8];

    const obj = {
      vendor,
      type,
      state,
      city,
      grade,
      size,
      sType,
      price,
      quantity,
    };

    return obj;
  });

  return res.status(200).json({
    status: 200,
    data: [...newSpreadsheetData],
  });
};

exports.findByVendorAndLocation = async (req, res) => {
  const { date, vendor, location, sType } = req.params;

  const response = await listRecords(date);

  const filteredSpreadsheetData = response.values
    .slice(1)
    .filter(
      (data) =>
        data.length !== 0 &&
        data[0].toLowerCase() === vendor.toLowerCase() &&
        data[6].toLowerCase() === sType.toLowerCase() &&
        data[3].toLowerCase() === location.toLowerCase()
    )
    .sort((a, b) => {
      const priceA = a[7];
      const priceB = b[7];

      if (!priceA || !priceB) {
        return -1;
      }

      return (
        parseFloat(priceA.slice(1).replace(/[,]/g, "")) -
        parseFloat(priceB.slice(1).replace(/[,]/g, ""))
      );
    });

  const newSpreadsheetData = filteredSpreadsheetData.map((data) => {
    const vendor = data[0];
    const type = data[1];
    const state = data[2];
    const city = data[3];
    const grade = data[4];
    const size = data[5];
    const sType = data[6];
    const price = data[7];
    const quantity = data[8];

    const obj = {
      vendor,
      type,
      state,
      city,
      grade,
      size,
      sType,
      price,
      quantity,
    };

    return obj;
  });

  return res.status(200).json({
    status: 200,
    data: [...newSpreadsheetData],
  });
};
