import { Router } from "express";
import { usersRouter } from "./users.routes.ts";
import { authRouter } from "./auth.routes.ts";

const routes = Router();

routes.use("/users", usersRouter);
routes.use("/auth", authRouter);

export { routes };