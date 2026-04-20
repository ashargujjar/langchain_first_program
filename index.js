import express from "express";
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
import { createAgent, HumanMessage, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { string } from "zod/v4";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Practice server is running",
  });
});
const calculateMarks = tool(
  ({ num }) => {
    console.log("🔥 Tool called: Check_grade_status");

    if (typeof num !== "number") {
      return "Please provide a valid number only";
    }
    if (num <= 50) {
      return "Grade C - Fail";
    } else if (num <= 75) {
      return "Grade B - Pass";
    } else {
      return "Grade A - Pass";
    }
  },
  {
    name: "Check_grade_status",
    description: "returns the grade and tells if pass or fail",
    schema: z.object({
      num: z.number().describe("Marks obtained by student"),
    }),
  },
);
const dropStudent = tool(
  ({ name }) => {
    console.log("🔥 Tool called: drop_student");

    return `${name} is dropped from the course`;
  },
  {
    name: "drop_student",
    description: "Drops a failed student from the course",
    schema: z.object({
      name: z.string(),
    }),
  },
);
const openAi = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
});
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const agent = await createAgent({
    model: openAi,
    systemPrompt:
      "You are a evaluation checker you role to tell that are students failed or passed with one sentence. if student is fail then drop that student ",
    tools: [calculateMarks, dropStudent],
  });
  const hummanMessage = new HumanMessage(message);

  const result = await agent.invoke({ messages: [hummanMessage] });

  return res.send({
    messages: result.messages.at(-1).content,
    full_result: result,
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
