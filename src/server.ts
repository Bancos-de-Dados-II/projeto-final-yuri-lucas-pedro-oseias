import express from "express";
import { v4 as uuidv4 } from "uuid";


import { prismaService } from "./services/prisma.ts";


server.listen(3333, () => {
  console.log("servidor online na porta 3333");
});
