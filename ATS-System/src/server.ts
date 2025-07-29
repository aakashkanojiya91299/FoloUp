import express from "express";
import dotenv from "dotenv";
import matchRoutes from "./routes/match";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "ATS Server is running" });
});

app.use("/api", matchRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
