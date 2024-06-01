import express from "express";
import bodyParser from "body-parser";
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import pg from "pg";
var  email;
const app = express();
const port = 3000;
const CLIENT_ID = '31879257662-vp96b87bbhpm49vljj3nfg75bn5re5dl.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//045UI1lqVNAEgCgYIARAAGAQSNwF-L9IrD3KHC2nmm_4XxShrHKI131WkPvbpfvhVVimpGrYXEiRwz1l3AiSPK_fjAx_bdyvmnyg';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "123456",
  port: 5432,
});
db.connect();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", function(req, res){
  res.render("home.ejs");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", async function(req, res) {
    const fname=req.body["fname"];
    const lname=req.body["lname"];
    const username=req.body["email"];
    const pass=req.body["password"];
  
    try {
        await db.query(
          "INSERT INTO login (fname,lname,username,passwords) VALUES ($1, $2,$3,$4)",
          [fname,lname,username,pass]
        );
        console.log(pass);
        res.redirect("/");
      } catch (err) {
        console.log(err);
      }
  });
async function getCurrentUser(email) {
  
const result = await db.query("SELECT * FROM login");
// console.log(result);
const users = result.rows;
// console.log(users);
const abc=result.rows.find((user) => user.username == email);
// console.log("kjsadv  "+abc.username);
return abc;
}
app.post("/login", async (req, res)=>{

  
  email = req.body["email"];
  const password = req.body["password"];
  const cur= await getCurrentUser(email);
//   console.log("cyfu  "+cur.passwords);
console.log(email);
  const cur_pass=cur.passwords;
  if(cur_pass==password){
    res.render("sellbuy");
  }
  else{
    res.render("loginerror");
    // alert("incorrect email or password");
    console.log("Incorrect password or email");
  }

});
app.get("/seller",async (req,res)=>{
  res.render("seller.ejs");
});
app.post("/submit", async (req, res) => {
  const name = req.body["name"];
  const city = req.body["city"];
  const phone = req.body["pho"];
  const mail = req.body["mail"];
  


    try {
      await db.query(
        "INSERT INTO contact (owners,city,phone,mail_id) VALUES ($1, $2,$3,$4)",
        [name,city,phone,mail]
      );
      res.render("sellbuy.ejs");
    } catch (err) {
      console.log(err);
    }
  
});
async function getLikeCount(id) {
  const result = await db.query("SELECT * FROM contact where id=$1;",[id]);
  // console.log(id);
  const l = result.rows[0].likes;
  // console.log(l);
  return l;
  }
app.post("/form",async (req,res)=>{
  const id=req.body["id"];
  const like=await getLikeCount(id)+1;
  // console.log('ml;sa'+like);
  try {
    await db.query(
      "Update contact set likes=$1 where id=$2 ;",[like,id]
    );
    const result = await db.query("SELECT * FROM contact order by 1;");
    const users = result.rows;
    res.render("buyer.ejs", {contact:users});
  } catch (err) {
    console.log(err);
  }

});

async function sendMail(r_gmail,text) {
  try {
      const accessTokenResponse = await oauth2Client.getAccessToken();
      const accessToken = accessTokenResponse.token;
      console.log('Access Token:', accessToken);

      const transport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              type: 'OAuth2',
              user: 'moulidh7094@gmail.com',
              clientId: CLIENT_ID,
              clientSecret: CLIENT_SECRET,
              refreshToken: REFRESH_TOKEN,
              accessToken: accessToken,
          },
      });

      const mailOptions = {
          from: 'mouli <moulidh7094@gmail.com>',
          to: r_gmail,
          subject: "hello",
          text: text,
          html: text,
      };

      const result = await transport.sendMail(mailOptions);
      return result;
  } catch (error) {
      console.error('Error:', error);
      throw error;
  }
}
async function getGmail(id) {
  const result = await db.query("SELECT * FROM contact where id=$1;",[id]);
  // console.log(id);
  const l = result.rows[0].mail_id;
  // console.log(l);
  return l;
  }
app.post("/gmail",async(req,res)=>{
// console.log(email);
const gmail='moulidh7094@gmail.com';
const r_id=req.body["id"];
const text=req.body["text"];
const r_gmail=await getGmail(r_id);
// console.log(r_gmail);
sendMail(r_gmail,text)
    .then(result => {res.send("Message sent successfully"),console.log("Email sent:", result)})
    .catch(error => {res.send("Message not sent"),console.log('Error:', error.message)});
});
app.get("/buyer", async (req, res) => {
  const result = await db.query("SELECT * FROM contact order by 1");
  const users = result.rows;
  res.render("buyer.ejs", {contact:users});
});
app.get("/logout", function(req, res){
  res.render("home");
});

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
