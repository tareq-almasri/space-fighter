import express from "express";
import fs from "fs";

const app = express();

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static("public"));

app.get("/api/leaderboard", (req, res) => {
  const leaderboard = JSON.parse(fs.readFileSync("db.json", "utf8"));
  res.json(leaderboard);
});

function checkUsername(req, res, next) {
  const leaderboard = JSON.parse(fs.readFileSync("db.json", "utf8"));
  if (leaderboard.some((x) => x.username === req.params.username)) {
    res.status(409).json("❌ unavailable");
  } else {
    next();
  }
}

app.get("/api/signup/:username", checkUsername,(req,res)=>{
  res.json("✔️ available")
});

app.post("/api/signup/:username", checkUsername, (req, res) => {
  const { username, password, score } = req.body;
  const newUser = { id: Date.now(), username, password, score: score || 0 };
  const leaderboard = JSON.parse(fs.readFileSync("db.json", "utf8"));
  leaderboard.push(newUser);
  fs.writeFileSync("db.json", JSON.stringify(leaderboard), "utf8");
  res.json(newUser);
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const leaderboard = JSON.parse(fs.readFileSync("db.json", "utf8"));
  const user = leaderboard.find((x) => x.username === username);
  if (!user) {
    return res.json("user doesn't exist!");
  }
  user.password === password ? res.json(user) : res.json("incorrect password");
});

app.patch("/api/user", (req, res) => {
  const { username, score } = req.body;
  const leaderboard = JSON.parse(fs.readFileSync("db.json", "utf8"));
  const user = leaderboard.find((x) => x.username === username);
  if (!user) {
    return res.json("user doesn't exist!");
  }
  user.score = Math.max(user.score, score);
  const updatedLeaderboard = leaderboard.map((x) =>
    x.username === username ? user : x
  );
  fs.writeFileSync("db.json", JSON.stringify(updatedLeaderboard), "utf8");
  res.json(user);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`server is running on port ${port}`));
