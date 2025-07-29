import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // Load .env file

const HF_API_TOKEN = process.env.HF_API_TOKEN;

async function runBertInference() {
  const input = {
    inputs: {
      source_sentence:
        "I'm a full-stack software engineer with React and Node.js experience.",
      sentences: [
        "We are looking for a full-stack developer with experience in MERN stack.",
        "This job is for a content writer and social media expert.",
      ],
    },
  };

  const response = await axios.post(
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
    input,
    {
      headers: {
        Authorization: `Bearer ${HF_API_TOKEN}`,
      },
    }
  );

  console.log("Similarity Scores:", response.data);
}

runBertInference();
