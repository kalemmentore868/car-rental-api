import * as firebase from "firebase-admin";
import { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

const params = {
  type: process.env.SERVICE_ACCOUNT_TYPE,
  projectId: process.env.PROJECT_ID,
  privateKeyId: process.env.PRIVATE_KEY_ID,
  privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"), // fix escaped newlines
  clientEmail: process.env.CLIENT_EMAIL,
  clientId: process.env.CLIENT_ID,
  authUri: process.env.AUTH_URI,
  tokenUri: process.env.TOKEN_URI,
  authProviderX509CertUrl: process.env.AUTH_PROVIDER_X509_CERT_URL,
  clientC509CertUrl: process.env.CLIENT_X509_CERT_URL,
};

firebase.initializeApp({
  credential: firebase.credential.cert(params),
});

export const db = firebase.firestore();
export const auth = firebase.auth();

export const authenticateFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    res.locals.user = decodedToken;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

/**
 * Middleware: Ensures user is authenticated.
 */
export const ensureLoggedIn = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  if (!res.locals.user) {
    return res.status(401).json({ error: "You must be logged in." });
  }
  next();
};
