import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sendMail } from "./mailer";
import { authenticateFirebaseToken, ensureLoggedIn, db } from "./firebase";
import {
  generateAdminEmailTemplate,
  generateCustomerEmailTemplate,
  generateCustomerEmailTemplateWithAttachments,
} from "./emailTemplates";
import { AppUser, ContractFormData } from "./types";
import multer from "multer";
import { auth } from "firebase-admin";
const upload = multer();

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/ping", (req: Request, res: Response): any => {
  return res.status(200).json({ message: "pong" });
});

app.post("/sendEmail", async (req: Request, res: Response): Promise<any> => {
  const { contractData } = req.body;

  if (!contractData || !contractData.userId) {
    return res.status(400).json({ error: "Missing contract data or userId" });
  }

  try {
    // Fetch customer data
    const userSnap = await db
      .collection("users")
      .doc(contractData.userId)
      .get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userSnap.data() as AppUser;

    if (!user?.email) {
      return res.status(400).json({ error: "User has no email address" });
    }

    // Fetch admin users
    const adminSnap = await db
      .collection("users")
      .where("type", "==", "admin")
      .get();

    const platformUrl = process.env.PLATFROM_URL || "http://localhost:5173";
    const adminEmails = adminSnap.docs
      .map((doc) => doc.data())
      .filter((u) => u.email)
      .map((admin) => ({
        email: admin.email,
        html: generateAdminEmailTemplate(contractData, user, platformUrl),
      }));

    // Send to all admins
    await Promise.all(
      adminEmails.map(({ email, html }) =>
        sendMail({
          to: email,
          subject: "🚗 New Rental Contract Submitted",
          html,
        })
      )
    );

    // Send confirmation to customer
    const customerHtml = generateCustomerEmailTemplate(contractData, user);

    await sendMail({
      to: user.email,
      subject: "✅ Your Rental Contract Submission",
      html: customerHtml,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Email sending failed:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.post(
  "/sendEmailWithAttachment",
  authenticateFirebaseToken,
  ensureLoggedIn,
  upload.single("file"),
  async (req: Request, res: Response): Promise<any> => {
    const contractDataStr = req.body.contractData;
    const file = req.file;
    console.log("here");

    if (!contractDataStr || !file) {
      return res.status(400).json({ error: "Missing data or file" });
    }

    const contractData: ContractFormData = JSON.parse(contractDataStr);

    try {
      const userSnap = await db
        .collection("users")
        .doc(contractData.userId)
        .get();
      if (!userSnap.exists)
        return res.status(404).json({ error: "User not found" });

      const user = userSnap.data() as AppUser;

      const customerHtml = generateCustomerEmailTemplateWithAttachments(
        contractData,
        user
      );
      const response = await sendMail({
        to: user.email,
        subject: "✅ Your Rental Contract",
        html: customerHtml,
        attachments: [
          {
            filename: file.originalname,
            content: file.buffer,
          },
        ],
      });

      console.log(response);

      res.json({ success: true });
    } catch (err) {
      console.error("Email sending with attachment failed:", err);
      res.status(500).json({ error: "Failed to send email with attachment" });
    }
  }
);

app.delete(
  "/users/:uid",
  authenticateFirebaseToken, // must be logged-in Firebase user
  ensureLoggedIn, // we already use this
  async (req: Request, res: Response): Promise<any> => {
    try {
      /* ─────────────────────────────────────── */
      /* 1️⃣  Only admins may delete users      */
      /* ─────────────────────────────────────── */

      const uid = req.params.uid;
      if (!uid) return res.status(400).json({ error: "uid required" });

      if (auth) await auth().deleteUser(uid);

      return res.json({ success: true });
    } catch (err) {
      console.error("DELETE /users/:uid failed:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
