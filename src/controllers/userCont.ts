import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { BASE_URL, SECRET } from "../global";
import md5 from "md5" // untuk enkripsi password
import fs from "fs"
import { sign } from "jsonwebtoken";