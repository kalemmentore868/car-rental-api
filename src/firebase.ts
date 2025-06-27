import * as firebase from "firebase-admin";
import * as serviceAccount from "./car-rental.json";
import { NextFunction, Request, Response } from "express";

const params = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url,
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
