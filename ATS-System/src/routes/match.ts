import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { matchResumeToJD, extractContactInfo } from "../services/openaiService";
import { parsePdfOrDoc } from "../utils/pdfParser"; // Handles PDF & DOCX

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const uniqueName = `${base}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Word files are allowed"));
    }
  },
});

router.post(
  "/match",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jd", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      const resumeFile = files?.["resume"]?.[0];
      const jdFile = files?.["jd"]?.[0];

      if (!resumeFile || !jdFile) {
        return res
          .status(400)
          .json({ error: "Both resume and JD files are required" });
      }

      const resumeText = await parsePdfOrDoc(resumeFile.path);
      const jdText = await parsePdfOrDoc(jdFile.path);

      const result = await matchResumeToJD(jdText, resumeText);
      return res.send(result);
    } catch (err: any) {
      console.error("Error parsing files:", err);
      return res
        .status(500)
        .send({ error: "Failed to parse or process documents", err });
    }
  }
);

router.post(
  "/match/multiple",
  upload.fields([
    { name: "resume", maxCount: 5 },
    { name: "jd", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const jdFile = files?.["jd"]?.[0];
      const resumeFiles = files?.["resume"];

      if (!jdFile || !resumeFiles || resumeFiles.length === 0) {
        return res
          .status(400)
          .json({ error: "Both resume(s) and JD file are required" });
      }

      const jdText = await parsePdfOrDoc(jdFile.path);

      const results = await Promise.all(
        resumeFiles.map(async (resume) => {
          try {
            const resumeText = await parsePdfOrDoc(resume.path);
            const match = await matchResumeToJD(jdText, resumeText);
            return {
              file: resume.originalname,
              result: match,
            };
          } catch (err) {
            return {
              file: resume.originalname,
              error: "Failed to parse or match resume",
            };
          }
        })
      );

      return res.json({ jd: jdFile.originalname, results });
    } catch (err: any) {
      console.error("Error parsing files:", err);
      return res
        .status(500)
        .json({ error: "Failed to process documents", details: err.message });
    }
  }
);

// New endpoint for matching with job description text
router.post(
  "/match/text",
  upload.single("resume"),
  async (req: Request, res: Response) => {
    try {
      const resumeFile = req.file;
      const { jobDescription } = req.body;

      if (!resumeFile || !jobDescription) {
        return res
          .status(400)
          .json({ error: "Both resume file and job description are required" });
      }

      const resumeText = await parsePdfOrDoc(resumeFile.path);
      const result = await matchResumeToJD(jobDescription, resumeText);
      
      return res.send(result);
    } catch (err: any) {
      console.error("Error processing resume with text JD:", err);
      return res
        .status(500)
        .send({ error: "Failed to process resume", details: err.message });
    }
  }
);

// New endpoint for bulk matching with job description text
router.post(
  "/match/text/bulk",
  upload.array("resumes", 10), // Allow up to 10 resumes
  async (req: Request, res: Response) => {
    try {
      const resumeFiles = req.files as Express.Multer.File[];
      const { jobDescription } = req.body;

      // Debug logging
      console.log("Received bulk request:", {
        filesCount: resumeFiles?.length || 0,
        hasJobDescription: !!jobDescription,
        jobDescriptionLength: jobDescription?.length || 0,
        bodyKeys: Object.keys(req.body)
      });

      if (!resumeFiles || resumeFiles.length === 0 || !jobDescription) {
        return res
          .status(400)
          .json({ error: "Both resume files and job description are required" });
      }

      const results = await Promise.all(
        resumeFiles.map(async (resume) => {
          try {
            const resumeText = await parsePdfOrDoc(resume.path);
            const match = await matchResumeToJD(jobDescription, resumeText);
            return {
              file: resume.originalname,
              result: match,
            };
          } catch (err) {
            return {
              file: resume.originalname,
              error: "Failed to parse or match resume",
            };
          }
        })
      );

      return res.json({
        jobDescription: jobDescription.substring(0, 100) + "...",
        results
      });
    } catch (err: any) {
      console.error("Error processing bulk resumes with text JD:", err);
      return res
        .status(500)
        .send({ error: "Failed to process resumes", details: err.message });
    }
  }
);

// New endpoint for extracting contact information from resume
router.post(
  "/extract-contact",
  upload.single("resume"),
  async (req: Request, res: Response) => {
    try {
      const resumeFile = req.file;

      if (!resumeFile) {
        return res
          .status(400)
          .json({ error: "Resume file is required" });
      }

      const resumeText = await parsePdfOrDoc(resumeFile.path);
      const contactInfo = await extractContactInfo(resumeText);

      return res.send(contactInfo);
    } catch (err: any) {
      console.error("Error extracting contact info:", err);
      return res
        .status(500)
        .send({ error: "Failed to extract contact information", details: err.message });
    }
  }
);

export default router;
