import { supabase } from "@/services/supabase.ts";
import type { Request, Response } from "express";
import { logger, gatewayResponse, validateSignUp, validateSignIn } from "@/helpers/index.ts";
// import { createDbAccount } from "@/handlers/accounts/accounts.methods.ts";

export const signUpWithSupabase = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    logger.error({ msg: "Unable to sign up", err: error });
    console.log("hello=============", error);
    return null;
  }

  return data.user;
};

export const signUp = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const validateResult = validateSignUp({ firstName, lastName, email, password });

    if (validateResult.isValid === false) {
      const errorMessage = "Invalid user input";
      const response = gatewayResponse().error(400, new Error(errorMessage), errorMessage);
      return res.status(response.code).send({ ...response, type: "valid", data: validateResult });
    }

    const getData = await supabase.from("admins").select("*").eq("email", email);
    if (getData.error) {
      const response = gatewayResponse().error(400, getData.error, "Unable to get data in DB");
      return res.status(response.code).send(response);
    }
    if (getData.data.length > 0) {
      const response = gatewayResponse().error(400, new Error("User already exists"), "User already exists");
      return res.status(response.code).send({ ...response, type: "exists" });
    }

    const user = await signUpWithSupabase(email, password);
    if (!user) {
      const errorMessage = "Unable to sign up";
      const response = gatewayResponse().error(400, new Error(errorMessage), errorMessage);
      return res.status(response.code).send({ response, type: "unable" });
    }
    logger.info({ msg: `User signed up with id: ${user.id}` });

    const { data, error } = await supabase.from("admins").insert({
      name: firstName + " " + lastName,
      email,
    });
    if (error) {
      const response = gatewayResponse().error(400, error, "Unable to create account in DB");
      return res.status(response.code).send(response);
    }
    const response = gatewayResponse().success(200, `Account created in DB with id: ${data}`);
    return res.status(response.code).send(response);

  } catch (err) {
    const error = err as Error;

    const message = "Unable to sign up";

    logger.error({ msg: message, err });

    const response = gatewayResponse().error(400, error, error.message);

    return res.status(response.code).send(response);
  }
};

// TODO add httpOnly cookie for sessions.. https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security
export const signInWithPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const validateResult = validateSignIn({ email, password });

  if (validateResult.isValid === false) {
    const errorMessage = "Invalid user input";
    const response = gatewayResponse().error(400, new Error(errorMessage), errorMessage);
    return res.status(response.code).send({ ...response, type: "valid", data: validateResult });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const response = gatewayResponse().error(400, error, "Unable to sign in with password");
    return res.status(response.code).send({ ...response, type: "unable" });
  }

  logger.info("User signed in", 200, data.user.id);
  const response = gatewayResponse().success(200, data);

  return res.status(response.code).send(response);
};
