import { Request, Response } from "express";
import { mapaService } from "../services/MapaService.ts";
import { AppError } from "../utils/AppError.ts";

export class MapaController {
  async getGeoJson(req: Request, res: Response) {
    try {
      const { data, cacheHeader } = await mapaService.getGeoJson();
      res.setHeader("X-Cache", cacheHeader);
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(JSON.stringify(data));
    } catch (error) {
      console.error("Erro ao obter GeoJSON dos municípios da PB:", error);
      return res.status(500).json({ error: "Erro interno ao carregar mapa da PB." });
    }
  }

  async invalidateCache(req: Request, res: Response) {
    try {
      await mapaService.clearCache();
      return res.json({ message: "Cache do GeoJSON dos municípios da PB no Redis invalidado com sucesso." });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: "Erro ao limpar cache do Redis." });
    }
  }
}

export const mapaController = new MapaController();
