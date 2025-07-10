"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mailer_1 = require("./mailer");
const firebase_1 = require("./firebase");
const emailTemplates_1 = require("./emailTemplates");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)();
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/ping", (req, res) => {
    return res.status(200).json({ message: "pong" });
});
app.post("/sendEmail", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { contractData } = req.body;
    if (!contractData || !contractData.userId) {
        return res.status(400).json({ error: "Missing contract data or userId" });
    }
    try {
        // Fetch customer data
        const userSnap = yield firebase_1.db
            .collection("users")
            .doc(contractData.userId)
            .get();
        if (!userSnap.exists) {
            return res.status(404).json({ error: "User not found" });
        }
        const user = userSnap.data();
        if (!(user === null || user === void 0 ? void 0 : user.email)) {
            return res.status(400).json({ error: "User has no email address" });
        }
        // Fetch admin users
        const adminSnap = yield firebase_1.db
            .collection("users")
            .where("type", "==", "admin")
            .get();
        const platformUrl = process.env.PLATFROM_URL || "http://localhost:5173";
        const adminEmails = adminSnap.docs
            .map((doc) => doc.data())
            .filter((u) => u.email)
            .map((admin) => ({
            email: admin.email,
            html: (0, emailTemplates_1.generateAdminEmailTemplate)(contractData, user, platformUrl),
        }));
        // Send to all admins
        yield Promise.all(adminEmails.map(({ email, html }) => (0, mailer_1.sendMail)({
            to: email,
            subject: "🚗 New Rental Contract Submitted",
            html,
        })));
        // Send confirmation to customer
        const customerHtml = (0, emailTemplates_1.generateCustomerEmailTemplate)(contractData, user);
        yield (0, mailer_1.sendMail)({
            to: user.email,
            subject: "✅ Your Rental Contract Submission",
            html: customerHtml,
        });
        res.json({ success: true });
    }
    catch (err) {
        console.error("Email sending failed:", err);
        res.status(500).json({ error: "Failed to send email" });
    }
}));
app.post("/sendEmailWithAttachment", firebase_1.authenticateFirebaseToken, firebase_1.ensureLoggedIn, upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contractDataStr = req.body.contractData;
    const file = req.file;
    if (!contractDataStr || !file) {
        return res.status(400).json({ error: "Missing data or file" });
    }
    const contractData = JSON.parse(contractDataStr);
    try {
        const userSnap = yield firebase_1.db
            .collection("users")
            .doc(contractData.userId)
            .get();
        if (!userSnap.exists)
            return res.status(404).json({ error: "User not found" });
        const user = userSnap.data();
        const customerHtml = (0, emailTemplates_1.generateCustomerEmailTemplateWithAttachments)(contractData, user);
        yield (0, mailer_1.sendMail)({
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
        res.json({ success: true });
    }
    catch (err) {
        console.error("Email sending with attachment failed:", err);
        res.status(500).json({ error: "Failed to send email with attachment" });
    }
}));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
