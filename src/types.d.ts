import { Role } from "@prisma/client";
import { Request } from "express";

export interface CustomRequest extends Request {
    user?: {
        id?: number;
        role?: Role;
    };
    existedImg?: {
        id: number;
        kos_id: number;
        file: string;
        isThumbnail: boolean;
    }[];
}
