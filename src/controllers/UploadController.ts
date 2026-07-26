import { Request, Response } from "express";

export class UploadController {
  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo foi enviado." });
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      return res.status(201).json({
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Erro ao realizar upload:", error);
      return res.status(500).json({ error: "Erro interno ao processar o upload do arquivo." });
    }
  }
}

export const uploadController = new UploadController();
